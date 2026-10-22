-- Починка броней и входа на проде (cms.brillex.kz).
-- Запуск: ssh brillex-cms 'U=$(sudo docker exec brillex_db printenv POSTGRES_USER); D=$(sudo docker exec brillex_db printenv POSTGRES_DB); sudo docker exec -i brillex_db psql -v ON_ERROR_STOP=1 -U "$U" -d "$D"' < scripts/prod-fix-reservations.sql
-- Скрипт идемпотентный: повторный запуск ничего не сломает.
-- 855dfe31-… — политика «Customer API» (роль Customer, в неё попадают все зарегистрированные клиенты).

begin;

-- Сабина: аккаунт заблокирован (suspended) вручную 21.10 — возвращаем доступ
update directus_users set status = 'active'
 where email = 'sabina@tolqynadv.kz' and status = 'suspended';

-- Брони, создание: бронь всегда на текущего клиента и в статусе active.
-- expires_at дописывает хук reservations, а Directus проверяет поля уже после хука — поэтому оно разрешено
-- (клиент своё значение подставить не может: хук его перезаписывает)
update directus_permissions set
  fields = 'product,variant,quantity,price_at_reserve,customer_comment,user,status,expires_at',
  presets = '{"user":"$CURRENT_USER","status":"active"}',
  validation = '{"_and":[{"quantity":{"_gte":1}},{"status":{"_eq":"active"}}]}'
 where policy = '855dfe31-d42f-4f4f-aed5-5ee8d7d1e5a1' and collection = 'reservations' and action = 'create';

-- Брони, чтение: клиент видит только свои (без этого создание отвечает 204 без тела, а «Мои брони» — 403)
insert into directus_permissions (collection, action, permissions, validation, presets, fields, policy)
select 'reservations', 'read', '{"user":{"_eq":"$CURRENT_USER"}}', null, null, '*', '855dfe31-d42f-4f4f-aed5-5ee8d7d1e5a1'
 where not exists (select 1 from directus_permissions where policy = '855dfe31-d42f-4f4f-aed5-5ee8d7d1e5a1' and collection = 'reservations' and action = 'read');

-- Брони, изменение: клиент может только отменить свою активную.
-- resolved_at / resolved_by при отмене проставляет хук — по той же причине они разрешены
insert into directus_permissions (collection, action, permissions, validation, presets, fields, policy)
select 'reservations', 'update', '{"_and":[{"user":{"_eq":"$CURRENT_USER"}},{"status":{"_eq":"active"}}]}', '{"status":{"_in":["cancelled"]}}', null, 'status,resolved_at,resolved_by', '855dfe31-d42f-4f4f-aed5-5ee8d7d1e5a1'
 where not exists (select 1 from directus_permissions where policy = '855dfe31-d42f-4f4f-aed5-5ee8d7d1e5a1' and collection = 'reservations' and action = 'update');
update directus_permissions set fields = 'status,resolved_at,resolved_by'
 where policy = '855dfe31-d42f-4f4f-aed5-5ee8d7d1e5a1' and collection = 'reservations' and action = 'update';

-- Каталог для залогиненного клиента (товар, вариант, цвет и фото внутри брони) — как у публичной политики
insert into directus_permissions (collection, action, permissions, validation, presets, fields, policy)
select c, 'read', '{}', null, null, '*', '855dfe31-d42f-4f4f-aed5-5ee8d7d1e5a1'
  from unnest(array['products', 'product_variants', 'product_variants_directus_files', 'colors', 'Categories', 'directus_files']) as c
 where not exists (select 1 from directus_permissions where policy = '855dfe31-d42f-4f4f-aed5-5ee8d7d1e5a1' and collection = c and action = 'read');

commit;

-- Проверка
select email, status from directus_users where email = 'sabina@tolqynadv.kz';
select collection, action, fields, permissions::text, validation::text, presets::text
  from directus_permissions where policy = '855dfe31-d42f-4f4f-aed5-5ee8d7d1e5a1' order by 1, 2;
