# Заявки на покупку

Веб-приложение для управления заявками на покупку. Заявитель создаёт заявки,
проверяющий их рассматривает — подтверждает или отклоняет. Список поддерживает
сортировку (дата, статус, сумма, автор) и пагинацию. Доступ разграничен по ролям.

## Стек

- **Backend:** NestJS + Prisma, PostgreSQL, JWT-аутентификация
- **Frontend:** Vue 3 + TypeScript (Vite, Pinia)
- **Общие контракты:** Zod-схемы в `shared/contracts` (`@ec-group/contracts`)

## Структура

```
backend/          NestJS API (модули auth, requests, users)
frontend/         Vue 3 SPA
shared/contracts/ общие Zod-контракты запросов/ответов
docker-compose.yml  PostgreSQL для локальной разработки
```

## Требования

Node.js 20+, npm. Для базы — Docker (проще всего) либо локальный PostgreSQL.

## Запуск

### Вариант 1. С Docker (рекомендуется)

Через `make` поднимается база в Docker, а backend и frontend запускаются локально.

```bash
make init                       # настройки PostgreSQL
make backend-setup              # поднять БД, установить зависимости, миграции, сиды
make frontend-install           # установить зависимости фронтенда
make dev:all                    # запустить backend + frontend (Ctrl+C останавливает оба)
```

Полезные команды: `make up` / `make down` (база), `make logs`, `make psql`,
`make db-reset` (сброс + миграции + сиды), `make studio` (Prisma Studio).
Полный список — `make help`.

### Вариант 2. Вручную

**1. База данных.** Поднять PostgreSQL в Docker:

```bash
cp .env.example .env
docker compose up -d
```

или использовать свой сервер PostgreSQL.

**2. Backend:**

```bash
cd backend
cp .env.example .env            # проверьте DATABASE_URL (см. ниже)
npm install
npm run prisma:generate
npm run prisma:migrate          # применить миграции
npm run prisma:seed             # тестовые данные
npm run start:dev               # http://localhost:3000
```

**3. Frontend:**

```bash
cd frontend
cp .env.example .env            # VITE_API_URL по умолчанию http://localhost:3000
npm install
npm run dev                     # http://localhost:5173
```

## Переменные окружения

- **Корень (`.env`)** — параметры контейнера PostgreSQL: `POSTGRES_USER`,
  `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`.
- **`backend/.env`** — `DATABASE_URL` (должен совпадать с настройками базы),
  `PORT`, `JWT_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `CORS_ORIGIN`, `LOG_LEVEL`.
- **`frontend/.env`** — `VITE_API_URL`, `VITE_LOG_LEVEL`.

Шаблоны — в файлах `*.env.example`. Учтите: `DATABASE_URL` в backend должен
использовать те же логин/пароль/базу, что и PostgreSQL из корневого `.env`.

## Тестовые пользователи

После сидов доступны два аккаунта:

| Роль        | Email                   | Пароль        |
|-------------|-------------------------|---------------|
| Заявитель   | `requester@example.com` | `requester123`|
| Проверяющий | `reviewer@example.com`  | `reviewer123` |
