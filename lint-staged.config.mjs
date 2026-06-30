export default {
  '*.{js,mjs,json,jsonc,md,yml,yaml}': ['biome check --write --no-errors-on-unmatched'],
  'data/**/*.json': ['pnpm run validate:data'],
  'fixtures/**/*.json': ['pnpm run validate:fixtures'],
  'imports/manifests/**/*.json': ['pnpm run validate:imports'],
};
