/**
 * Серверная часть бандла: так Directus загружает несколько расширений из одной папки.
 * Имена совпадают с entries в package.json.
 */

import send from './send.js'
import setup from './setup.js'
import unsubscribe from './unsubscribe.js'

export default {
  hooks: [{ name: 'newsletter-setup', config: setup }],
  endpoints: [{ name: 'newsletter-unsubscribe', config: unsubscribe }],
  operations: [{ name: 'newsletter-send', config: send }],
}
