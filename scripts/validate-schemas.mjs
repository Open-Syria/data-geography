import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { readJson } from './lib/data-schemas.mjs';

const root = process.cwd();
const schemasDirectory = path.join(root, 'schemas');

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

const schemaFiles = await listSchemaFiles(schemasDirectory);
const seenIds = new Set();

for (const schemaFile of schemaFiles) {
  const relativePath = path.relative(root, schemaFile).replaceAll('\\', '/');
  const schema = await readJson(schemaFile);

  ensureRequiredSchemaFields(schema, relativePath);

  if (seenIds.has(schema.$id)) {
    throw new Error(`duplicate schema $id: ${schema.$id}`);
  }

  seenIds.add(schema.$id);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      schemas: schemaFiles.length,
      files: schemaFiles.map((schemaFile) => path.relative(root, schemaFile).replaceAll('\\', '/')),
    },
    null,
    2,
  ),
);
