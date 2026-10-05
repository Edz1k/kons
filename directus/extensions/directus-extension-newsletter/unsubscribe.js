/**
 * Отписка от писем о новинках: cms.brillex.kz/newsletter/unsubscribe?u=<клиент>&t=<подпись>
 *
 * GET показывает страницу с кнопкой (почтовые сканеры ходят по ссылкам — без
 * подтверждения они отписывали бы людей сами), POST отписывает. POST же принимает
 * «отписаться в один клик» из Gmail и Mail.ru по заголовку List-Unsubscribe-Post.
 */

import { isValidUnsubscribeToken, newsletterConfig } from './shared.js'

export default {
  id: 'newsletter',
  handler: (router, { database, env, logger }) => {
    const config = newsletterConfig(env)

    router.get('/unsubscribe', async (req, res) => {
      if (req.query.test)
        return page(res, config, 200, 'Это тестовое письмо', 'Ссылка из тестовой рассылки — отписывать некого. Клиенты получают здесь свою личную ссылку.')

      const user = await findSubscriber(database, env, req.query)
      if (!user)
        return page(res, config, 400, 'Ссылка не работает', 'Похоже, ссылка обрезана или устарела. Напишите нам — отпишем вручную.')

      if (user.newsletter_unsubscribed)
        return page(res, config, 200, 'Вы уже отписаны', 'Письма о новинках на этот адрес больше не приходят.')

      return page(res, config, 200, 'Отписаться от новинок?', `Перестанем присылать письма о новых товарах на ${escapeHtml(maskEmail(user.email))}. Заказы и личный кабинет это не затронет.`, {
        action: `${config.publicUrl}/newsletter/unsubscribe?u=${encodeURIComponent(req.query.u)}&t=${encodeURIComponent(req.query.t)}`,
      })
    })

    router.post('/unsubscribe', async (req, res) => {
      if (req.query.test)
        return page(res, config, 200, 'Это тестовое письмо', 'Отписывать некого.')

      const user = await findSubscriber(database, env, req.query)
      if (!user)
        return page(res, config, 400, 'Ссылка не работает', 'Похоже, ссылка обрезана или устарела. Напишите нам — отпишем вручную.')

      await database('customer_profiles').where('id', user.profile_id).update({ newsletter_unsubscribed: true })
      logger.info(`[newsletter] отписка: ${user.email}`)

      return page(res, config, 200, 'Готово, вы отписаны', 'Письма о новинках больше не придут. Передумаете — напишите нам, вернём.')
    })
  },
}

async function findSubscriber(database, env, query) {
  const userId = typeof query.u === 'string' ? query.u : ''
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !isValidUnsubscribeToken(env.SECRET, userId, query.t))
    return null

  return database('directus_users as u')
    .join('customer_profiles as p', 'p.user', 'u.id')
    .where('u.id', userId)
    .first('u.email', 'p.id as profile_id', 'p.newsletter_unsubscribed')
}

function maskEmail(email) {
  const [name, domain] = String(email).split('@')
  return `${name.slice(0, 2)}${'•'.repeat(Math.max(1, Math.min(6, name.length - 2)))}@${domain}`
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)
}

function page(res, config, status, title, text, form) {
  res.status(status).type('html').set('Cache-Control', 'no-store').send(`<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)} — Brillex</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px 16px;
    background: #f2eee9; color: #141414; font: 16px/1.55 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  .card { width: 100%; max-width: 440px; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(20, 20, 20, .08); }
  .head { background: #141414; color: #f5f5f5; padding: 18px 28px; font-weight: 800; letter-spacing: 5px; }
  .body { padding: 28px; }
  h1 { margin: 0 0 10px; font-size: 24px; line-height: 1.2; }
  p { margin: 0; color: #6f6a64; }
  button { margin-top: 22px; width: 100%; border: 0; border-radius: 14px; padding: 15px; background: #fe4819; color: #fff;
    font: 700 16px/1.2 inherit; font-family: inherit; cursor: pointer; }
  a { color: #fe4819; font-weight: 700; text-decoration: none; }
  .back { display: inline-block; margin-top: 18px; }
</style>
</head>
<body>
<main class="card">
  <div class="head">BRILLEX</div>
  <div class="body">
    <h1>${escapeHtml(title)}</h1>
    <p>${text}</p>
    ${form ? `<form method="post" action="${escapeHtml(form.action)}"><button type="submit">Отписаться</button></form>` : ''}
    <a class="back" href="${escapeHtml(config.siteUrl)}">← На brillex.kz</a>
  </div>
</main>
</body>
</html>`)
}
