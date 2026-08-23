#!/usr/bin/env node
/**
 * Разворачивает функцию резерва товаров в Directus 11.
 *
 * Что делает (идемпотентно, повторный запуск ничего не ломает):
 *  - коллекция `reservations` + поля и связи;
 *  - поля `reserved_qty` / `reserved_until` в `product_variants`;
 *  - политика доступа для клиентов (создать свой резерв, видеть и отменять только свои);
 *  - политика доступа для менеджеров (полный доступ к резервам);
 *  - закладки-пресеты для удобной работы менеджера.
 *
 * Запуск:
 *   DIRECTUS_URL=https://cms.brillex.kz DIRECTUS_TOKEN=<admin-token> node scripts/setup-reservations.mjs
 *   DIRECTUS_URL=... DIRECTUS_EMAIL=... DIRECTUS_PASSWORD=... node scripts/setup-reservations.mjs
 */

import process from 'node:process'

const BASE = (process.env.DIRECTUS_URL ?? 'https://cms.brillex.kz').replace(/\/+$/, '')
const RESERVATION_DAYS = Number(process.env.RESERVATION_DAYS ?? 3)

let token = process.env.DIRECTUS_TOKEN ?? ''

const STATUS_CHOICES = [
  { text: 'Активен', value: 'active', color: '#2563EB', foreground: '#FFFFFF', background: '#2563EB' },
  { text: 'Купил', value: 'confirmed', color: '#059669', foreground: '#FFFFFF', background: '#059669' },
  { text: 'Отказ', value: 'cancelled', color: '#64748B', foreground: '#FFFFFF', background: '#64748B' },
  { text: 'Истёк', value: 'expired', color: '#DC2626', foreground: '#FFFFFF', background: '#DC2626' },
]

async function api(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  const text = await response.text()
  const json = text ? JSON.parse(text) : null

  if (!response.ok) {
    const error = new Error(`${options.method ?? 'GET'} ${path} → ${response.status}: ${text.slice(0, 400)}`)
    error.status = response.status
    throw error
  }

  return json?.data ?? json
}

async function tryApi(path, options) {
  try {
    return await api(path, options)
  }
  catch (error) {
    if (error.status === 403 || error.status === 404)
      return null

    throw error
  }
}

function log(message) {
  process.stdout.write(`${message}\n`)
}

async function login() {
  if (token)
    return

  const email = process.env.DIRECTUS_EMAIL
  const password = process.env.DIRECTUS_PASSWORD

  if (!email || !password)
    throw new Error('Нужен DIRECTUS_TOKEN или пара DIRECTUS_EMAIL + DIRECTUS_PASSWORD')

  const data = await api('/auth/login', {
    method: 'POST',
    body: { email, password, mode: 'json' },
  })

  token = data.access_token
  log('· авторизовались по email/паролю')
}

async function primaryKeyType(collection) {
  const fields = await api(`/fields/${collection}`)
  const primary = fields.find(field => field.schema?.is_primary_key)

  if (!primary)
    throw new Error(`Не нашёл первичный ключ коллекции ${collection}`)

  return primary.type
}

async function ensureCollection(collection, payload) {
  const existing = await tryApi(`/collections/${collection}`)

  if (existing) {
    log(`· коллекция ${collection} уже есть`)
    return false
  }

  await api('/collections', { method: 'POST', body: payload })
  log(`+ коллекция ${collection} создана`)
  return true
}

async function ensureField(collection, field, payload) {
  const existing = await tryApi(`/fields/${collection}/${field}`)

  if (existing) {
    log(`· поле ${collection}.${field} уже есть`)
    return false
  }

  await api(`/fields/${collection}`, { method: 'POST', body: { field, ...payload } })
  log(`+ поле ${collection}.${field} создано`)
  return true
}

async function ensureRelation(collection, field, relatedCollection, onDelete = 'SET NULL') {
  const existing = await tryApi(`/relations/${collection}/${field}`)

  if (existing) {
    log(`· связь ${collection}.${field} → ${relatedCollection} уже есть`)
    return false
  }

  await api('/relations', {
    method: 'POST',
    body: {
      collection,
      field,
      related_collection: relatedCollection,
      schema: { on_delete: onDelete },
    },
  })

  log(`+ связь ${collection}.${field} → ${relatedCollection} создана`)
  return true
}

