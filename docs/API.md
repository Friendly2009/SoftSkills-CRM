# API v1

## Соглашения

Все маршруты находятся под `/api/v1`. Ответ успеха: `{ "data": ..., "requestId": "UUID" }`.
Ошибка: `{ "error": { "code": "...", "message": "...", "details": ... }, "requestId": "UUID" }`.
HTTP 400 — валидация, 401 — вход, 403 — права/CSRF, 404 — недоступная запись,
409 — конфликт, 413 — размер, 415 — Content-Type, 429 — лимит входа, 503 — повтор транзакции.

Запись: `Content-Type: application/json`, максимум 1 MiB. Неизвестные поля отклоняются.
Входные поля — camelCase; строки сущностей в ответе — snake_case, как в OpenAPI.
ID — UUID. `price`, `discount`, `rate`, `salary`, `amount`, `balance` — **строки целых копеек**.
`"10001"` = 100 рублей 1 копейка. Отрицательная строка допускается в остатках и записях журнала,
но не в цене/скидке/сумме запроса. `discount` — абсолютная индивидуальная скидка в копейках.

Моменты во входе — ISO 8601 с UTC/offset. База хранит UTC DATETIME(3); ресурсные ответы
возвращают `YYYY-MM-DD HH:mm:ss.sss` в UTC, без локального преобразования.
Операционные ответы `endsAt`, `frozenAt` — ISO UTC. `birthday`, `date`, `start_date`, `end_date` — календарные даты.
Не интерпретируйте строки UTC из БД как локальное время браузера: адаптер frontend должен добавить `Z`.

Коллекции: `?page=1&pageSize=25` (максимум 100), ответ `items,page,pageSize,total`.
Дополнительные фильтры: `q` по имени/логину, `branchId`, `status`, `from`, `to` там, где применимо.
`from/to` доступны для занятий, ledger, audit; верхняя граница исключающая.
Неприменимый фильтр отклоняется. Подколлекции members/attendance/comments/notifications имеют items/page/pageSize.

## Регистрация и сессия

```bash
curl -c cookies.txt http://127.0.0.1:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"organization":"Учебный центр","name":"Андрей","login":"andrey","email":"andrey@example.com","password":"Set-a-unique-long-password"}'
```

Создаются организация, основной филиал, человек и директор. В ответе `data`:
`id` (user), `org`, `personId`, `roles`, `branches`, `branchId`, `csrfToken`.
Логин глобально уникален: это исключает неоднозначность входа между организациями.
Контактный email уникален внутри организации, может повторяться в другой организации.

`POST /auth/login`: `{login,password}`. `GET /auth/me` возвращает пользователя и `csrfToken`.
Каждая защищённая запись требует cookie `crm_session` и `X-CSRF-Token` из ответа входа.
Cookies HttpOnly, SameSite=Lax, 12 часов, Secure в production. Разрешён один APP_ORIGIN.
`POST /auth/logout` с `{}` отзывает текущую сессию. `POST /profile/password`
с `{currentPassword,password}` меняет пароль и отзывает все сессии пользователя.

## Ресурсы

| Раздел frontend | API |
|---|---|
| Клиенты | `/people`, `/people/:id/contacts`, `/payers`, `/students`, `/accounts/:id/balance` |
| Педагоги | `/staff` (директор задаёт `rate`), отдельно `/users` для входа |
| Доступ в CRM | `/users`, роли director/manager/teacher/payer/student, `branchIds` |
| Филиалы, аудитории | `/branches`, `/rooms` |
| Группы | `/groups`, `/groups/:id/members` |
| Уроки, расписание | `/lessons`, `/lessons/:id/attendance`, complete/cancel |
| Лиды | `/leads`, `/leads/:id/convert` |
| Финансы | `/accounts`, `/ledger`, `/transactions`, `/transactions/:operationId/reverse` |
| Абонементы | `/subscription-templates`, `/subscriptions`, freeze/unfreeze/availability |
| Задачи | `/tasks`, `/tasks/:id/status` |
| Юрлица | `/companies` |
| Настройки | `/organization`, `/dictionaries` |
| Аналитика | `/analytics`, `/analytics/overview?from=ISO&to=ISO&branchId=UUID`, `/widgets` |
| Информер | `/announcements` |
| Профиль | `/profile`, `/profile/password`, `/notifications`, `/notifications/read` |
| Комментарии, аудит | `/comments`, `/audit` (аудит — только директор) |
| Лицензия | `/license`: free_beta, billingEnabled=false, limits=null |
| Excel | `/imports/people` |

