import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

const defaultDataDir = 'data';
const defaultAdmin1Path = 'imports/raw/2026-06-27-governorates/geonames-admin1-sy.txt';
const defaultGeoNamesPath =
  'imports/raw/2026-06-28-localities/geonames-sy-populated-place-records.tsv';
const defaultReportPath =
  'imports/raw/2026-06-28-localities/geonames-locality-widened-radius-report-2026-06-28.json';
const sourceId = 'geonames-sy';

const arabicLetters = /[\u0600-\u06FF]/;
const arabicDiacritics = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;

const latinVariants = [
  [/\b(al|el|ash|as|ad|az|ar|at|an)\b/g, 'al'],
  [/\bain\b/g, 'ayn'],
  [/\bein\b/g, 'ayn'],
  [/\btell\b/g, 'tal'],
  [/\btel\b/g, 'tal'],
  [/\bjabal\b/g, 'jbel'],
  [/\bkhirbat\b/g, 'kherbet'],
];

const featureCodeRank = new Map([
  ['PPLC', 1],
  ['PPLA', 2],
  ['PPLA2', 3],
  ['PPLA3', 4],
  ['PPL', 5],
  ['PPLL', 6],
  ['PPLX', 7],
  ['PPLQ', 8],
  ['PPLF', 9],
  ['PPLS', 10],
  ['PPLW', 11],
  ['STLMT', 12],
]);

const options = parseOptions(process.argv.slice(2));
const dataDir = path.resolve(root, options.dataDir ?? defaultDataDir);
const admin1Path = path.resolve(root, options.admin1Path ?? defaultAdmin1Path);
const geonamesPath = path.resolve(root, options.geonamesPath ?? defaultGeoNamesPath);
const reportPath = path.resolve(root, options.reportPath ?? defaultReportPath);
const maxDistanceKm = options.maxDistanceKm ?? 5;

const [localities, governorates, admin1Text, geonamesText] = await Promise.all([
  readJson(path.join(dataDir, 'localities.json')),
  readJson(path.join(dataDir, 'governorates.json')),
  readFile(admin1Path, 'utf8'),
  readFile(geonamesPath, 'utf8'),
]);

const governorateIdByGeoNamesId = new Map(
  governorates.map((governorate) => [governorate.externalIds?.geonames, governorate.id]),
);
const governorateIdByAdmin1Code = parseAdmin1Codes(admin1Text, governorateIdByGeoNamesId);
const geonamesRows = parseGeoNamesRows(geonamesText, governorateIdByAdmin1Code);

for (const row of geonamesRows) {
  row.names = collectGeoNamesNames(row);
}

const usedGeoNamesIds = new Set(
  localities.map((locality) => locality.externalIds?.geonames).filter(Boolean),
);
const availableGeoNamesRows = geonamesRows.filter((row) => !usedGeoNamesIds.has(row.geonamesId));
const unmatchedLocalities = localities.filter(
  (locality) => !locality.externalIds?.geonames && locality.centroid,
);

for (const locality of unmatchedLocalities) {
  locality.names = collectLocalityNames(locality);
}

const { candidateMatchesByLocality, candidateMatchesByGeoNamesId } = findCandidateMatches(
  unmatchedLocalities,
  availableGeoNamesRows,
  maxDistanceKm,
);
const accepted = selectOneToOneMatches(candidateMatchesByLocality, candidateMatchesByGeoNamesId);
const acceptedLocalityIds = new Set(accepted.map((match) => match.localityId));
const acceptedGeoNamesIds = new Set(accepted.map((match) => match.geonamesId));
const skippedLocalities = [...candidateMatchesByLocality.entries()]
  .filter(([localityId, candidates]) => {
    if (acceptedLocalityIds.has(localityId)) {
      return false;
    }

    return candidates.length > 0;
  })
  .map(([localityId, candidates]) => ({
    localityId,
    candidates: candidates.map(toReportCandidate),
  }));
const duplicateGeoNames = [...candidateMatchesByGeoNamesId.entries()]
  .filter(
    ([geonamesId, candidates]) => !acceptedGeoNamesIds.has(geonamesId) && candidates.length > 1,
  )
  .map(([geonamesId, candidates]) => ({
    geonamesId,
    candidates: candidates.map(toReportCandidate),
  }));

