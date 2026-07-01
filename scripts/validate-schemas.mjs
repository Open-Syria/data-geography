import { access, readdir } from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readJson } from './lib/data-schemas.mjs';

const root = process.cwd();
const schemasDirectory = path.join(root, 'schemas');
const exampleNameBySchemaName = {
  districts: 'district',
  governorates: 'governorate',
  localities: 'locality',
  sources: 'source',
  subdistricts: 'subdistrict',
};

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

async function listSchemaFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listSchemaFiles(entryPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.schema.json')) {
      files.push(entryPath);
    }
  }

  return files.sort();
}

function ensureRequiredSchemaFields(schema, relativePath) {
  const requiredFields = ['$schema', '$id', 'title', 'type'];

  for (const field of requiredFields) {
    if (!schema[field]) {
      throw new Error(`${relativePath} is missing required schema field: ${field}`);
    }
  }
}

function formatValidationErrors(errors) {
  return (errors ?? []).map((error) => `${error.instancePath || '/'} ${error.message}`).join('; ');
}

async function listJsonFiles(directory) {
  if (!(await fileExists(directory))) {
    return [];
  }

  const entries = await readdir(directory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(directory, entry.name))
    .sort();
}

async function getValidationTargets(schemaFile) {
  const schemaName = path.basename(schemaFile, '.schema.json');
  const targets = [];

  for (const dataDirectory of ['data', path.join('fixtures', 'valid-data')]) {
    const dataFile = path.join(root, dataDirectory, `${schemaName}.json`);

    if (await fileExists(dataFile)) {
      targets.push({
        filePath: dataFile,
        value: await readJson(dataFile),
      });
    }
  }

  const exampleName = exampleNameBySchemaName[schemaName];
  const exampleFile = exampleName
    ? path.join(root, 'examples', `${exampleName}.example.json`)
    : undefined;

  if (exampleFile && (await fileExists(exampleFile))) {
    targets.push({
      filePath: exampleFile,
      value: [await readJson(exampleFile)],
    });
  }

  if (schemaName === 'source-import') {
    for (const manifestFile of await listJsonFiles(path.join(root, 'imports', 'manifests'))) {
      targets.push({
        filePath: manifestFile,
        value: await readJson(manifestFile),
      });
    }
  }

  return targets;
}

const schemaFiles = await listSchemaFiles(schemasDirectory);
const seenIds = new Set();
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validatedTargets = [];

addFormats(ajv);

for (const schemaFile of schemaFiles) {
  const relativePath = path.relative(root, schemaFile).replaceAll('\\', '/');
  const schema = await readJson(schemaFile);

  ensureRequiredSchemaFields(schema, relativePath);

  if (seenIds.has(schema.$id)) {
    throw new Error(`duplicate schema $id: ${schema.$id}`);
  }

  seenIds.add(schema.$id);

  const validate = ajv.compile(schema);

  for (const target of await getValidationTargets(schemaFile)) {
    const isValid = validate(target.value);

    if (!isValid) {
      const targetPath = path.relative(root, target.filePath).replaceAll('\\', '/');

      throw new Error(
        `${targetPath} failed ${relativePath} validation: ${formatValidationErrors(
          validate.errors,
        )}`,
      );
    }

    validatedTargets.push({
      schema: relativePath,
      target: path.relative(root, target.filePath).replaceAll('\\', '/'),
    });
  }
}

console.log(
  JSON.stringify(
    {
      ok: true,
      schemas: schemaFiles.length,
      validationTargets: validatedTargets.length,
      files: schemaFiles.map((schemaFile) => path.relative(root, schemaFile).replaceAll('\\', '/')),
      targets: validatedTargets,
    },
    null,
    2,
  ),
);
