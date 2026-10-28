# SoftSkills CRM — frontend + backend

Реальный интерфейс подключён к API `/api/v1`: регистрация и сессии, роли, учебные
ресурсы, внутренний финансовый учёт, кабинеты и двухэтапный Excel-импорт.
По умолчанию mock-режим выключен. Старый демоинтерфейс доступен только при явной
сборке с `VITE_IS_MOCK=true`; его нельзя использовать для рабочих данных.

Инструкции для VPS: [DEPLOYMENT.md](docs/DEPLOYMENT.md).
Результаты проверки и границы готовности: [READINESS.md](docs/READINESS.md).
UI использует новый ресурсный интерфейс в `frontend/src/real`, а не старый snapshot API.

## Быстрый локальный запуск (Windows и Ubuntu)

Нужны Node.js >=22 и Docker с Compose v2 (`docker compose version`). Образы зафиксированы:
`node:22.18.0-bookworm-slim`, `mysql:8.0.46`, `nginx:1.28.0-alpine`. На Windows использовать Docker Desktop
с Linux containers/WSL2; команды ниже одинаковы в PowerShell и bash, из корня проекта.
На Ubuntu предварительно установить Docker Engine и Compose plugin по документации Docker.

```sh
node scripts/init-local.mjs
docker compose up -d --build
docker compose ps
docker compose logs migrate backend
curl http://localhost:3000/health/ready
```

Открыть http://localhost:5173/registration и создать организацию.

PowerShell: вместо curl можно `Invoke-RestMethod http://localhost:3000/health/ready`.
Скрипт создаёт `.env` с уникальными случайными секретами и не перезаписывает существующий файл.
Для ручной настройки — `env.example`. MySQL не публикует порт, backend слушает на localhost:3000.
Миграции запускаются отдельным одноразовым сервисом до backend. Пустая база не содержит демоданных.
Для остановки: `docker compose down`; **не добавлять `-v` к рабочей базе**, это удаляет данные.

## Воспроизводимая чистая проверка

```sh
docker compose --profile test rm -sf mysql-test verify
docker compose --profile test up --build --abort-on-container-exit --exit-code-from verify verify
docker compose --profile test rm -sf mysql-test verify
```

Изолированная MySQL в tmpfs, БД `crm_readiness_test`. Проверяются lint, unit, typecheck,
production build (при сборке образа), типы тестов, миграции дважды и все интеграционные тесты.
`readiness.test.ts` запускает `dist/server.js` с NODE_ENV=production и проверяет весь сценарий.
Тесты нельзя запускать на рабочей БД: они требуют суффикс `_test`, создают организации и очищают
таблицу ограничений входа. tmpfs удаляется при пересоздании тестового контейнера.

## Без Docker: Node.js и установленная MySQL 8

Создать БД utf8mb4 и отдельного пользователя с правами только на неё. В backend скопировать
`.env.example` в `.env` (PowerShell `Copy-Item .env.example .env`, bash `cp .env.example .env`),
указать DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, SESSION_SECRET.
Секрет: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

```sh
cd backend
npm ci
npm run typecheck
npm run typecheck:tests
npm run lint
npm test
npm run build
npm run migrate:prod
npm start
```

Для интеграционных тестов отдельный backend/.env с DB_NAME, оканчивающимся на `_test`:
`npm run migrate:prod`, затем `npm run test:integration`.
`npm run test:e2e` — только основной сквозной сценарий, требует предварительного build.
`npm run openapi` обновляет docs/openapi.json без подключения к БД.
Разработка: `npm run dev`; NODE_ENV=development. Установку npm ci выполнять именно в backend.

Для автоматической проверки на чистой нативной MySQL в Ubuntu: из корня
`bash scripts/verify-native.sh` после установки зависимостей и build. Скрипт запускает
одноразовый datadir на свободном порту 3307, тесты и полную проверку dump/restore.
`MYSQL_BASE` позволяет указать каталог установленной MySQL (по умолчанию `/usr`).

## Первый пользователь и явные dev-данные

Использовать `GET /api/v1/auth/csrf`, затем `POST /api/v1/auth/register` с cookies и CSRF.
Поля companyName/fullName/login/email/password, phone необязателен. Сохранить возвращённый
companySlug: он нужен для входа. Пароль минимум 12 символов. Регистрация создаёт первый филиал
и директора транзакционно. Далее директор создаёт филиалы, сотрудников и доступы.

Только для разработки можно явно создать демоорганизацию:

```sh
# bash, в backend при уже запущенном локальном сервере
NODE_ENV=development ALLOW_DEV_SEED=true npm run dev:seed
```

PowerShell: `$env:NODE_ENV='development'; $env:ALLOW_DEV_SEED='true'; npm run dev:seed`.
Команда печатает одноразово сгенерированные учётные данные. Нет фиксированного пароля,
startup/migrate/build никогда не запускают seed. Это минимальная демоорганизация;
полный набор учебных данных создают только интеграционные тесты в тестовой БД.

## Сервер и обновления

Для текущей связки используйте [DEPLOYMENT.md](docs/DEPLOYMENT.md) и
`compose.production.yml`. TLS-сертификат предоставляет администратор хостинга.
Платёжных/SMS/email-провайдеров в проекте нет; оплаты в CRM — внутренние записи учёта.
Общие сведения об API и резервном копировании: [operations.md](docs/operations.md).