const report = {
  generatedAt: new Date().toISOString(),
  source: {
    id: sourceId,
    file: toRepoPath(geonamesPath),
    candidateFeatureCodes: [...new Set(geonamesRows.map((row) => row.featureCode))].sort(
      compareFeatureCodes,
    ),
  },
  method: {
    matchDirection:
      'existing OpenSyria localities without GeoNames IDs to unused GeoNames populated-place records',
    maxDistanceKm,
    governorateConstraint:
      'GeoNames admin1 code must resolve to the same OpenSyria governorate when the code is present',
    requiredNameMatch:
      'at least one normalized canonical name or alias must match a normalized GeoNames name, ASCII name, or alternate name, including selected article-insensitive variants',
    acceptanceRule:
      'single candidate per locality and one locality per GeoNames ID inside this widened-radius pass',
    importPolicy:
      'add only externalIds.geonames and the geonames-sy source reference; do not add aliases, change kind, or create records',
  },
  counts: {
    localitiesReviewed: unmatchedLocalities.length,
    geonamesCandidateRows: availableGeoNamesRows.length,
    candidateLocalities: candidateMatchesByLocality.size,
    candidateMatches: [...candidateMatchesByLocality.values()].reduce(
      (total, candidates) => total + candidates.length,
      0,
    ),
    acceptedMatches: accepted.length,
    skippedLocalities: skippedLocalities.length,
    duplicateGeoNames: duplicateGeoNames.length,
  },
  acceptedFeatureCodeCounts: countBy(accepted, (match) => match.featureCode),
  acceptedDistanceBands: {
    lte1km: accepted.filter((match) => match.distanceKm <= 1).length,
    lte2km: accepted.filter((match) => match.distanceKm <= 2).length,
    lte3km: accepted.filter((match) => match.distanceKm <= 3).length,
    lte5km: accepted.filter((match) => match.distanceKm <= 5).length,
  },
  accepted: accepted.map(toReportCandidate),
  skipped: {
    localities: skippedLocalities,
    duplicateGeoNames,
  },
};

await mkdir(path.dirname(reportPath), { recursive: true });
await writeJson(reportPath, report);

if (options.apply) {
  const acceptedByLocalityId = new Map(accepted.map((match) => [match.localityId, match]));
  const updatedLocalities = localities.map((locality) => {
    const { names: _names, ...cleanLocality } = locality;
    const match = acceptedByLocalityId.get(locality.id);

    if (!match) {
      return cleanLocality;
    }

    return {
      ...cleanLocality,
      externalIds: {
        geonames: match.geonamesId,
        ...locality.externalIds,
      },
      sourceIds: locality.sourceIds.includes(sourceId)
        ? locality.sourceIds
        : [...locality.sourceIds, sourceId],
    };
  });

  await writeJson(path.join(dataDir, 'localities.json'), updatedLocalities);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      applied: options.apply,
      maxDistanceKm,
      reportPath: toRepoPath(reportPath),
      counts: report.counts,
      acceptedDistanceBands: report.acceptedDistanceBands,
      acceptedFeatureCodeCounts: report.acceptedFeatureCodeCounts,
    },
    null,
    2,
  ),
);

