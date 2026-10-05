/**
 * Письмо «Новинка в Brillex».
 *
 * Вёрстка под почтовики: таблицы, стили инлайном, ширина 600px,
 * на телефоне плитки цветов перестраиваются по две в ряд.
 * Картинки отдаются в JPG на белом фоне — WebP и прозрачность
 * понимают не все почтовые клиенты (классический Outlook, например).
 */

const BRAND = '#fe4819'
const INK = '#141414'
const MUTED = '#6f6a64'
const PAGE_BG = '#f2eee9'
const LINE = '#ece7e1'

/** Контакты — те же, что в src/constants/contacts.ts на сайте. */
const CONTACTS = {
  phone: '+7 708 888 0378',
  phoneDigits: '77088880378',
  email: 'Manager@vip-line.kz',
  address: 'Алматы, Акселеу Сейдимбека 200',
}

const FONT = '\'DM Sans\', \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif'
const MAX_TILES = 6

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const MAX_FEATURES = 4

/**
 * Из описания товара (обычный текст или HTML из редактора) достаём
 * короткий вводный абзац и до четырёх характеристик списком.
 */
export function parseDescription(html, limit = 220) {
  const lines = String(html ?? '')
    .replace(/<(?:br|\/p|\/div|\/li|\/h\d)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&amp;/g, '&')
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').replace(/^[•·\-–—*]\s*/, '').trim())
    .filter(Boolean)

  if (!lines.length)
    return { intro: '', features: [] }

  // «… нержавеющей Характеристики:» — хвост-заголовок списка в абзаце не нужен.
  let intro = lines[0].replace(/\s*\p{Lu}[^.!?:]{0,40}:$/u, '').trim()

  // Заголовок, склеенный с абзацем: «Термобутылка X — 600 мл Термобутылка X для …».
  const head = intro.split(' ').slice(0, 3).join(' ')
  const repeat = head.split(' ').length === 3 ? intro.indexOf(head, head.length) : -1
  if (repeat > 0)
    intro = intro.slice(repeat)

  intro = trimToSentences(intro, limit)

  const features = lines.slice(1)
    .filter(line => line.length <= 70 && !line.endsWith(':'))
    .slice(0, MAX_FEATURES)
    .map(line => line.replace(/[.;,]$/, ''))

  return { intro, features }
}

/** Режем по целым предложениям; оборванный хвост без точки отбрасываем. */
function trimToSentences(text, limit) {
  const sentences = text.match(/[^.!?…]+[.!?…]+(?:\s|$)/g)?.map(s => s.trim()) ?? []

  let out = ''
  for (const sentence of sentences.length ? sentences : [text]) {
    if (out && `${out} ${sentence}`.length > limit)
      break
    out = out ? `${out} ${sentence}` : sentence
  }

  if (out.length <= limit)
    return out

  const cut = out.slice(0, limit)
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : limit).replace(/[\s,.;:—–-]+$/, '')}…`
}

export function formatPrice(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0)
    return ''

  return `${new Intl.NumberFormat('ru-RU').format(n).replace(/\s/g, '\u00A0')}\u00A0₸`
}

/**
 * Фото вписываем в рамку нужных пропорций на белом фоне (у товаров фон белый),
 * чтобы высокие вертикальные снимки не растягивали письмо, а плитки были ровными.
 */
export function assetUrl(assetsUrl, fileId, width, height) {
  if (!fileId)
    return ''

  const transforms = encodeURIComponent(JSON.stringify([
    ['resize', { width, height, fit: 'contain', background: '#ffffff', withoutEnlargement: false }],
    ['flatten', { background: '#ffffff' }],
    // фон у снимков 253–254, а не чистый белый — без этого вокруг фото видна рамка
    ['linear', 1.015, 0],
  ]))

  return `${assetsUrl}/assets/${fileId}?format=jpg&quality=82&transforms=${transforms}`
}

/** Светлые цвета (белый, прозрачный) обводим, иначе точку не видно. */
function swatch(hex, size = 12) {
  const color = /^#[0-9a-f]{3,8}$/i.test(hex ?? '') ? hex : '#d9d4ce'
  const light = isLight(color)
  const border = light ? '#cfc8c0' : color

  return `<span style="display:inline-block;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:1px solid ${border};vertical-align:-1px;"></span>`
}

function isLight(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h.slice(0, 6)
  const [r, g, b] = [0, 2, 4].map(i => Number.parseInt(full.slice(i, i + 2), 16))
  return (r * 299 + g * 587 + b * 114) / 1000 > 200
}

function pluralColors(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11)
    return `${n} цвет`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
    return `${n} цвета`
  return `${n} цветов`
}

function withUtm(url, campaign) {
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}utm_source=email&utm_medium=newsletter&utm_campaign=${encodeURIComponent(campaign)}`
}

