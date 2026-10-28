# Подключение frontend к API v1

Реальный интерфейс `frontend/src/real` подключён к API v1 и включён по умолчанию. Источник DTO — `openapi.json`,
генератор `npm run openapi`; исполняемые примеры — `backend/test/integration/readiness.test.ts`.
Все пути ниже относительно `/api/v1`. `GET /health/live` и `/health/ready` вне префикса.
Ответы ресурсов: `{data, requestId}`; не ожидать старый `{success: true}`.

## Замена старых запросов

| Старый вызов / экран | Новый вызов |
|---|---|
| `/signup` | `POST /auth/register`: companyName, fullName, login, email, password, phone? |
| `/signin` | `POST /auth/login`: companySlug, login (логин или email), password |
| `/getsession`, `/checkconnect` | `GET /auth/me` (401 означает отсутствие сессии) |
| `/logout` | `POST /auth/logout` с CSRF |
| Профиль, старые произвольные поля профиля | `GET/PATCH /profile`; `POST /profile/password` |
| Старые клиентские списки и CRUD `get*/create*/update*/delete*` | Ресурсы таблицы ниже; UUID, явные связи и версии |
| `/getfeedbacks`, `/getmyfeedback`, `/createfeedback`, `/updatefeedback…`, `/deletefeedback/…` | Аналога публичных отзывов нет. Не направлять на внутренние comments |
| Старые тарифы и оплата CRM | `GET /license`: free_beta; провайдера оплаты подписки CRM нет |
| Загрузка Excel напрямую | `POST /imports/people/preview`, затем `POST /imports/{id}/confirm` |

`frontend/src/real/client.ts` использует `/api/v1`, CSRF и сессионные cookies.
Формы используют сгенерированный `contract.json`; после изменения OpenAPI выполнить
`node scripts/sync-contract.mjs`, в CI — `node scripts/sync-contract.mjs --check`.
Legacy runtime и CrmApp сохранены только для явно включаемого деморежима.

## Экраны и endpoints

| Экран | API |
|---|---|
| Компания / филиалы / аудитории | `/organization`, `/branches`, `/rooms` |
| Люди и контакты | `/people`, `/people/{id}/contacts` |
| Клиенты-плательщики | `/payers`, `/payer-students`, `/accounts/{payerId}/balance`, `/accounts/{payerId}/history` |
| Ученики | `/students`, `/payer-students`, `/enrollments` |
| Сотрудники / доступ | `/staff`, `/users`, `/invitations`; выдача доступа — директор |
| Юрлица / задачи | `/companies`, `/tasks` |
| Группы | `/groups`, `/groups/{id}/members`, `/enrollments` |
| Расписание | `/lessons?from=…&to=…&branchId=…&groupId=…&teacherId=…&roomId=…&studentId=…` |
| Лиды / воронка | `/leads`, `/lead-stages`, `/pipeline`, `POST /leads/{id}/convert` |
| Абонементы | `/subscription-templates`, `/subscriptions`, `/{id}/availability`, `/{id}/usage`, POST freeze/unfreeze |
| Кассы / операции | `/accounts`, `/transactions`, `/transfers`, `/transactions/{id}/reverse` |
| Аналитика | `/analytics/overview?from=…&to=…`, `/reports/finance?from=…&to=…` |
| Настройки | `/organization`, `/dictionaries`, `/widgets` |
| Уведомления / объявления | `/notifications`, `POST /notifications/read`, `/announcements` |
| История и комментарии карточек | `/{resource}/{id}/history`, `/{resource}/{id}/comments` |

Не предполагать одинаковые права у всех маршрутов. Внутренние комментарии недоступны кабинетам.
Исторические строки не удалять на клиенте: использовать archive или компенсирующую операцию.

## Авторизация и CSRF

1. `GET /auth/csrf` с `credentials: 'include'`: сохранить `data.csrfToken` в памяти.
   Браузер получает HttpOnly cookie `crm_precsrf`.
2. Для регистрации, входа и принятия приглашения передавать bootstrap токен в `X-CSRF-Token`.
3. Сохранить **новый** csrfToken из ответа регистрации/входа, cookie `crm_session` хранит браузер.
   При перезагрузке получить CSRF через `/auth/me`.
4. Каждый запрос с cookies: `credentials: 'include'`. Каждая мутация: JSON + X-CSRF-Token.
   Не хранить session token в localStorage, не пытаться читать HttpOnly cookies.
5. После 401 сбросить пользовательские данные; не повторять автоматически денежные действия
   с новым ключом. После logout/смены пароля очистить state. Выход — POST.

Production требует HTTPS и Secure cookies. SameSite=lax для одного сайта;
SameSite=none нужен только при действительно разных сайтах и требует Secure. CORS разрешает
только точные origin из env. Домен организации идентифицирует companySlug, не companyName.

## Ошибки, версии, идемпотентность

```json
{"error":{"code":"VERSION_CONFLICT","message":"…","details":{}},"requestId":"uuid"}
```

400 — валидация (details обычно массив path/message), 401 — вход, 403 — права/CSRF,
404 — отсутствующий либо недоступный объект, 409 — конфликт версии/уникальности/бизнес-правила,
413 — размер файла, 415 — Content-Type, 429 — лимит входа, 503 — БД или конфликт транзакций.
Показывать понятное сообщение и requestId; не полагаться на конкретный текст message.
Nginx может вернуть HTML для своих 413/429: адаптер должен переживать не-JSON ответ.