async function ensurePolicy(name, payload) {
  const policies = await api(`/policies?filter[name][_eq]=${encodeURIComponent(name)}&limit=1`)

  if (policies?.length) {
    log(`· политика «${name}» уже есть`)
    return policies[0]
  }

  const policy = await api('/policies', {
    method: 'POST',
    body: { name, icon: 'bookmark', ...payload },
  })

  log(`+ политика «${name}» создана`)
  return policy
}

async function ensurePermission(policyId, collection, action, payload) {
  const query = new URLSearchParams({
    'filter[policy][_eq]': policyId,
    'filter[collection][_eq]': collection,
    'filter[action][_eq]': action,
    'limit': '1',
  })

  const existing = await api(`/permissions?${query.toString()}`)

  if (existing?.length) {
    await api(`/permissions/${existing[0].id}`, { method: 'PATCH', body: payload })
    log(`· право ${collection}.${action} обновлено`)
    return existing[0]
  }

  const permission = await api('/permissions', {
    method: 'POST',
    body: { policy: policyId, collection, action, ...payload },
  })

  log(`+ право ${collection}.${action} создано`)
  return permission
}

async function attachPolicyToRole(roleId, policyId) {
  const role = await api(`/roles/${roleId}?fields=id,name,policies.id,policies.policy`)
  const attached = (role.policies ?? []).some(item => (item.policy?.id ?? item.policy) === policyId)

  if (attached) {
    log(`· политика уже привязана к роли «${role.name}»`)
    return
  }

  await api(`/roles/${roleId}`, {
    method: 'PATCH',
    body: { policies: { create: [{ policy: policyId }], update: [], delete: [] } },
  })

  log(`+ политика привязана к роли «${role.name}»`)
}

async function ensurePreset(bookmark, payload) {
  const query = new URLSearchParams({
    'filter[bookmark][_eq]': bookmark,
    'filter[collection][_eq]': 'reservations',
    'limit': '1',
  })

  const existing = await api(`/presets?${query.toString()}`)

  if (existing?.length) {
    log(`· закладка «${bookmark}» уже есть`)
    return
  }

  await api('/presets', {
    method: 'POST',
    body: { bookmark, collection: 'reservations', user: null, role: null, ...payload },
  })

  log(`+ закладка «${bookmark}» создана`)
}

/**
 * Новые поля вариантов должны быть видны всем, кто уже читает каталог,
 * иначе фронт получит 403 на весь запрос товаров.
 */
async function ensureVariantFieldsVisible() {
  const query = new URLSearchParams({
    'filter[collection][_eq]': 'product_variants',
    'filter[action][_eq]': 'read',
    'fields': 'id,policy,fields',
    'limit': '100',
  })

  const permissions = await api(`/permissions?${query.toString()}`)

  for (const permission of permissions ?? []) {
    const fields = permission.fields ?? []

    if (fields.includes('*'))
      continue

    const missing = ['reserved_qty', 'reserved_until'].filter(field => !fields.includes(field))

    if (!missing.length)
      continue

    await api(`/permissions/${permission.id}`, {
      method: 'PATCH',
      body: { fields: [...fields, ...missing] },
    })

    log(`+ поля ${missing.join(', ')} открыты для чтения (право #${permission.id})`)
  }
}

