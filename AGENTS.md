# AGENTS.md

> Структурная карта проекта для AI-агентов и разработчиков. Поддерживайте файл в
> актуальном состоянии при значимых изменениях структуры. Детали не дублируются —
> см. ссылки на документы ниже.

## Обзор проекта

Веб-приложение «Заявка на покупку»: авторизация по ролям, приём заявок на покупку и
их проверка (подтверждение/отклонение) со списком, сортировкой и пагинацией.

## Технологический стек

- **Язык программирования:** TypeScript
- **Backend:** NestJS (Node.js)
- **Frontend:** Vue 3 на TypeScript (Composition API, Vite)
- **База данных:** PostgreSQL
- **ORM:** Prisma

## Структура проекта

```
.
├── .ai-factory/            # Контекст AI Factory (спецификация, правила, конфиг)
│   ├── DESCRIPTION.md      # Спецификация проекта
│   ├── config.yaml         # Конфигурация AI Factory (языки, пути, git)
│   └── rules/base.md       # Базовые соглашения кода
├── .claude/                # Скиллы и агенты Claude Code
│   └── skills/             # Установленные скиллы (aif*, nestjs, prisma, vue)
├── backend/                # NestJS API (TypeScript + Prisma)
│   ├── prisma/             # schema.prisma, миграции, seed.ts
│   └── src/
│       ├── modules/
│       │   ├── auth/       # register/login, JWT-стратегия, AuthService
│       │   ├── users/      # UsersRepository/Service, маппер User→UserDto
│       │   └── requests/   # заявки: controller/service/repository, доменная модель, мапперы
│       ├── shared/         # guards, decorators, filters, prisma, config, types
│       ├── app.module.ts   # сборка модулей (Config + Prisma + auth/users/requests)
│       └── main.ts         # bootstrap: ZodValidationPipe, exception filter, CORS
├── frontend/               # Vue 3 SPA (Vite + TypeScript, script setup)
│   └── src/
│       ├── api/            # httpClient (JWT/401-интерцепторы), authApi, requestsApi
│       ├── stores/         # Pinia: useAuthStore, useRequestsStore
│       ├── views/          # LoginView, CreateRequestView, ReviewRequestsView
│       ├── components/     # AppHeader, RequestsTable(+Skeleton)
│       ├── router/         # маршруты, ролевые guard'ы, редирект по роли
│       ├── types/          # реэкспорт контрактов + контракты компонентов
│       ├── shared/         # logger, session, validation, format
│       └── main.ts         # bootstrap: Pinia + router, монтирование
├── shared/
│   └── contracts/          # Пакет @ec-group/contracts — Zod-схемы и типы API
│       └── src/            # enums, auth, requests, dto, list-query, index
├── .mcp.json               # Конфигурация MCP-серверов (postgres)
└── AGENTS.md               # Этот файл — карта проекта
```

> Backend (`backend/`) реализует авторизацию по ролям и заявки на покупку.
> Общие контракты API (`shared/contracts/`) — единый источник правды для типов
> запросов/ответов, переиспользуемый backend'ом (`nestjs-zod`) и frontend'ом.
> Frontend (`frontend/`) — Vue 3 SPA: слои `api → stores → views/components`,
> ролевая маршрутизация и потребление тех же Zod-контрактов.

## Ключевые точки входа

| Файл | Назначение |
|------|------------|
| `.ai-factory/DESCRIPTION.md` | Спецификация: возможности, стек, требования |
| `.ai-factory/config.yaml` | Языки, пути артефактов, настройки git |
| `.mcp.json` | MCP-сервер postgres (нужна env `DATABASE_URL`) |
| `shared/contracts/src/index.ts` | Публичный API пакета контрактов (реэкспорт всех схем/типов) |
| `backend/src/main.ts` | Bootstrap NestJS: Zod-валидация, фильтр ошибок, CORS |
| `backend/src/app.module.ts` | Корневой модуль: Config, Prisma, auth/users/requests |
| `backend/prisma/schema.prisma` | Схема БД (User, PurchaseRequest, enum'ы) |
| `frontend/src/main.ts` | Bootstrap Vue: Pinia + router, монтирование приложения |
| `frontend/src/api/httpClient.ts` | Axios-клиент: JWT-интерцептор, обработка 401 (refresh/logout) |
| `frontend/src/router/index.ts` | Маршруты и подключение ролевых guard'ов |

## Документация

| Документ | Путь | Описание |
|----------|------|----------|
| Спецификация | .ai-factory/DESCRIPTION.md | Полное описание проекта и требований |

## AI-контекстные файлы

| Файл | Назначение |
|------|------------|
| AGENTS.md | Структурная карта проекта для агентов |
| .ai-factory/DESCRIPTION.md | Спецификация проекта |
| .ai-factory/ARCHITECTURE.md | Архитектура: Structured Modules (технические слои) |
| .ai-factory/rules/base.md | Базовые соглашения кода |

## Правила для агента

- Разбивайте составные shell-команды на отдельные шаги, не объединяйте через `&&`.
  - Неверно: `git checkout main && git pull`
  - Верно: сначала `git checkout main`, затем `git pull origin main`
