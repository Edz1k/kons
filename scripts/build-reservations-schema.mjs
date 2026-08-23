#!/usr/bin/env node
/**
 * Дополняет снапшот схемы Directus коллекцией резервов.
 *
 *   node scripts/build-reservations-schema.mjs snapshot.yaml > snapshot-with-reservations.yaml
 *
 * Полученный файл применяется на сервере штатной командой Directus:
 *   directus schema apply --yes snapshot-with-reservations.yaml
 */

import { readFileSync } from 'node:fs'
import process from 'node:process'
import yaml from 'js-yaml'

const STATUS_CHOICES = [
  { text: 'Активен', value: 'active', foreground: '#FFFFFF', background: '#2563EB' },
  { text: 'Купил', value: 'confirmed', foreground: '#FFFFFF', background: '#059669' },
  { text: 'Отказ', value: 'cancelled', foreground: '#FFFFFF', background: '#64748B' },
  { text: 'Истёк', value: 'expired', foreground: '#FFFFFF', background: '#DC2626' },
]

const source = process.argv[2]

if (!source) {
  process.stderr.write('Укажите путь к снапшоту: node scripts/build-reservations-schema.mjs snapshot.yaml\n')
  process.exit(1)
}

const snapshot = yaml.load(readFileSync(source, 'utf8'))

function meta(collection, field, overrides = {}) {
  return {
    collection,
    conditions: null,
    display: null,
    display_options: null,
    field,
    group: null,
    hidden: false,
    interface: null,
    note: null,
    options: null,
    readonly: false,
    required: false,
    searchable: true,
    sort: null,
    special: null,
    translations: null,
    validation: null,
    validation_message: null,
    width: 'full',
    ...overrides,
  }
}

function schema(table, name, dataType, overrides = {}) {
  return {
    name,
    table,
    data_type: dataType,
    default_value: null,
    max_length: null,
    numeric_precision: null,
    numeric_scale: null,
    is_nullable: true,
    is_unique: false,
    is_indexed: false,
    is_primary_key: false,
    is_generated: false,
    generation_expression: null,
    has_auto_increment: false,
    foreign_key_table: null,
    foreign_key_column: null,
    ...overrides,
  }
}

function field(collection, name, type, metaOverrides, schemaOverrides) {
  return {
    collection,
    field: name,
    type,
    meta: meta(collection, name, metaOverrides),
    schema: schema(collection, name, schemaOverrides.data_type, schemaOverrides),
  }
}

const RESERVATIONS = 'reservations'

const collection = {
  collection: RESERVATIONS,
  meta: {
    accountability: 'all',
    archive_app_filter: true,
    archive_field: 'status',
    archive_value: 'cancelled',
    collapse: 'open',
    collection: RESERVATIONS,
    color: '#2563EB',
    display_template: '{{product.title}} — {{quantity}} шт.',
    group: null,
    hidden: false,
    icon: 'bookmark',
    item_duplication_fields: null,
    note: 'Резервы товаров клиентами. Срок — 3 дня, дальше резерв истекает автоматически.',
    preview_url: null,
    singleton: false,
    sort: null,
    sort_field: null,
    translations: null,
    unarchive_value: 'active',
    versioning: false,
  },
  schema: { name: RESERVATIONS },
}