/**
 * @param {object} p
 * @param {'product'|'variant'} p.kind  новый товар или новые цвета у существующего
 * @param {{ title: string, slug: string, description?: string, price?: number, category?: { title?: string } }} p.product
 * @param {{ colorName?: string, colorHex?: string, imageId?: string, isNew?: boolean }[]} p.variants
 * @param {string} [p.fallbackImageId]  фото товара, если у вариантов своих нет
 * @param {string} p.siteUrl
 * @param {string} p.assetsUrl
 * @param {string} p.logoUrl
 * @param {string} [p.unsubscribeUrl]
 * @param {string} [p.note]  свой текст менеджера вместо абзаца из описания
 * @param {string} [p.firstName]
 * @param {number} [p.discountPercent]  личная скидка клиента — покажем его цену
 */
export function renderNewProductEmail(p) {
  const { product, siteUrl, assetsUrl, logoUrl } = p
  const variants = (p.variants ?? []).filter(Boolean)
  const newVariants = variants.filter(v => v.isNew)
  const isVariant = p.kind === 'variant' && newVariants.length > 0

  const productUrl = withUtm(`${siteUrl}/product/${encodeURIComponent(product.slug)}`, `new-${product.slug}`)
  const whatsappUrl = `https://wa.me/${CONTACTS.phoneDigits}?text=${encodeURIComponent(`Здравствуйте! Интересует «${product.title}» из рассылки.`)}`

  const hero = (isVariant ? newVariants : variants).find(v => v.imageId)?.imageId
    ?? variants.find(v => v.imageId)?.imageId
    ?? p.fallbackImageId

  const newNames = newVariants.map(v => v.colorName).filter(Boolean)
  const eyebrow = isVariant ? (newVariants.length > 1 ? 'Новые цвета' : 'Новый цвет') : 'Новинка'
  const title = product.title.trim()
  const subtitle = isVariant && newNames.length
    ? `Теперь ${newNames.length > 1 ? 'в цветах' : 'в цвете'} ${newNames.map(n => `«${n}»`).join(', ')}`
    : ''

  const parsed = parseDescription(product.description)
  const excerpt = String(p.note ?? '').trim() || parsed.intro
  const features = parsed.features
  const price = formatPrice(product.price)
  const discount = Number(p.discountPercent) > 0 ? Number(p.discountPercent) : 0
  const personalPrice = discount && price ? formatPrice(Math.round(Number(product.price) * (100 - discount) / 100)) : ''

  const subject = isVariant
    ? `${title} — ${newNames.length > 1 ? 'новые цвета' : `новый цвет «${newNames[0] ?? ''}»`}`
    : `Новинка в Brillex: ${title}`

  const preheader = [subtitle || excerpt, price && `Цена ${personalPrice || price}`].filter(Boolean).join(' · ')
  const greeting = p.firstName ? `Здравствуйте, ${escapeHtml(p.firstName)}!` : 'Здравствуйте!'
  const lead = isVariant
    ? `Добавили ${newVariants.length > 1 ? 'новые цвета' : 'новый цвет'} к товару, который уже есть в каталоге.`
    : 'В каталоге Brillex появился новый товар — делимся первыми.'

  const html = `<!doctype html>
<html lang="ru" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, address=no, email=no, date=no">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(subject)}</title>
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:0; width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table, td { border-collapse:collapse; mso-table-lspace:0; mso-table-rspace:0; }
  img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; display:block; }
  a { text-decoration:none; }
  a[x-apple-data-detectors] { color:inherit !important; text-decoration:none !important; }
  .tile-link:hover .tile-name { color:${BRAND} !important; }
  @media (max-width:620px) {
    .px { padding-left:22px !important; padding-right:22px !important; }
    .h1 { font-size:30px !important; line-height:34px !important; }
    .tile { max-width:50% !important; }
    .btn a { display:block !important; }
    .stack { display:block !important; width:100% !important; text-align:left !important; }
    .stack-gap { padding-top:10px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${PAGE_BG};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${PAGE_BG};">${escapeHtml(preheader)}${'&#847;&zwnj;&nbsp;'.repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAGE_BG};">
<tr><td align="center" style="padding:28px 12px 40px;">

<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

  <!-- Шапка -->
  <tr><td style="background:${INK};border-radius:20px 20px 0 0;padding:22px 32px;" class="px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="middle"><a href="${escapeHtml(withUtm(siteUrl, `new-${product.slug}`))}" target="_blank"><img src="${escapeHtml(logoUrl)}" width="110" height="40" alt="BRILLEX" style="width:110px;height:40px;color:#f5f5f5;font:700 20px ${FONT};letter-spacing:4px;"></a></td>
      <td valign="middle" align="right" style="font:500 12px/16px ${FONT};letter-spacing:1.5px;text-transform:uppercase;color:#9d9891;">Мерч для брендов</td>
    </tr></table>
  </td></tr>

  <!-- Фото -->
  <tr><td style="background:#ffffff;padding:0;border-bottom:1px solid ${LINE};">
    ${hero
      ? `<a href="${escapeHtml(productUrl)}" target="_blank"><img src="${escapeHtml(assetUrl(assetsUrl, hero, 1200, 840))}" width="600" height="420" alt="${escapeHtml(title)}" style="width:100%;max-width:600px;height:auto;margin:0 auto;"></a>`
      : ''}
  </td></tr>

  <!-- Текст -->
  <tr><td style="background:#ffffff;padding:34px 40px 8px;" class="px">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="background:${BRAND};border-radius:999px;padding:6px 14px;font:700 11px/14px ${FONT};letter-spacing:1.6px;text-transform:uppercase;color:#ffffff;">${eyebrow}</td>
      ${product.category?.title ? `<td style="padding-left:12px;font:500 12px/14px ${FONT};letter-spacing:1.2px;text-transform:uppercase;color:${MUTED};">${escapeHtml(product.category.title)}</td>` : ''}
    </tr></table>

    <h1 class="h1" style="margin:18px 0 0;font:800 36px/40px ${FONT};letter-spacing:-0.5px;color:${INK};">${escapeHtml(title)}</h1>
    ${subtitle ? `<p style="margin:10px 0 0;font:500 18px/26px ${FONT};color:${BRAND};">${escapeHtml(subtitle)}</p>` : ''}

    <p style="margin:22px 0 0;font:400 16px/25px ${FONT};color:${INK};">${greeting} ${lead}</p>
    ${excerpt ? `<p style="margin:12px 0 0;font:400 15px/24px ${FONT};color:${MUTED};">${escapeHtml(excerpt)}</p>` : ''}
    ${features.length
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">${features.map(f => `<tr>
        <td valign="top" style="padding:4px 10px 4px 0;font:800 15px/22px ${FONT};color:${BRAND};">—</td>
        <td valign="top" style="padding:4px 0;font:500 15px/22px ${FONT};color:${INK};">${escapeHtml(f)}</td>
      </tr>`).join('')}</table>`
      : ''}
  </td></tr>

  ${price
    ? `<!-- Цена -->
  <tr><td style="background:#ffffff;padding:22px 40px 4px;" class="px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf7f4;border:1px solid ${LINE};border-radius:14px;border-collapse:separate;">
      <tr><td style="padding:16px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td class="stack" valign="middle" style="font:500 13px/18px ${FONT};color:${MUTED};">${personalPrice ? `Ваша цена со&nbsp;скидкой&nbsp;${discount}%` : 'Цена'}</td>
          <td class="stack stack-gap" valign="middle" align="right" style="white-space:nowrap;">
            ${personalPrice ? `<span style="font:500 15px/20px ${FONT};color:#a59f98;text-decoration:line-through;">${price}</span>&nbsp;&nbsp;` : ''}
            <span style="font:800 26px/30px ${FONT};color:${INK};">${personalPrice || price}</span>
          </td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>`
    : ''}

  ${renderColors({ variants, isVariant, productUrl, assetsUrl })}

  <!-- Кнопки -->
  <tr><td style="background:#ffffff;padding:28px 40px 36px;border-radius:0 0 20px 20px;" class="px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td class="btn" align="center" bgcolor="${BRAND}" style="border-radius:14px;">
        <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${escapeHtml(productUrl)}" style="height:54px;v-text-anchor:middle;width:520px;" arcsize="26%" stroke="f" fillcolor="${BRAND}"><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Смотреть на сайте</center></v:roundrect><![endif]-->
        <!--[if !mso]><!--><a href="${escapeHtml(productUrl)}" target="_blank" style="display:block;padding:17px 24px;font:700 16px/20px ${FONT};color:#ffffff;text-align:center;border-radius:14px;">Смотреть на сайте&nbsp;&nbsp;→</a><!--<![endif]-->
      </td>
    </tr></table>
    <p style="margin:16px 0 0;text-align:center;font:400 14px/22px ${FONT};color:${MUTED};">
      Нужен тираж с логотипом? <a href="${escapeHtml(whatsappUrl)}" target="_blank" style="color:${INK};font-weight:700;border-bottom:1px solid ${BRAND};">Напишите в WhatsApp</a>
    </p>
  </td></tr>

  <!-- Подвал -->
  <tr><td style="padding:30px 40px 0;" class="px">
    <p style="margin:0;font:800 15px/22px ${FONT};letter-spacing:-0.2px;color:${INK};">Люди запоминают не рекламу.<br>Люди запоминают <span style="color:${BRAND};">эмоции.</span></p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;"><tr>
      <td class="stack" valign="top" style="font:400 13px/21px ${FONT};color:${MUTED};">
        <a href="tel:+${CONTACTS.phoneDigits}" style="color:${INK};font-weight:700;">${CONTACTS.phone}</a><br>
        <a href="mailto:${CONTACTS.email}" style="color:${MUTED};">${CONTACTS.email}</a>
      </td>
      <td class="stack stack-gap" valign="top" align="right" style="font:400 13px/21px ${FONT};color:${MUTED};">
        ${CONTACTS.address}<br>
        <a href="${escapeHtml(withUtm(siteUrl, `new-${product.slug}`))}" target="_blank" style="color:${BRAND};font-weight:700;">brillex.kz</a>
      </td>
    </tr></table>
    <p style="margin:22px 0 0;padding-top:18px;border-top:1px solid #e0d9d1;font:400 12px/18px ${FONT};color:#9d9891;">
      Вы получили это письмо, потому что зарегистрированы на brillex.kz.${p.unsubscribeUrl ? `<br><a href="${escapeHtml(p.unsubscribeUrl)}" target="_blank" style="color:#9d9891;text-decoration:underline;">Отписаться от писем о новинках</a>` : ''}
    </p>
  </td></tr>