Изменение/архивирование карточек: `If-Match: "3"` — текущий `version` в кавычках.
При 409 загрузить карточку и предложить повторно применить изменения. Занятия используют
`expectedRevision` в JSON, а не If-Match. Для операций с обязательным `Idempotency-Key`
создать UUID **один раз на намерение пользователя**, повторять тот же ключ и тот же body
при таймауте/503. Другое тело с тем же ключом даёт 409. Смена версии означает новое намерение.

## Списки

`page=1&pageSize=25`; pageSize 1–100, page до 100000. Обычно ответ
`{items,page,pageSize,total}`; attendance, notifications, comments общего маршрута и versions
используют ограниченные страницы без total — следовать DTO конкретного endpoint.
`q`, `branchId`, `status`, `archived=exclude|only|all`, `sortBy`, `sortOrder=asc|desc`.
Фильтры и сортировка только из allowlist конкретного ресурса. Не посылать все фильтры всем спискам.
Расписание обязательно ограничить from/to (максимум 93 дня). Время запросов — ISO 8601 с offset.
Старые SQL DATETIME в ответах интерпретировать как UTC; timezone занятия — IANA зона для отображения.

## Деньги и занятия

Деньги — строки целых копеек: `"1050"` = 10,50 руб. Входные суммы 0–999999999999;
баланс может быть отрицательным. Не использовать float для расчёта копеек: BigInt либо decimal.
`basePrice` занятия, у участника `payerId` и фиксированная `discount` **или** `discountPercent`.
Процент задаётся целым числом базисных пунктов: 10000 = 100%, 1250 = 12,5%.
Процент округляет итоговую стоимость HALF_UP до копейки; отрицательная итоговая цена запрещена.

Назначение: `POST /lessons` с branchId, teacherId, roomId, groupId/null, startsAt, endsAt,
name, subject, basePrice и attendees. Оплата: `POST /transactions` с kind=payment, accountId,
payerId, amount, reason. Оплата увеличивает кассу и аванс; проведение не является новой оплатой.

```json
{"expectedRevision":0,"reason":"Занятие проведено","attendance":[{"studentId":"uuid","status":"present"}]}
```

Отправить на `POST /lessons/{id}/complete` с Idempotency-Key. Все участники должны быть отмечены:
`present`, `absent`, `excused`. Неотмеченное состояние не превращать в прогул.
Проведение атомарно фиксирует посещаемость, списания, расход абонемента и начисление преподавателю.
Исправление директором/менеджером: тот же endpoint, новая expectedRevision, обязательная причина,
полный актуальный список attendance. `excused` возвращает списание и использование абонемента;
история содержит компенсации, прежние строки сохраняются. Не слать PATCH ledger.
Учитель может провести своё занятие первый раз; исправления доступны уполномоченному сотруднику.

Возврат: kind=refund, originalPaymentId (operationId исходной оплаты), accountId, payerId,
amount и reason. Частичный возврат не выше ещё не возвращённой суммы; лицевой счёт может уйти в минус.
Начисление зарплаты и kind=salary_payment — отдельные операции.

## Excel: preview → подтверждение

Один лист, 1–200 строк данных; первая колонка name, остальные email/phone/birthday/comment.
Без формул/гиперссылок; XLSX <=512 KiB, распакованные данные <=8 MiB, JSON <=1 MiB.
`POST /imports/people/preview`: `{branchId,kind:"people"|"payers"|"students",payerId?,fileBase64}`.
Для students payerId обязателен. Ответ содержит id, rowCount, rows, expiresInHours=24.
Preview проверяет всю пачку, в том числе конфликты контактов, и не создаёт людей.
Показать строки; явное подтверждение вызывает `POST /imports/{id}/confirm` с `{}` и новым ключом.
Подтверждает тот же пользователь; чужая организация/пользователь не получает preview.
При изменении данных между preview и confirm возможен конфликт: весь импорт откатится.
Повтор confirm с любым ключом возвращает исходный результат без новых записей.
Старый `POST /imports/people` оставлен для совместимости, но новый экран должен использовать preview.

## Кабинеты

Используются общие маршруты с серверной фильтрацией: `/profile`, `/students`, `/lessons`,
`/lessons/{id}/attendance`, `/groups`, `/subscriptions` и availability/usage.
Плательщик дополнительно читает свой `/accounts/{payerId}/balance` и history.
Ученик по умолчанию не получает финансовую историю плательщика. Не собирать кабинет
из административного кеша: кеши сбрасывать при logout, смене аккаунта и isMock.

## Один state isMock

В App.tsx сохранить единственный `const [isMock,setIsMock] = useState(...)`.
Передавать режим через существующий DataModeProvider; не добавлять state isMock в формы,
отдельные списки или API-клиент. `configureDataMode` — отражение App state для legacy адаптера,
не второй пользовательский переключатель. MockAdapter и ApiV1Adapter должны отдавать один
UI-контракт. При переключении отменять старые запросы, очищать кеш и не принимать поздние ответы.
В этой задаче frontend оставлен побайтово без изменений.