const fields = [
  field(RESERVATIONS, 'id', 'integer', {
    hidden: true,
    interface: 'input',
    readonly: true,
    sort: 1,
  }, {
    data_type: 'integer',
    is_nullable: false,
    is_primary_key: true,
    has_auto_increment: true,
    numeric_precision: 32,
    numeric_scale: 0,
  }),

  field(RESERVATIONS, 'status', 'string', {
    interface: 'select-dropdown',
    display: 'labels',
    display_options: { showAsDot: false, choices: STATUS_CHOICES },
    options: { choices: STATUS_CHOICES },
    note: 'Менеджер отмечает исход: купил или отказ.',
    width: 'half',
    sort: 2,
    required: true,
  }, {
    data_type: 'character varying',
    max_length: 32,
    default_value: 'active',
    is_nullable: false,
  }),

  field(RESERVATIONS, 'user', 'uuid', {
    interface: 'select-dropdown-m2o',
    display: 'related-values',
    display_options: { template: '{{first_name}} {{last_name}} {{email}}' },
    options: { template: '{{first_name}} {{last_name}} {{email}}' },
    special: ['m2o'],
    note: 'Клиент, за которым закреплён товар.',
    width: 'half',
    sort: 3,
    required: true,
  }, {
    data_type: 'uuid',
    is_nullable: false,
    foreign_key_table: 'directus_users',
    foreign_key_column: 'id',
  }),

  field(RESERVATIONS, 'product', 'integer', {
    interface: 'select-dropdown-m2o',
    display: 'related-values',
    display_options: { template: '{{title}}' },
    options: { template: '{{title}}' },
    special: ['m2o'],
    width: 'half',
    sort: 4,
    required: true,
  }, {
    data_type: 'integer',
    numeric_precision: 32,
    numeric_scale: 0,
    is_nullable: false,
    foreign_key_table: 'products',
    foreign_key_column: 'id',
  }),

  field(RESERVATIONS, 'variant', 'integer', {
    interface: 'select-dropdown-m2o',
    display: 'related-values',
    display_options: { template: '{{sku}} {{color.name}}' },
    options: { template: '{{sku}} {{color.name}}' },
    special: ['m2o'],
    note: 'Конкретный цвет или размер.',
    width: 'half',
    sort: 5,
  }, {
    data_type: 'integer',
    numeric_precision: 32,
    numeric_scale: 0,
    foreign_key_table: 'product_variants',
    foreign_key_column: 'id',
  }),

  field(RESERVATIONS, 'quantity', 'integer', {
    interface: 'input',
    options: { min: 1 },
    width: 'half',
    sort: 6,
    required: true,
  }, {
    data_type: 'integer',
    numeric_precision: 32,
    numeric_scale: 0,
    default_value: 1,
    is_nullable: false,
  }),

  field(RESERVATIONS, 'reserved_at', 'timestamp', {
    interface: 'datetime',
    display: 'datetime',
    display_options: { relative: true },
    special: ['date-created'],
    readonly: true,
    width: 'half',
    sort: 7,
  }, {
    data_type: 'timestamp with time zone',
  }),

  field(RESERVATIONS, 'expires_at', 'timestamp', {
    interface: 'datetime',
    display: 'datetime',
    display_options: { relative: true },
    readonly: true,
    note: 'Ставится автоматически: момент резерва + 3 дня.',
    width: 'half',
    sort: 8,
  }, {
    data_type: 'timestamp with time zone',
  }),

  field(RESERVATIONS, 'price_at_reserve', 'decimal', {
    interface: 'input',
    readonly: true,
    note: 'Цена за штуку на момент резерва, с учётом скидки клиента.',
    width: 'half',
    sort: 9,
  }, {
    data_type: 'numeric',
    numeric_precision: 12,
    numeric_scale: 2,
  }),

  field(RESERVATIONS, 'resolved_at', 'timestamp', {
    interface: 'datetime',
    display: 'datetime',
    readonly: true,
    note: 'Когда резерв закрыли.',
    width: 'half',
    sort: 10,
  }, {
    data_type: 'timestamp with time zone',
  }),

  field(RESERVATIONS, 'resolved_by', 'uuid', {
    interface: 'select-dropdown-m2o',
    display: 'related-values',
    display_options: { template: '{{first_name}} {{last_name}} {{email}}' },
    options: { template: '{{first_name}} {{last_name}} {{email}}' },
    special: ['m2o'],
    readonly: true,
    note: 'Кто из менеджеров закрыл резерв.',
    width: 'half',
    sort: 11,
  }, {
    data_type: 'uuid',
    foreign_key_table: 'directus_users',
    foreign_key_column: 'id',
  }),

  field(RESERVATIONS, 'customer_comment', 'text', {
    interface: 'input-multiline',
    readonly: true,
    note: 'Комментарий клиента при резерве.',
    sort: 12,
  }, {
    data_type: 'text',
  }),

  field(RESERVATIONS, 'manager_note', 'text', {
    interface: 'input-multiline',
    note: 'Заметка менеджера: договорённости, итог звонка.',
    sort: 13,
  }, {
    data_type: 'text',
  }),

  field('product_variants', 'reserved_qty', 'integer', {
    interface: 'input',
    readonly: true,
    note: 'Сколько штук держат активные резервы. Считает Directus.',
    width: 'half',
  }, {
    data_type: 'integer',
    numeric_precision: 32,
    numeric_scale: 0,
    default_value: 0,
    is_nullable: false,
  }),

  field('product_variants', 'reserved_until', 'timestamp', {
    interface: 'datetime',
    display: 'datetime',
    display_options: { relative: true },
    readonly: true,
    note: 'Когда истекает ближайший резерв по этому варианту.',
    width: 'half',
  }, {
    data_type: 'timestamp with time zone',
  }),
]

function relation(fieldName, relatedCollection, onDelete) {
  return {
    collection: RESERVATIONS,
    field: fieldName,
    related_collection: relatedCollection,
    meta: {
      junction_field: null,
      many_collection: RESERVATIONS,
      many_field: fieldName,
      one_allowed_collections: null,
      one_collection: relatedCollection,
      one_collection_field: null,
      one_deselect_action: 'nullify',
      one_field: null,
      sort_field: null,
    },
    schema: {
      table: RESERVATIONS,
      column: fieldName,
      foreign_key_table: relatedCollection,
      foreign_key_column: 'id',
      constraint_name: `${RESERVATIONS}_${fieldName}_foreign`,
      on_update: 'NO ACTION',
      on_delete: onDelete,
    },
  }
}

const relations = [
  relation('user', 'directus_users', 'CASCADE'),
  relation('product', 'products', 'CASCADE'),
  relation('variant', 'product_variants', 'CASCADE'),
  relation('resolved_by', 'directus_users', 'SET NULL'),
]

function upsert(list, item, matcher) {
  const index = list.findIndex(matcher)

  if (index === -1)
    list.push(item)
  else
    list[index] = item
}

upsert(
  snapshot.collections,
  collection,
  item => item.collection === RESERVATIONS,
)

fields.forEach((item) => {
  upsert(
    snapshot.fields,
    item,
    existing => existing.collection === item.collection && existing.field === item.field,
  )
})

relations.forEach((item) => {
  upsert(
    snapshot.relations,
    item,
    existing => existing.collection === item.collection && existing.field === item.field,
  )
})

process.stdout.write(yaml.dump(snapshot, { lineWidth: 120, noRefs: true }))
