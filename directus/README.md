# Резерв товаров — серверная часть

Три шага на сервере `brillex-cms` (`94.247.128.238`, Directus 11.17.1 в контейнере `brillex_directus`).

## 1. Схема: коллекция `reservations` и счётчики на вариантах

Файл `snapshot-reservations.yaml` уже лежит на сервере и внутри контейнера (`/tmp/`).
Собран из текущего снапшота схемы, изменения только аддитивные — ничего не удаляется.

```bash
ssh brillex-cms 'sudo docker exec brillex_directus npx directus schema apply --yes /tmp/snapshot-reservations.yaml'
```

Пересобрать файл заново (после правок в схеме на бою):

```bash
ssh brillex-cms 'sudo docker exec brillex_directus npx directus schema snapshot --yes /tmp/snapshot.yaml && sudo docker exec brillex_directus cat /tmp/snapshot.yaml' > /tmp/snapshot.yaml
node scripts/build-reservations-schema.mjs /tmp/snapshot.yaml > /tmp/snapshot-reservations.yaml
scp /tmp/snapshot-reservations.yaml brillex-cms:/home/ubuntu/
ssh brillex-cms 'sudo docker cp /home/ubuntu/snapshot-reservations.yaml brillex_directus:/tmp/snapshot-reservations.yaml'
```

## 2. Hook-расширение: срок, блокировка остатка, автоистечение

Исходники — `directus/extensions/directus-extension-reservations` (уже скопированы в `/home/ubuntu/` на сервере).

```bash
ssh brillex-cms 'sudo docker cp /home/ubuntu/directus-extension-reservations brillex_directus:/directus/extensions/ && sudo docker restart brillex_directus'
```

Рестарт занимает 10–20 секунд, за это время сайт не сможет читать каталог.

Что делает расширение:

- при создании резерва проставляет клиента, статус `active` и `expires_at = сейчас + 3 дня` (клиент не может продлить срок сам);
- не даёт зарезервировать больше, чем свободно: `stock` минус чужие активные резервы;
- держит на `product_variants` поля `reserved_qty` и `reserved_until` (их читает фронт, чтобы показывать «В резерве»);
- каждые 10 минут переводит просроченные резервы в `expired` и возвращает товар в продажу;
- при смене статуса на `confirmed` / `cancelled` записывает, кто и когда закрыл резерв.

Срок меняется переменной окружения `RESERVATION_DAYS` в `.env` рядом с `docker-compose.yml`
(значение по умолчанию — 3). Фронт берёт своё значение из `RESERVATION_DAYS` в `src/services/reservations.ts`.

Проверить, что расширение загрузилось:

```bash
ssh brillex-cms 'sudo docker logs --tail 30 brillex_directus'
```

## 3. Права и вкладки менеджера

Нужен статический токен администратора: Directus → значок профиля → **Token** → сгенерировать и сохранить.

```bash
DIRECTUS_URL=https://cms.brillex.kz DIRECTUS_TOKEN=<токен> node scripts/setup-reservations.mjs
```

Скрипт идемпотентный, запускать можно повторно. Он создаёт:

- политику **«Клиенты — резервы»**: клиент создаёт резерв только на себя, видит и отменяет только свои;
  политика привязывается к роли, указанной в настройках публичной регистрации;
- политику **«Менеджеры — резервы»**: полный доступ к резервам (её нужно привязать к роли менеджеров вручную,
  если менеджеры не админы);
- закладки в интерфейсе: **Резервы — доска** (канбан по статусу: Активен → Купил / Отказ),
  **Ждут подтверждения**, **Истекают за сутки**.

## Как это выглядит у менеджера

Коллекция «Резервы» с цветными статусами. Доска канбан — карточку тянут из «Активен» в «Купил» или «Отказ»;
в карточке видно товар, вариант, количество, клиента, срок («через 2 дня») и поле для заметки.
Просроченные уходят в «Истёк» сами.

## Откат

```bash
# снять расширение
ssh brillex-cms 'sudo docker exec brillex_directus rm -rf /directus/extensions/directus-extension-reservations && sudo docker restart brillex_directus'
```

Бэкап базы перед изменением схемы: `/home/ubuntu/brillex-directus-before-reservations-20260823122112.sql.gz`.

---

# Рассылка о новинках — серверная часть

Расширение `directus/extensions/directus-extension-newsletter` (бандл: hook + endpoint + шаг Flow).
Письма уходят с `noreply@brillex.kz` через свой почтовый сервер (`EMAIL_*` в `docker-compose.yml`,
пароль — `EMAIL_SMTP_PASSWORD` в `.env` рядом).

## Установка и обновление

```bash
scp -r directus/extensions/directus-extension-newsletter brillex-cms:/home/ubuntu/
ssh brillex-cms 'sudo docker cp /home/ubuntu/directus-extension-newsletter brillex_directus:/directus/extensions/ && sudo docker exec -u 0 brillex_directus chown -R node:node /directus/extensions/directus-extension-newsletter && sudo docker restart brillex_directus'
```

При старте расширение само досоздаёт, чего не хватает (ничего не удаляет):

- `products.announced_at`, `product_variants.announced_at` — когда про товар / цвет ушло письмо;
- `customer_profiles.newsletter_unsubscribed` — клиент отписался;
- коллекцию **«Рассылки»** (`newsletter_log`) — журнал: кто запустил, сколько ушло, ошибки;
- Flow **«Разослать клиентам»** — кнопка в карточке товара.

## Как пользоваться

Карточка товара → справа **Flows → «Разослать клиентам»**:

- поле «Тест» — письмо уйдёт только на этот адрес (ничего не отмечается, можно сколько угодно раз);
- пусто — письмо уйдёт всем клиентам (пользователи с профилем клиента, активные, не отписавшиеся);
- товар ещё не рассылали — письмо «Новинка» со всеми цветами;
- товар уже рассылали, а потом добавили цвет — письмо «Новый цвет», новые цвета выделены;
- новых цветов нет — откажет; «Разослать повторно» отправит ещё раз.

Каждому клиенту — отдельное письмо с его именем, его скидкой и личной ссылкой «Отписаться»
(подписана `SECRET` Directus; работает и «отписаться в один клик» в Gmail / Mail.ru).
Письма уходят в фоне с паузой 1,5 с (`NEWSLETTER_GAP_MS`). Итог — в «Рассылках» и в колокольчике уведомлений.

Вёрстка письма — `template.js`, логотип — `public/email/logo-light.png` на сайте.
Превью на настоящем товаре без отправки:

```bash
node scripts/preview-newsletter.mjs termobutilka > /tmp/newsletter.html && open /tmp/newsletter.html
```

## Откат

```bash
ssh brillex-cms 'sudo docker exec brillex_directus rm -rf /directus/extensions/directus-extension-newsletter && sudo docker restart brillex_directus'
```

Поля и коллекция останутся (пустые и безвредные). Бэкап базы перед установкой:
`/home/ubuntu/brillex-directus-before-newsletter-20261005132024.sql.gz`.