GET коллекции и GET `/:id` доступны для основных ресурсов по правам.
Набор операций записи и обязательные поля представлены в `openapi.json`.
PATCH для редактируемых ресурсов принимает **полную форму**, не произвольный частичный объект.
Удаление проведённых операций отсутствует намеренно. Группы/педагоги архивируются статусом;
филиалы/шаблоны/объявления — active=false, пользователи — active=false.

## Люди и роли

1. `POST /people`: `{branchId,name,birthday:null,comment:"",contacts:[]}`.
   Контакты: `[{kind:"email",value:"..."},{kind:"phone",value:"+79991234567"}]`.
2. `POST /payers`: `{personId}` → payer id и лицевой счёт с тем же id.
3. `POST /students`: `{personId,payerId}`. Детям контакты не обязательны.
4. `POST /staff`: `{personId,subject,rate:"50000"}` → staff id и зарплатный счёт с тем же id.
5. `POST /users`: `{personId,login,password,roles:["teacher"],branchIds:["..."]}`.
   Для teacher/payer/student сначала создайте соответствующий профиль.

Один person может иметь одновременно несколько профилей. Повторное назначение payer/student
возвращает существующий id; смена уже назначенного плательщика через создание отклоняется.
Плательщик и ученик не смешаны в одну таблицу «клиентов».
Пустой branchIds означает все филиалы; директор всегда видит все.

## Занятия и коррекции

```json
{
  "branchId":"UUID", "name":"Математика", "groupId":null,
  "teacherId":"UUID", "roomId":"UUID",
  "startsAt":"2026-11-01T10:00:00+03:00", "endsAt":"2026-11-01T11:00:00+03:00",
  "attendees":[{"studentId":"UUID","price":"150000","discount":"10000","subscriptionId":null}],
  "comment":"Индивидуальное занятие"
}
```

POST `/lessons` создаёт одно занятие, revision=0. `groupId:null` требует одного ученика;
групповое — явного состава из членов группы. Будущие изменения состава группы не меняют этот снимок.
Ставка берётся из staff, директор может добавить `salary` для конкретного занятия.
PATCH `/lessons/:id` переносит/меняет преподавателя непроведённого занятия: та же форма плюс expectedRevision.
При замене преподавателя его стандартная ставка фиксируется в занятии автоматически.

POST `/lessons/:id/complete`:

```json
{"expectedRevision":0,"reason":"Проведено занятие","attendance":[{"studentId":"UUID","status":"present"}]}
```

Статусы: present («Был»), absent («Прогул»), excused (уважительный).
Нужен полный точный список учеников занятия. Первый/второй статус списывают деньги и абонемент;
excused — нет. Начисление преподавателю фиксированное за проведённое занятие, независимо от явки.
Педагог может только впервые провести собственное начавшееся занятие, не может передать price/discount.
Менеджер/директор повторяют complete с актуальной revision и причиной; могут передать исправленные
price/discount каждого ученика. Прежние записи компенсируются, затем записывается новый результат.
POST `/lessons/:id/cancel`: `{expectedRevision,reason}` — отмена, включая сторнирование проведённого урока.
Исправление времени/состава/преподавателя уже проведённого занятия: отмена с компенсациями, создание правильного
занятия и проведение. История старого занятия остаётся доступной.