async function main() {
  log(`→ Directus: ${BASE}`)
  await login()

  const me = await api('/users/me?fields=id,email,role.name')
  log(`→ выполняем от имени ${me.email}`)

  const productKeyType = await primaryKeyType('products')
  const variantKeyType = await primaryKeyType('product_variants')
  log(`→ ключи: products=${productKeyType}, product_variants=${variantKeyType}`)

  // 1. Коллекция резервов ------------------------------------------------
  await ensureCollection('reservations', {
    collection: 'reservations',
    meta: {
      icon: 'bookmark',
      note: `Резервы товаров клиентами. Срок — ${RESERVATION_DAYS} дня, затем резерв истекает автоматически.`,
      display_template: '{{product.title}} — {{quantity}} шт. ({{user.email}})',
      color: '#2563EB',
      sort_field: null,
      archive_field: 'status',
      archive_value: 'cancelled',
      unarchive_value: 'active',
      archive_app_filter: true,
    },
    schema: { name: 'reservations' },
    fields: [
      {
        field: 'id',
        type: 'integer',
        meta: { hidden: true, interface: 'input', readonly: true },
        schema: { is_primary_key: true, has_auto_increment: true },
      },
    ],
  })

  await ensureField('reservations', 'status', {
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      display: 'labels',
      width: 'half',
      note: 'Менеджер отмечает исход резерва: купил или отказ.',
      options: { choices: STATUS_CHOICES },
      display_options: { showAsDot: false, choices: STATUS_CHOICES },
    },
    schema: { default_value: 'active', is_nullable: false },
  })

  await ensureField('reservations', 'user', {
    type: 'uuid',
    meta: {
      interface: 'select-dropdown-m2o',
      special: ['m2o'],
      width: 'half',
      note: 'Клиент, за которым закреплён товар.',
      options: { template: '{{first_name}} {{last_name}} {{email}}' },
    },
    schema: {},
  })
  await ensureRelation('reservations', 'user', 'directus_users', 'CASCADE')

  await ensureField('reservations', 'product', {
    type: productKeyType,
    meta: {
      interface: 'select-dropdown-m2o',
      special: ['m2o'],
      width: 'half',
      options: { template: '{{title}}' },
    },
    schema: {},
  })
  await ensureRelation('reservations', 'product', 'products', 'CASCADE')

  await ensureField('reservations', 'variant', {
    type: variantKeyType,
    meta: {
      interface: 'select-dropdown-m2o',
      special: ['m2o'],
      width: 'half',
      options: { template: '{{sku}} {{color.name}}' },
    },
    schema: {},
  })
  await ensureRelation('reservations', 'variant', 'product_variants', 'CASCADE')

  await ensureField('reservations', 'quantity', {
    type: 'integer',
    meta: { interface: 'input', width: 'half', options: { min: 1 } },
    schema: { default_value: 1, is_nullable: false },
  })

  await ensureField('reservations', 'reserved_at', {
    type: 'timestamp',
    meta: {
      interface: 'datetime',
      special: ['date-created'],
      readonly: true,
      width: 'half',
      display: 'datetime',
      display_options: { relative: true },
    },
    schema: {},
  })

  await ensureField('reservations', 'expires_at', {
    type: 'timestamp',
    meta: {
      interface: 'datetime',
      readonly: true,
      width: 'half',
      note: `Ставится автоматически: момент создания + ${RESERVATION_DAYS} дня.`,
      display: 'datetime',
      display_options: { relative: true },
    },
    schema: {},
  })

  await ensureField('reservations', 'price_at_reserve', {
    type: 'decimal',
    meta: {
      interface: 'input',
      width: 'half',
      readonly: true,
      note: 'Цена за штуку на момент резерва, с учётом скидки клиента.',
    },
    schema: { numeric_precision: 12, numeric_scale: 2 },
  })

  await ensureField('reservations', 'customer_comment', {
    type: 'text',
    meta: {
      interface: 'input-multiline',
      readonly: true,
      note: 'Комментарий клиента при резерве.',
    },
    schema: {},
  })

  await ensureField('reservations', 'manager_note', {
    type: 'text',
    meta: {
      interface: 'input-multiline',
      note: 'Заметка менеджера: договорённости, итог звонка.',
    },
    schema: {},
  })

  await ensureField('reservations', 'resolved_by', {
    type: 'uuid',
    meta: {
      interface: 'select-dropdown-m2o',
      special: ['m2o'],
      width: 'half',
      readonly: true,
      note: 'Кто из менеджеров закрыл резерв.',
      options: { template: '{{first_name}} {{last_name}} {{email}}' },
    },
    schema: {},
  })
  await ensureRelation('reservations', 'resolved_by', 'directus_users', 'SET NULL')

  await ensureField('reservations', 'resolved_at', {
    type: 'timestamp',
    meta: { interface: 'datetime', readonly: true, width: 'half', display: 'datetime' },
    schema: {},
  })

  // 2. Счётчики на вариантах ---------------------------------------------
  await ensureField('product_variants', 'reserved_qty', {
    type: 'integer',
    meta: {
      interface: 'input',
      readonly: true,
      width: 'half',
      note: 'Сколько штук держат активные резервы. Считает Directus, руками не трогаем.',
    },
    schema: { default_value: 0, is_nullable: false },
  })

  await ensureField('product_variants', 'reserved_until', {
    type: 'timestamp',
    meta: {
      interface: 'datetime',
      readonly: true,
      width: 'half',
      note: 'Когда истекает ближайший резерв по этому варианту.',
      display: 'datetime',
      display_options: { relative: true },
    },
    schema: {},
  })

  // 3. Права клиентов ------------------------------------------------------
  const customerPolicy = await ensurePolicy('Клиенты — резервы', {
    description: 'Клиент создаёт резерв на себя, видит и отменяет только свои резервы.',
    app_access: false,
    admin_access: false,
  })

  await ensurePermission(customerPolicy.id, 'reservations', 'create', {
    permissions: {},
    validation: {
      _and: [
        { quantity: { _gte: 1 } },
        { status: { _eq: 'active' } },
      ],
    },
    presets: { user: '$CURRENT_USER', status: 'active' },
    fields: ['product', 'variant', 'quantity', 'price_at_reserve', 'customer_comment', 'user', 'status'],
  })

  await ensurePermission(customerPolicy.id, 'reservations', 'read', {
    permissions: { user: { _eq: '$CURRENT_USER' } },
    validation: null,
    presets: null,
    fields: ['*'],
  })

  await ensurePermission(customerPolicy.id, 'reservations', 'update', {
    permissions: {
      _and: [
        { user: { _eq: '$CURRENT_USER' } },
        { status: { _eq: 'active' } },
      ],
    },
    validation: { status: { _in: ['cancelled'] } },
    presets: null,
    fields: ['status'],
  })

  for (const collection of ['products', 'product_variants', 'Categories']) {
    await ensurePermission(customerPolicy.id, collection, 'read', {
      permissions: {},
      validation: null,
      presets: null,
      fields: ['*'],
    })
  }

  const settings = await api('/settings?fields=public_registration_role')
  const registrationRole = settings?.public_registration_role

  if (registrationRole)
    await attachPolicyToRole(registrationRole, customerPolicy.id)
  else
    log('! роль для самостоятельной регистрации не задана — привяжите политику «Клиенты — резервы» к роли клиентов вручную')

  // 4. Права менеджеров ----------------------------------------------------
  const managerPolicy = await ensurePolicy('Менеджеры — резервы', {
    description: 'Полный доступ к резервам: подтвердить покупку, отказать, оставить заметку.',
    app_access: true,
    admin_access: false,
  })

  for (const action of ['read', 'update', 'delete']) {
    await ensurePermission(managerPolicy.id, 'reservations', action, {
      permissions: {},
      validation: null,
      presets: null,
      fields: ['*'],
    })
  }

  for (const collection of ['products', 'product_variants', 'Categories', 'customer_profiles']) {
    await ensurePermission(managerPolicy.id, collection, 'read', {
      permissions: {},
      validation: null,
      presets: null,
      fields: ['*'],
    })
  }

  // 5. Рабочие вкладки менеджера -------------------------------------------
  await ensurePreset('Резервы — доска', {
    layout: 'kanban',
    layout_query: { kanban: { sort: ['expires_at'], limit: 100 } },
    layout_options: {
      kanban: {
        groupField: 'status',
        groupTitle: '{{product.title}}',
        crop: false,
        showUngrouped: false,
      },
    },
    icon: 'view_kanban',
    color: '#2563EB',
  })

  await ensurePreset('Ждут подтверждения', {
    layout: 'tabular',
    layout_query: {
      tabular: {
        sort: ['expires_at'],
        fields: ['product', 'variant', 'quantity', 'user', 'expires_at', 'status', 'manager_note'],
        limit: 50,
      },
    },
    filter: { _and: [{ status: { _eq: 'active' } }] },
    icon: 'pending_actions',
    color: '#F59E0B',
  })

  await ensurePreset('Истекают за сутки', {
    layout: 'tabular',
    layout_query: {
      tabular: {
        sort: ['expires_at'],
        fields: ['product', 'variant', 'quantity', 'user', 'expires_at', 'status'],
        limit: 50,
      },
    },
    filter: {
      _and: [
        { status: { _eq: 'active' } },
        { expires_at: { _lte: '$NOW(+1 day)' } },
      ],
    },
    icon: 'alarm',
    color: '#DC2626',
  })

  await ensureVariantFieldsVisible()

  log('\n✓ Схема, права и вкладки менеджера готовы.')
  log('  Дальше нужен hook-расширение (директория extensions) — оно проставляет срок,')
  log('  считает reserved_qty и гасит просроченные резервы.')
}

main().catch((error) => {
  process.stderr.write(`\n✗ ${error.message}\n`)
  process.exit(1)
})
