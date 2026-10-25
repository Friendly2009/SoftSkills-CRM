# Изменения относительно исходного архива

- Новый backend/src: core (API, auth primitives, DB, errors, schemas) и модули auth, people,
  resources, education, finance, sales, imports, collaboration, analytics.
- Три версионированные SQL-миграции, отдельная новая схема crm_*, без destructive reset.
- Сессии в MySQL, HttpOnly cookie, CSRF, ограничение запросов входа, точные права и аудит.
- Нормализованные люди и контакты; плательщики, ученики, сотрудники и аккаунты разделены.
- Расписание, вместимость, посещаемость, исправления, денежный ledger, зарплата, абонементы.
- XLSX-импорт клиентской базы, лиды, задачи, юрлица, объявления, профиль, уведомления, аналитика.
- 5 модульных и 23 интеграционных теста backend, документация, OpenAPI, примеры Ubuntu deployment.
- Удалены прежние backend/controllers, router, SQL-схема, bot, additional_software, .env,
  старые тесты/сервисы: они относились к несовместимой модели и больше не запускаются.
- Во frontend удалены только новый ИИ-экран, его request declarations и пункт навигации;
  стартовый переход теперь ведёт в analytics. Остальной frontend и его data mode сохранены.
- Архив не содержит node_modules, Python venv, build output, реальных .env и ключей.

Старые данные нужно переносить отдельно. Это замена backend, не совместимый патч старого API.