## Финансы и повторные запросы

Каждая финансовая команда, complete/cancel, freeze/unfreeze, convert, import требует
`Idempotency-Key` (8–128 символов, буквы/цифры/`_.:-`). Одинаковый ключ + одинаковое нормализованное
тело/путь/пользователь/права возвращает прежний результат. Иное тело с этим ключом — 409.
Ошибочная транзакция ключ не занимает. Генерируйте новый UUID для нового действия, сохраняйте старый для retry.

POST `/transactions`:

```json
{"kind":"payment","accountId":"CASH_UUID","payerId":"PAYER_UUID","amount":"500000","reason":"Наличные за обучение"}
```

payment/refund — менеджер и директор; expense/income/salary_payment — директор.
Для salary_payment передайте staffId вместо payerId; для expense/income не передавайте их.
Приход/возврат создаёт запись и в кассе, и на лицевом счёте. Денежные балансы вычисляются из ledger.
Касса не может уйти ниже нуля, лицевой счёт может. Выплата зарплаты не превышает текущий начисленный остаток;
последующее исправление урока может сделать зарплатный счёт отрицательным (переплата), история не удаляется.
Реальных переводов денег нет.

`POST /transactions/:id/reverse` использует **operationId**, не entry id, и `{reason}`.
Сторнируется вся ручная операция; записи урока исправляются только через complete/cancel.

## Абонементы

Шаблон задаёт name, subject, lessons, days, price, branchId. Его price — справочная стоимость;
выдача абонемента сама не создаёт оплату и не пополняет баланс.
POST `/subscriptions`: `{studentId,templateId,startsAt}`. days — точное количество 24-часовых периодов.
Используется явный subscriptionId участника занятия; без него обучение идёт без абонемента.
После истечения нельзя израсходовать неиспользованные занятия, в том числе задним числом.
При исправлении ранее списанного урока допускается восстановить прежнее списание того же абонемента:
это изменение истории, не выдача нового права использовать остаток.
Заморозка действует с серверного текущего момента. Unfreeze прибавляет фактическую длительность к ends_at.
Денежный баланс при заморозке/истечении не изменяется.

## Excel

Только XLSX, один лист, 1–200 строк данных. Первая колонка `name`, остальные опциональны:
`email`, `phone`, `birthday` (YYYY-MM-DD), `comment`. Контакты храните текстом, чтобы Excel не съел `+` и нули.
Формулы/гиперссылки/шифрованные архивы не принимаются. Ограничения: 512 KiB сжатого файла,
8 MiB распакованных XML; размер проверяется и по фактическому распаковыванию.

POST `/imports/people`: `{branchId,kind:"people"|"payers"|"students",fileBase64}`.
Для students дополнительно payerId. Импорт полностью атомарный: ошибочная строка откатывает все изменения.
Совпавший контакт переиспользует person, несовместимые контакты разных людей дают конфликт.
Без контактов невозможно надёжно определить дубликат только по имени: такие строки создают новых людей.
Один idempotency key предотвращает повтор всего импорта. Импорт сотрудников, расписания и финансов
не поддерживается текущим форматом — он предназначен для клиентской базы.

## Виджеты аналитики

GET `/analytics/overview` требует from/to (положительный период до 366 дней), branchId опционален.
Ответ содержит activeStudents, lessons (три статуса), sales (все шесть этапов), attendance
(present/absent/excused), finance (income/expense/net — строки копеек). Финансы считаются
по кассам, а не повторно по лицевым счетам. Сторнирование отменяет исходный доход/расход
в периоде своей записи. Воронка фильтруется по времени создания лида из audit, уроки — starts_at.
GET `/widgets`, PATCH `/widgets` с `{ids:["lessons","sales","finance","attendance"]}`
сохраняют выбор и порядок для текущего пользователя.