</table>
<!--[if mso]></td></tr></table><![endif]-->

</td></tr>
</table>
</body>
</html>`

  const text = [
    `${eyebrow.toUpperCase()}: ${title}`,
    subtitle,
    '',
    `${p.firstName ? `Здравствуйте, ${p.firstName}!` : 'Здравствуйте!'} ${lead}`,
    excerpt,
    ...features.map(f => `— ${f}`),
    price ? (personalPrice ? `Ваша цена со скидкой ${discount}%: ${personalPrice} (вместо ${price})` : `Цена: ${price}`) : '',
    variants.length > 1 ? `Цвета: ${variants.map(v => `${v.colorName ?? '—'}${v.isNew ? ' (новый)' : ''}`).join(', ')}` : '',
    '',
    `Смотреть на сайте: ${productUrl}`,
    `WhatsApp: https://wa.me/${CONTACTS.phoneDigits}`,
    '',
    `${CONTACTS.phone} · ${CONTACTS.email}`,
    CONTACTS.address,
    '',
    'Вы получили это письмо, потому что зарегистрированы на brillex.kz.',
    p.unsubscribeUrl ? `Отписаться: ${p.unsubscribeUrl}` : '',
  ].filter((line, i, arr) => line !== '' || arr[i - 1] !== '').join('\n').replace(/\u00A0/g, ' ')

  return { subject, preheader, html, text }
}