function parseOptions(args) {
  const parsed = {
    apply: false,
    dataDir: undefined,
    admin1Path: undefined,
    geonamesPath: undefined,
    reportPath: undefined,
    maxDistanceKm: undefined,
  };

  for (const arg of args) {
    if (arg === '--apply') {
      parsed.apply = true;
      continue;
    }

    const [key, value] = arg.split('=', 2);

    if (value === undefined || value === '') {
      throw new Error(`Unsupported or missing option value: ${arg}`);
    }

    if (key === '--data-dir') {
      parsed.dataDir = value;
    } else if (key === '--admin1-path') {
      parsed.admin1Path = value;
    } else if (key === '--geonames-path') {
      parsed.geonamesPath = value;
    } else if (key === '--report-path') {
      parsed.reportPath = value;
    } else if (key === '--max-distance-km') {
      parsed.maxDistanceKm = Number(value);

      if (!Number.isFinite(parsed.maxDistanceKm) || parsed.maxDistanceKm <= 0) {
        throw new Error(`Invalid --max-distance-km value: ${value}`);
      }
    } else {
      throw new Error(`Unsupported option: ${key}`);
    }
  }

  return parsed;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${stringifyJson(value)}\n`);
}

function stringifyJson(value) {
  return JSON.stringify(value, null, 2).replace(
    /^(\s*)"sourceIds": \[\n((?:\s+"[^"]+",?\n)+)\s*\]/gm,
    (_match, indent, body) => {
      const items = [...body.matchAll(/"([^"]+)"/g)].map(([, item]) => `"${item}"`);
      return `${indent}"sourceIds": [${items.join(', ')}]`;
    },
  );
}

function parseAdmin1Codes(text, governorateIdByGeoNamesId) {
  const result = new Map();

  for (const line of text.split(/\r?\n/).filter(Boolean)) {
    const [code, , , geonamesId] = line.split('\t');
    result.set(code.split('.')[1], governorateIdByGeoNamesId.get(geonamesId));
  }

  return result;
}

function parseGeoNamesRows(text, governorateIdByAdmin1Code) {
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [
        geonamesId,
        name,
        asciiname,
        alternatenames,
        latitude,
        longitude,
        featureClass,
        featureCode,
        countryCode,
        admin1Code,
        admin2Code,
        admin3Code,
        admin4Code,
      ] = line.split('\t');

      return {
        geonamesId,
        name,
        asciiname,
        alternatenames: alternatenames ?? '',
        latitude: Number(latitude),
        longitude: Number(longitude),
        featureClass,
        featureCode,
        countryCode,
        admin1Code,
        admin2Code,
        admin3Code,
        admin4Code,
        governorateId: governorateIdByAdmin1Code.get(admin1Code),
      };
    });
}

function findCandidateMatches(localitiesToMatch, geonamesToMatch, maxDistance) {
  const candidateMatchesByLocality = new Map();
  const candidateMatchesByGeoNamesId = new Map();

  for (const locality of localitiesToMatch) {
    const candidates = [];

    for (const geonames of geonamesToMatch) {
      if (geonames.governorateId && geonames.governorateId !== locality.governorateId) {
        continue;
      }

      const distanceKm = distanceBetween(locality.centroid, geonames);

      if (distanceKm > maxDistance) {
        continue;
      }

      const matchedNames = [...locality.names.keys()].filter((name) => geonames.names.has(name));

      if (matchedNames.length === 0) {
        continue;
      }

      const candidate = {
        localityId: locality.id,
        localityName: locality.name.en,
        localityArabicName: locality.name.ar,
        localityGovernorateId: locality.governorateId,
        localityDistrictId: locality.districtId,
        localitySubdistrictId: locality.subdistrictId,
        localityLatitude: locality.centroid.latitude,
        localityLongitude: locality.centroid.longitude,
        geonamesId: geonames.geonamesId,
        geonamesName: geonames.name,
        geonamesAsciiName: geonames.asciiname,
        featureCode: geonames.featureCode,
        geonamesGovernorateId: geonames.governorateId,
        geonamesAdmin1Code: geonames.admin1Code,
        geonamesLatitude: geonames.latitude,
        geonamesLongitude: geonames.longitude,
        distanceKm: Number(distanceKm.toFixed(3)),
        matchedNames,
        matchSources: matchedNames.map((name) => ({
          name,
          locality: locality.names.get(name).sources,
          geonames: geonames.names.get(name).sources,
        })),
      };

      candidates.push(candidate);

      if (!candidateMatchesByGeoNamesId.has(geonames.geonamesId)) {
        candidateMatchesByGeoNamesId.set(geonames.geonamesId, []);
      }

      candidateMatchesByGeoNamesId.get(geonames.geonamesId).push(candidate);
    }

    if (candidates.length > 0) {
      candidateMatchesByLocality.set(locality.id, candidates.sort(compareCandidates));
    }
  }

  return {
    candidateMatchesByLocality,
    candidateMatchesByGeoNamesId,
  };
}

function selectOneToOneMatches(candidateMatchesByLocality, candidateMatchesByGeoNamesId) {
  return [...candidateMatchesByLocality.values()]
    .filter((candidates) => {
      if (candidates.length !== 1) {
        return false;
      }

      return candidateMatchesByGeoNamesId.get(candidates[0].geonamesId).length === 1;
    })
    .map((candidates) => candidates[0])
    .sort(compareCandidates);
}

function collectLocalityNames(locality) {
  const names = new Map();
  addName(names, locality.name.en, 'locality.name.en');
  addName(names, locality.name.ar, 'locality.name.ar');

  for (const alias of locality.aliases ?? []) {
    const language = alias.language ?? 'und';
    addName(names, alias.value, `locality.alias.${language}`);
  }

  return names;
}

function collectGeoNamesNames(row) {
  const names = new Map();
  addName(names, row.name, 'geonames.name');
  addName(names, row.asciiname, 'geonames.asciiname');

  for (const alternate of row.alternatenames.split(',')) {
    addName(names, alternate, 'geonames.alternate');
  }

  return names;
}

function addName(names, value, source) {
  const normalized = normalizeName(value);

  if (!normalized) {
    return;
  }

  addNormalizedName(names, normalized, source);

  if (/^[a-z0-9 ]+$/.test(normalized) && normalized.startsWith('al ')) {
    addNormalizedName(names, normalized.slice(3), `${source}:without-article`);
  }

  if (/^[\u0600-\u06FF0-9 ]+$/.test(normalized) && normalized.startsWith('\u0627\u0644')) {
    const withoutArticle = normalized.slice(2);

    if (withoutArticle.length > 2) {
      addNormalizedName(names, withoutArticle, `${source}:without-article`);
    }
  }
}

function addNormalizedName(names, normalized, source) {
  if (!names.has(normalized)) {
    names.set(normalized, {
      value: normalized,
      sources: [],
    });
  }

  names.get(normalized).sources.push(source);
}

function normalizeName(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (arabicLetters.test(trimmed)) {
    return normalizeArabicName(trimmed) || null;
  }

  let normalized = trimmed
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[‘’ʻ`´\u02BF\u02BE]/g, '')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  for (const [pattern, replacement] of latinVariants) {
    normalized = normalized.replace(pattern, replacement).replace(/\s+/g, ' ').trim();
  }

  return normalized || null;
}

