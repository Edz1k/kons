/** Контакты компании. Единственное место, где их нужно править. */

export const PHONE = '+7 708 888 0378'
export const PHONE_DIGITS = PHONE.replace(/\D/g, '')

/** WhatsApp на том же номере, что и телефон. */
export const WHATSAPP_PHONE = PHONE
export const WHATSAPP_DIGITS = PHONE_DIGITS
export const WHATSAPP_LINK = `https://wa.me/${PHONE_DIGITS}`

export const EMAILS = [
  'Manager@vip-line.kz',
  'Manager1@vip-line.kz',
]

/** Почта для форм и шапки — первая из списка. */
export const EMAIL_PRIMARY = EMAILS[0]

export const ADDRESS = 'Акселеу Сейдимбека 200'
export const ADDRESS_FULL = `Алматы, ${ADDRESS}`

export const MAP_WIDGET_URL = `https://yandex.kz/map-widget/v1/?text=${encodeURIComponent(`Алматы, ${ADDRESS}`)}&z=17`
