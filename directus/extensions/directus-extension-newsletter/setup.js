/**
 * При старте Directus досоздаёт всё, что нужно рассылке, если этого ещё нет:
 *  - products.announced_at и product_variants.announced_at — когда ушло письмо;
 *  - customer_profiles.newsletter_unsubscribed — клиент отписался;
 *  - коллекцию newsletter_log («Рассылки») — журнал отправок;
 *  - Flow «Разослать клиентам» с кнопкой в карточке товара.
 *
 * Ничего не удаляет и не перезаписывает: если менеджер поправил Flow руками, правки останутся.
 */

import { LOG_COLLECTION, OPERATION_ID } from './shared.js'

const ru = (translation, extra = {}) => [{ language: 'ru-RU', translation, ...extra }]

const FIELDS = [
  {
    collection: 'products',
    field: {
      field: 'announced_at',
      type: 'timestamp',
      schema: { is_nullable: true },
      meta: {
        interface: 'datetime',
        display: 'datetime',
        display_options: { relative: true },
        readonly: true,
        width: 'half',
        note: 'Когда клиентам ушло письмо о новинке. Заполняется кнопкой «Разослать клиентам».',
        translations: ru('Разослано клиентам'),
      },
    },
  },
  {
    collection: 'product_variants',
    field: {
      field: 'announced_at',
      type: 'timestamp',
      schema: { is_nullable: true },
      meta: {
        interface: 'datetime',
        display: 'datetime',
        display_options: { relative: true },
        readonly: true,
        width: 'half',
        note: 'Пусто — про этот цвет клиентам ещё не писали.',
        translations: ru('Разослано клиентам'),
      },
    },
  },
  {
    collection: 'customer_profiles',
    field: {
      field: 'newsletter_unsubscribed',
      type: 'boolean',
      schema: { is_nullable: false, default_value: false },
      meta: {
        interface: 'boolean',
        display: 'boolean',
        special: ['cast-boolean'],
        width: 'half',
        note: 'Клиент нажал «Отписаться» в письме — письма о новинках ему не уходят.',
        translations: ru('Отписан от новинок'),
      },
    },
  },
]

const LOG_FIELDS = [
  {
    field: 'id',
    type: 'integer',
    schema: { is_primary_key: true, has_auto_increment: true },
    meta: { hidden: true, readonly: true, interface: 'input' },
  },
  {
    field: 'date_created',
    type: 'timestamp',
    schema: {},
    meta: { readonly: true, interface: 'datetime', display: 'datetime', width: 'half', translations: ru('Когда') },
  },
  {
    field: 'product',
    type: 'integer',
    schema: {},
    meta: { readonly: true, interface: 'select-dropdown-m2o', display: 'related-values', display_options: { template: '{{title}}' }, special: ['m2o'], width: 'half', translations: ru('Товар') },
  },
  {
    field: 'kind',
    type: 'string',
    schema: {},
    meta: {
      readonly: true,
      interface: 'select-dropdown',
      display: 'labels',
      options: { choices: [{ text: 'Новинка', value: 'product' }, { text: 'Новый цвет', value: 'variant' }] },
      display_options: { choices: [{ text: 'Новинка', value: 'product', foreground: '#ffffff', background: '#fe4819' }, { text: 'Новый цвет', value: 'variant', foreground: '#ffffff', background: '#141414' }] },
      width: 'half',
      translations: ru('Тип'),
    },
  },
  {
    field: 'status',
    type: 'string',
    schema: {},
    meta: {
      readonly: true,
      interface: 'select-dropdown',
      display: 'labels',
      options: { choices: [{ text: 'Отправляется', value: 'sending' }, { text: 'Готово', value: 'done' }, { text: 'Ошибка', value: 'error' }] },
      display_options: { choices: [{ text: 'Отправляется', value: 'sending', foreground: '#141414', background: '#ffe2b8' }, { text: 'Готово', value: 'done', foreground: '#ffffff', background: '#2e9e5b' }, { text: 'Ошибка', value: 'error', foreground: '#ffffff', background: '#d93025' }] },
      width: 'half',
      translations: ru('Статус'),
    },
  },
  {
    field: 'subject',
    type: 'string',
    schema: {},
    meta: { readonly: true, interface: 'input', width: 'full', translations: ru('Тема письма') },
  },
  {
    field: 'is_test',
    type: 'boolean',
    schema: { default_value: false },
    meta: { readonly: true, interface: 'boolean', display: 'boolean', special: ['cast-boolean'], width: 'half', translations: ru('Тестовая') },
  },
  {
    field: 'recipients',
    type: 'integer',
    schema: {},
    meta: { readonly: true, interface: 'input', width: 'half', translations: ru('Получателей') },
  },
  {
    field: 'sent',
    type: 'integer',
    schema: {},
    meta: { readonly: true, interface: 'input', width: 'half', translations: ru('Отправлено') },
  },
  {
    field: 'failed',
    type: 'integer',
    schema: {},
    meta: { readonly: true, interface: 'input', width: 'half', translations: ru('Не ушло') },
  },
  {
    field: 'errors',
    type: 'text',
    schema: {},
    meta: { readonly: true, interface: 'input-multiline', width: 'full', translations: ru('Ошибки') },
  },
  {
    field: 'created_by',
    type: 'uuid',
    schema: {},
    meta: { readonly: true, interface: 'select-dropdown-m2o', display: 'user', special: ['m2o'], width: 'half', translations: ru('Кто запустил') },
  },
  {
    field: 'finished_at',
    type: 'timestamp',
    schema: {},
    meta: { readonly: true, interface: 'datetime', display: 'datetime', width: 'half', translations: ru('Закончено') },
  },
]