function normalizeArabicName(value) {
  return value
    .replace(arabicDiacritics, '')
    .replace(/[\u0625\u0623\u0622\u0671]/g, '\u0627')
    .replace(/\u0649/g, '\u064A')
    .replace(/\u0629/g, '\u0647')
    .replace(/\u0624/g, '\u0648')
    .replace(/\u0626/g, '\u064A')
    .replace(/[^\u0600-\u06FF0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function distanceBetween(first, second) {
  const earthRadiusKm = 6371;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.sin(longitudeDelta / 2) ** 2 * Math.cos(firstLatitude) * Math.cos(secondLatitude);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function compareCandidates(first, second) {
  return (
    first.localityId.localeCompare(second.localityId) ||
    first.distanceKm - second.distanceKm ||
    compareFeatureCodes(first.featureCode, second.featureCode) ||
    first.geonamesId.localeCompare(second.geonamesId)
  );
}

function compareFeatureCodes(first, second) {
  return (featureCodeRank.get(first) ?? 999) - (featureCodeRank.get(second) ?? 999);
}

function countBy(items, getKey) {
  return Object.fromEntries(
    [
      ...items.reduce((counts, item) => {
        const key = getKey(item);
        counts.set(key, (counts.get(key) ?? 0) + 1);
        return counts;
      }, new Map()),
    ].sort(
      ([first], [second]) => compareFeatureCodes(first, second) || first.localeCompare(second),
    ),
  );
}

function toReportCandidate(candidate) {
  return {
    localityId: candidate.localityId,
    localityName: candidate.localityName,
    localityArabicName: candidate.localityArabicName,
    localityGovernorateId: candidate.localityGovernorateId,
    localityDistrictId: candidate.localityDistrictId,
    localitySubdistrictId: candidate.localitySubdistrictId,
    localityLatitude: candidate.localityLatitude,
    localityLongitude: candidate.localityLongitude,
    geonamesId: candidate.geonamesId,
    geonamesName: candidate.geonamesName,
    geonamesAsciiName: candidate.geonamesAsciiName,
    featureCode: candidate.featureCode,
    geonamesGovernorateId: candidate.geonamesGovernorateId,
    geonamesAdmin1Code: candidate.geonamesAdmin1Code,
    geonamesLatitude: candidate.geonamesLatitude,
    geonamesLongitude: candidate.geonamesLongitude,
    distanceKm: candidate.distanceKm,
    matchedNames: candidate.matchedNames,
    matchSources: candidate.matchSources,
  };
}

function toRepoPath(filePath) {
  return path.relative(root, filePath).replaceAll('\\', '/');
}
