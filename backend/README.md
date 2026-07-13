# Backend — Заявки на покупку (NestJS + Prisma)

API-сервер приложения на NestJS с PostgreSQL через Prisma.

## Требования

- Node.js 20+
- Запущенный PostgreSQL (проще всего — через корневой `docker-compose.yml`)

## Переменные окружения

Скопируйте `.env.example` в `.env` и при необходимости поправьте значения:

| Переменная     | Назначение                                   | Пример                                                                        |
| -------------- | -------------------------------------------- | ----------------------------------------------------------------------------- |
| `DATABASE_URL` | Строка подключения к PostgreSQL для Prisma   | `postgresql://app:app_password@localhost:5432/purchase_requests?schema=public` |
| `PORT`         | HTTP-порт NestJS-приложения                  | `3000`                                                                         |
| `LOG_LEVEL`    | Уровень логов: `DEBUG` / `INFO` / `WARN` / `ERROR` | `DEBUG`                                                                   |

Учётные данные в `DATABASE_URL` должны совпадать с параметрами PostgreSQL из
корневого `docker-compose.yml` (`POSTGRES_USER` / `POSTGRES_PASSWORD` /
`POSTGRES_DB` / `POSTGRES_PORT`).

## БД: миграции и сидеры

Модель данных описана в `prisma/schema.prisma`:

- **`User`** — пользователь с ролью `UserRole` (`Requester` — заявитель,
  `Reviewer` — проверяющий).
- **`PurchaseRequest`** — заявка на покупку со статусом `RequestStatus`
  (`Pending` / `Approved` / `Rejected`) и ссылкой на автора; индексы под
  сортировку по `createdAt`, `status`, `amount`, `authorId`.

### Запуск с нуля

1. Поднимите PostgreSQL из корня репозитория:

   ```bash
   docker compose up -d postgres
   ```

2. Установите зависимости и подготовьте окружение:

   ```bash
   npm install
   cp .env.example .env   # при необходимости отредактируйте DATABASE_URL
   ```

3. Примените миграции и сгенерируйте Prisma-клиент:

   ```bash
   npm run prisma:migrate   # prisma migrate dev
   ```

4. Наполните базу демо-данными:

   ```bash
   npm run prisma:seed      # prisma db seed
   ```

### Команды

| Команда                   | Действие                                                     |
| ------------------------- | ------------------------------------------------------------ |
| `npm run prisma:migrate`  | Применить миграции в dev-режиме (`prisma migrate dev`)       |
| `npm run prisma:seed`     | Наполнить БД демо-данными (`prisma db seed`)                 |
| `npm run prisma:reset`    | Сбросить БД, заново применить миграции и запустить сид       |
| `npm run prisma:generate` | Сгенерировать Prisma-клиент                                  |
| `npm run prisma:studio`   | Открыть Prisma Studio                                        |

### Сид-данные

Скрипт `prisma/seed.ts` идемпотентен (использует `upsert`) и создаёт:

- двух пользователей — `requester@example.com` (роль `Requester`) и
  `reviewer@example.com` (роль `Reviewer`), пароли захешированы через bcrypt;
- 30 демонстрационных заявок с чередующимися статусами
  (`Pending` / `Approved` / `Rejected`) — достаточно для проверки списка,
  сортировки и пагинации.

Пароли демо-пользователей: `requester123` и `reviewer123` (только для локальной
разработки).

Проверить сид на чистой БД:

```bash
npm run prisma:reset   # prisma migrate reset → миграции → db seed
```

## Запуск приложения

```bash
npm run start:dev   # режим разработки с автоперезапуском
npm run build       # сборка в dist/
npm run start:prod  # запуск собранной версии
```