const FLOW = {
  name: 'Разослать клиентам',
  icon: 'campaign',
  color: '#FE4819',
  description: 'Письмо всем клиентам о новом товаре или новом цвете. Повторно один и тот же товар не уйдёт.',
  status: 'active',
  trigger: 'manual',
  accountability: 'all',
  options: {
    collections: ['products'],
    location: 'item',
    requireConfirmation: true,
    confirmationDescription: 'Письмо о новинке клиентам Brillex',
    fields: [
      {
        field: 'test_email',
        type: 'string',
        name: 'Тест: отправить только на адрес',
        meta: {
          interface: 'input',
          width: 'full',
          options: { placeholder: 'например, manager@vip-line.kz', trim: true },
          note: 'Заполните, чтобы сначала посмотреть письмо у себя. Пусто — письмо уйдёт всем клиентам.',
        },
      },
      {
        field: 'note',
        type: 'text',
        name: 'Свой текст (необязательно)',
        meta: {
          interface: 'input-multiline',
          width: 'full',
          note: 'Пара предложений вместо абзаца из описания товара.',
        },
      },
      {
        field: 'resend',
        type: 'boolean',
        name: 'Разослать повторно',
        meta: {
          interface: 'boolean',
          width: 'full',
          options: { label: 'Отправить, даже если по товару уже была рассылка' },
        },
      },
    ],
  },
}

export default ({ action }, { services, database, getSchema, logger }) => {
  action('server.start', () => {
    setup({ services, database, getSchema, logger })
      .catch(error => logger.error(error, '[newsletter] не удалось подготовить схему и Flow'))
  })
}

async function setup({ services, database, getSchema, logger }) {
  const { FieldsService, CollectionsService, RelationsService, FlowsService, OperationsService } = services
  let schema = await getSchema()

  for (const { collection, field } of FIELDS) {
    if (!schema.collections[collection] || schema.collections[collection].fields[field.field])
      continue

    await new FieldsService({ schema, knex: database }).createField(collection, field)
    logger.info(`[newsletter] добавлено поле ${collection}.${field.field}`)
    schema = await getSchema()
  }

  if (!schema.collections[LOG_COLLECTION]) {
    await new CollectionsService({ schema, knex: database }).createOne({
      collection: LOG_COLLECTION,
      schema: {},
      meta: {
        icon: 'mark_email_read',
        note: 'Журнал писем о новинках. Запуск — кнопка «Разослать клиентам» в карточке товара.',
        display_template: '{{product.title}} · {{sent}}/{{recipients}}',
        sort_field: null,
        archive_field: null,
        accountability: 'all',
        translations: ru('Рассылки', { singular: 'Рассылка', plural: 'Рассылки' }),
      },
      fields: LOG_FIELDS,
    })

    schema = await getSchema()
    const relations = new RelationsService({ schema, knex: database })
    await relations.createOne({ collection: LOG_COLLECTION, field: 'product', related_collection: 'products', schema: { on_delete: 'SET NULL' }, meta: {} })
    await relations.createOne({ collection: LOG_COLLECTION, field: 'created_by', related_collection: 'directus_users', schema: { on_delete: 'SET NULL' }, meta: {} })

    // Вид списка по умолчанию для всех: свежие рассылки сверху, только нужные колонки.
    await database('directus_presets').insert({
      collection: LOG_COLLECTION,
      layout: 'tabular',
      layout_query: JSON.stringify({
        tabular: {
          sort: ['-date_created'],
          fields: ['date_created', 'product', 'kind', 'status', 'sent', 'recipients', 'failed', 'is_test'],
        },
      }),
    })
    logger.info(`[newsletter] создана коллекция ${LOG_COLLECTION}`)
    schema = await getSchema()
  }

  const existing = await database('directus_operations').where('type', OPERATION_ID).first('id')
  if (existing)
    return

  const flows = new FlowsService({ schema, knex: database })
  const flowId = await flows.createOne(FLOW)
  const operationId = await new OperationsService({ schema, knex: database }).createOne({
    flow: flowId,
    name: 'Рассылка о новинке',
    key: 'newsletter',
    type: OPERATION_ID,
    position_x: 19,
    position_y: 1,
    options: {},
  })
  await flows.updateOne(flowId, { operation: operationId })
  logger.info('[newsletter] создан Flow «Разослать клиентам»')
}
