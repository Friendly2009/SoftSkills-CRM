# SoftSkills CRM — backend v1

Модульный монолит TypeScript + Express + MySQL для бесплатной беты учебных центров.
API: `/api/v1`. Рабочий исходный код — `backend/src`, новый интерфейс — `frontend/src/crm`.
Основная интеграция интерфейса с новым API **не выполнена по условию задачи**: frontend сохраняет свой режим моков.
ИИ убран из нового интерфейса и backend. Старые backend, бот, встроенные пароли и устаревшие маршруты удалены.

## Быстрый запуск

Нужны Node.js 22+ (LTS), npm, MySQL 8.0.16+ с InnoDB. Проверено на MySQL 8.0.46.

Создайте отдельную базу и пользователя через MySQL под администратором. Вставьте собственный случайный пароль:

```sql
CREATE DATABASE softskills_v1 CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
CREATE USER 'softskills'@'127.0.0.1' IDENTIFIED BY 'REPLACE_WITH_RANDOM_DB_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
ON softskills_v1.* TO 'softskills'@'127.0.0.1';
```

```bash
cd backend
npm ci
cp .env.example .env
openssl rand -hex 32
# В .env укажите DB_*, APP_ORIGIN и сгенерированный SESSION_SECRET.
npm run migrate
npm run typecheck
npm test
npm run build
npm start
```

Проверка готовности: `curl --fail http://127.0.0.1:3000/health/ready`.
Контракт API: `http://127.0.0.1:3000/api/v1/openapi.json` и `docs/openapi.json`.
Разработка: `npm run dev`. Обновление OpenAPI: `npm run openapi` из `backend`.

**Миграции не запускаются автоматически при старте сервера, не удаляют данные и не сбрасывают БД.**
Повторный `npm run migrate` пропускает применённые версии и проверяет контрольные суммы.
Новая схема использует префикс `crm_`; старые таблицы автоматически не переносятся.
Для существующей рабочей базы сначала нужен отдельный план переноса и резервная копия.

## Проверки

Модульные тесты не требуют БД:

```bash
cd backend
npm run typecheck
npm test
npm run build
```

Интеграционные тесты работают с настоящей MySQL, запускают HTTP-сервер на свободном localhost-порту.
**Используйте отдельную БД с именем, заканчивающимся на `_test`.** Тесты не очищают базу;
создают новые организации и оставляют фикстуры. Доступ пользователя к этой базе настраивается отдельно.

```sql
CREATE DATABASE softskills_test CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
ON softskills_test.* TO 'softskills'@'127.0.0.1';
```

```bash
cd backend
DB_NAME=softskills_test npm run migrate
DB_NAME=softskills_test npm run test:integration
```

Повторяющиеся тестовые запуски используют тот же лимит попыток входа, что приложение: 30 на IP за 15 минут.
При его достижении дождитесь истечения окна; не запускайте тесты против производственной БД.

Frontend (из корня проекта):

```bash
cd frontend
npm ci
npm run typecheck:crm
npm run test:crm
npm run build
```

## Документация

- `docs/API.md` — регистрация, cookies/CSRF, ресурсы, точные примеры запросов.
- `docs/DESIGN.md` — модель данных, права, транзакции, деньги, абонементы, ограничения.
- `docs/VERIFICATION.md` — фактически выполненные проверки и границы готовности.
- `deploy/` — пример systemd и фрагмент nginx для Ubuntu.

## Ubuntu / HTTPS

Установите Node.js и MySQL, разместите проект в `/opt/softskills`, создайте системного пользователя
`softskills`. Выполните миграции отдельной учётной записью мигратора, соберите backend.
Для рабочего пользователя БД после миграций достаточно SELECT/INSERT/UPDATE/DELETE на схему;
не выдавайте ему DROP/ALTER/CREATE. Пароли задаются снаружи архива.

Рабочая конфигурация `/etc/softskills/backend.env` должна содержать:

```dotenv
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
APP_ORIGIN=https://crm.example.com
COOKIE_SECURE=true
TRUST_PROXY=1
# DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, SESSION_SECRET — реальные локальные значения
```

Права файла: `root:softskills`, `0640`. Укажите фактический путь Node.js в `deploy/softskills.service`.
Скопируйте unit в `/etc/systemd/system/`, выполните `sudo systemctl daemon-reload` и
`sudo systemctl enable --now softskills`. Добавьте nginx-конфигурацию в HTTPS virtual host,
проверьте `sudo nginx -t`, затем `sudo systemctl reload nginx`.

Не открывайте порт 3000 наружу: `TRUST_PROXY=1` рассчитан на один доверенный локальный nginx.
Сервер требует secure cookies и HTTPS origin в production. Секрет сессий не хранится в git.
Резервные копии MySQL и проверка восстановления, TLS, мониторинг и реальные пользовательские
сценарии на целевом сервере остаются обязательными эксплуатационными работами.
