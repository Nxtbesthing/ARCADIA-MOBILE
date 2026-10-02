import { infinixCatalog } from '../../src/infinix-catalog.js';
import { iphoneCatalog } from '../../src/iphone-catalog.js';
import { itelCatalog } from '../../src/itel-catalog.js';
import { redmiCatalog } from '../../src/redmi-catalog.js';
import { samsungCatalog } from '../../src/samsung-catalog.js';
import { tecnoCatalog } from '../../src/tecno-catalog.js';

const catalogs = [
  ['Apple', iphoneCatalog],
  ['Samsung', samsungCatalog],
  ['REDMI', redmiCatalog],
  ['TECNO', tecnoCatalog],
  ['itel', itelCatalog],
  ['Infinix', infinixCatalog]
];

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function key(...parts) {
  return parts.map((part) => String(part).trim().toLowerCase()).join('|');
}

function uuidFor(...parts) {
  return `md5(${sqlString(`arcadia-catalog:${key(...parts)}`)})::uuid`;
}

const manufacturers = new Map();
const series = new Map();
const models = new Map();
const storageOptions = new Map();
const colors = new Map();

for (const [manufacturerName, catalog] of catalogs) {
  manufacturers.set(key(manufacturerName), { manufacturerName });

  for (const [modelName, modelDefinition] of Object.entries(catalog)) {
    const seriesName = modelDefinition.series || modelName;
    const manufacturerKey = key(manufacturerName);
    const seriesKey = key(manufacturerName, seriesName);
    const modelKey = key(manufacturerName, seriesName, modelName);

    series.set(seriesKey, { manufacturerName, seriesName });
    models.set(modelKey, { manufacturerName, seriesName, modelName });

    for (const [storageLabel, colorEntries] of Object.entries(modelDefinition.storages || {})) {
      const storageKey = key(manufacturerName, seriesName, modelName, storageLabel);
      storageOptions.set(storageKey, { manufacturerName, seriesName, modelName, storageLabel });

      for (const colorEntry of colorEntries) {
        const colorName = typeof colorEntry === 'string' ? colorEntry : colorEntry.color;
        colors.set(key(storageKey, colorName), { manufacturerName, seriesName, modelName, storageLabel, colorName });
      }
    }
  }
}

const lines = [
  '-- Generated from the existing Arcadia catalog source modules.',
  '-- Do not edit this output to add or remove specifications.',
  '-- Re-running this script produces deterministic UUIDs and idempotent upserts.',
  'begin;',
  '',
  ...[...manufacturers.values()].map(({ manufacturerName }) =>
    `insert into public.manufacturers (id, name) values (${uuidFor('manufacturer', manufacturerName)}, ${sqlString(manufacturerName)}) on conflict (name) do update set updated_at = now();`
  ),
  '',
  ...[...series.values()].map(({ manufacturerName, seriesName }) =>
    `insert into public.manufacturer_series (id, manufacturer_id, name) values (${uuidFor('series', manufacturerName, seriesName)}, ${uuidFor('manufacturer', manufacturerName)}, ${sqlString(seriesName)}) on conflict (manufacturer_id, name) do update set updated_at = now();`
  ),
  '',
  ...[...models.values()].map(({ manufacturerName, seriesName, modelName }) =>
    `insert into public.manufacturer_models (id, series_id, name) values (${uuidFor('model', manufacturerName, seriesName, modelName)}, ${uuidFor('series', manufacturerName, seriesName)}, ${sqlString(modelName)}) on conflict (series_id, name) do update set updated_at = now();`
  ),
  '',
  ...[...storageOptions.values()].map(({ manufacturerName, seriesName, modelName, storageLabel }) =>
    `insert into public.model_storage_options (id, model_id, storage_label) values (${uuidFor('storage', manufacturerName, seriesName, modelName, storageLabel)}, ${uuidFor('model', manufacturerName, seriesName, modelName)}, ${sqlString(storageLabel)}) on conflict (model_id, storage_label) do update set updated_at = now();`
  ),
  '',
  ...[...colors.values()].map(({ manufacturerName, seriesName, modelName, storageLabel, colorName }) =>
    `insert into public.model_storage_colors (storage_option_id, color_name) values (${uuidFor('storage', manufacturerName, seriesName, modelName, storageLabel)}, ${sqlString(colorName)}) on conflict (storage_option_id, color_name) do nothing;`
  ),
  '',
  'commit;',
  '',
  `-- Counts: manufacturers=${manufacturers.size}, series=${series.size}, models=${models.size}, storage_options=${storageOptions.size}, colors=${colors.size}`
];

process.stdout.write(lines.join('\n') + '\n');
