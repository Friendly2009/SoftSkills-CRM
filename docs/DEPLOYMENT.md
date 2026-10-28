# Развёртывание фронтенда и API на одном HTTPS-домене

Этот вариант рассчитан на Linux VPS с Docker Engine и Compose v2, постоянным диском,
доменом и TLS-сертификатом. Статического хостинга без Node/MySQL недостаточно.
Frontend обращается к `/api/v1` того же домена; Nginx пересылает запросы в backend.
Отдельные домены frontend/API в этой конфигурации не требуются и не проверялись.

## Первый запуск

1. Направить DNS домена на VPS. Открыть только необходимые входящие порты: 80, 443 и SSH.
2. Получить доверенный TLS-сертификат для домена. Подготовить каталог с файлами
   `fullchain.pem` и `privkey.pem`. Если сертификат содержит симлинки (например, Certbot),
   каталог внутри контейнера должен содержать их реальные цели: можно копировать файлы
   с разыменованием в отдельный закрытый каталог и обновлять их deploy-hook после продления.
3. В корне распакованного проекта выполнить (Node 22):

```sh
node scripts/init-production.mjs https://crm.example.com /srv/crm/tls
docker compose -f compose.production.yml --env-file .env.production config --quiet
docker compose -f compose.production.yml --env-file .env.production up -d --build
docker compose -f compose.production.yml --env-file .env.production ps
docker compose -f compose.production.yml --env-file .env.production logs --tail=100 migrate backend frontend
```

Подставить свой домен и абсолютный путь. Генератор создаёт уникальные случайные секреты,
не печатает их и не перезаписывает существующий `.env.production`. Сохранить этот файл
отдельно от исходников с доступом только администратора. Не менять пароль MySQL в env
после первого запуска без изменения пароля в самой БД: переменные инициализации образа
не переинициализируют уже существующий том.

MySQL и backend не публикуют внешние порты. Миграции выполняются до запуска API.
Frontend собирается в реальном режиме (`VITE_IS_MOCK=false`); Vite-переменные задаются
во время сборки, а не после запуска контейнера. API использует Secure/HttpOnly cookies,
CSRF, точный `APP_ORIGIN` и один доверенный reverse proxy.

## Приёмка на конкретном VPS

```sh
docker compose -f compose.production.yml --env-file .env.production exec -T backend node -e "fetch('http://127.0.0.1:3000/health/ready').then(async r=>{console.log(await r.text());process.exit(r.ok?0:1)})"
curl -I https://crm.example.com/authorization
curl -i https://crm.example.com/api/v1/auth/csrf
```

В браузере зарегистрировать отдельную тестовую организацию, сохранить код организации,
выйти и войти заново. Создать человека, плательщика и ученика, кассу, оплату, прошедшее
занятие; проверить проведение, баланс, корректировку и возврат. Проверить отдельные
учётные записи менеджера/преподавателя/плательщика/ученика. Обновить страницу вложенной
карточки напрямую: она должна открыться, сессия должна сохраниться. Проверить отсутствие
ошибок в Console/Network и серверных логах. Рабочие данные вносить после этой приёмки.

Включить наблюдение за рестартами, ошибками API, свободным диском, сроком сертификата
и успешными резервными копиями. После продления сертификата:

```sh
docker compose -f compose.production.yml --env-file .env.production exec -T frontend nginx -s reload
```

## Копия и проверка восстановления

Скрипт копии рассчитан на остановленные записи и дампы до 256 МБ. Для больших БД нужен
потоковый backup. Для небольшой установки:

```sh
docker compose -f compose.production.yml --env-file .env.production stop backend
node scripts/backup.mjs backup backups/2026-10-28 --production
docker compose -f compose.production.yml --env-file .env.production --profile restore up -d --wait mysql-restore
node scripts/backup.mjs verify-restore backups/2026-10-28 --production
docker compose -f compose.production.yml --env-file .env.production rm -sf mysql-restore
docker compose -f compose.production.yml --env-file .env.production start backend
```

Использовать новый каталог для каждой копии. Если проверка завершилась ошибкой,
разобраться с ней до продолжения работы. Копировать SQL, manifest и необходимые секреты
на другой носитель/сервер с ограниченным доступом. Автоматизировать ежедневную копию
и периодическую проверку восстановления; приведённые команды сами расписание не создают.
Restore-service хранит данные только в tmpfs и не подключает основной том.
Не выполнять `docker compose down -v` на рабочей установке.

## Обновление

Сделать и проверить копию. Остановить backend, обновить исходники, собрать образы,
выполнить `docker compose ... run --rm migrate`, затем `docker compose ... up -d`.
Проверить health и браузерный вход. Не откатывать только приложение после несовместимой
миграции: восстановление БД требует отдельного проверенного плана. Текущие миграции
001–008 не изменены в ходе подключения frontend.

## Ограничения проверок

В среде разработки нет Docker daemon: контейнеры и Compose на настоящем VPS здесь не
запускались. Production JS, MySQL 8.0.46, браузер Chromium, HTTPS и конфигурация Nginx
проверяются нативно. Нативный Nginx — 1.24.0; Dockerfile использует 1.28.0-alpine.
Это не нагрузочная сертификация и не проверка конкретного DNS, сертификата или диска VPS.