function renderColors({ variants, isVariant, productUrl, assetsUrl }) {
  const named = variants.filter(v => v.colorName)
  if (!named.length)
    return ''

  const withImages = named.filter(v => v.imageId)

  // Один цвет или нет фото у вариантов — достаточно строчки с точками.
  if (named.length === 1 || withImages.length < 2) {
    return `<!-- Цвета -->
  <tr><td style="background:#ffffff;padding:22px 40px 0;" class="px">
    <p style="margin:0;font:500 14px/24px ${FONT};color:${MUTED};">${named.length > 1 ? 'Цвета' : 'Цвет'}:&nbsp;
      ${named.map(v => `<span style="white-space:nowrap;color:${INK};">${swatch(v.colorHex)}&nbsp;${escapeHtml(v.colorName)}${v.isNew && isVariant ? `&nbsp;<span style="color:${BRAND};font-weight:700;">new</span>` : ''}</span>`).join('&nbsp;&nbsp;&nbsp; ')}
    </p>
  </td></tr>`
  }

  const shown = withImages.slice(0, MAX_TILES)
  const rest = named.length - shown.length

  // Ширина строки внутри письма — 526px; плитки по две или по три в ряд.
  const cols = shown.length === 2 || shown.length === 4 ? 2 : 3
  const tileWidth = Math.floor(526 / cols)
  const imageWidth = tileWidth - 28

  const tiles = shown.map((v, i) => `${i > 0 && i % cols === 0 ? '<!--[if mso]></tr><tr><![endif]-->' : ''}<!--[if mso]><td width="${tileWidth}" valign="top"><![endif]-->
      <div class="tile" style="display:inline-block;width:100%;max-width:${tileWidth}px;vertical-align:top;">
        <a class="tile-link" href="${escapeHtml(productUrl)}" target="_blank" style="display:block;padding:0 3px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${v.isNew && isVariant ? BRAND : LINE};border-radius:14px;border-collapse:separate;">
            <tr><td style="padding:10px 10px 0;"><img src="${escapeHtml(assetUrl(assetsUrl, v.imageId, imageWidth * 2, Math.round(imageWidth * 2.5)))}" width="${imageWidth}" alt="${escapeHtml(v.colorName)}" style="width:100%;max-width:${imageWidth}px;height:auto;border-radius:8px;"></td></tr>
            <tr><td class="tile-name" style="padding:10px 12px 12px;font:500 13px/18px ${FONT};color:${INK};">${swatch(v.colorHex)}&nbsp;&nbsp;${escapeHtml(v.colorName)}${v.isNew && isVariant ? `&nbsp;&nbsp;<span style="font-weight:700;color:${BRAND};">new</span>` : ''}</td></tr>
          </table>
        </a>
      </div>
      <!--[if mso]></td><![endif]-->`).join('')

  return `<!-- Цвета -->
  <tr><td style="background:#ffffff;padding:28px 37px 0;" class="px">
    <p style="margin:0 3px 14px;font:700 13px/18px ${FONT};letter-spacing:1.4px;text-transform:uppercase;color:${MUTED};">${pluralColors(named.length)}${rest > 0 ? ` · ещё ${rest} на сайте` : ''}</p>
    <div style="font-size:0;line-height:0;">
      <!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><![endif]-->
      ${tiles}
      <!--[if mso]></tr></table><![endif]-->
    </div>
  </td></tr>`
}
