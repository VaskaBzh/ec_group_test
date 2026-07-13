# Базовые правила проекта

> Соглашения проекта. Кодовой базы пока нет — правила заданы на основе выбранного
> стека (NestJS + Prisma + Vue 3 + TypeScript). Уточняйте по мере развития проекта.

## Соглашения об именовании

- Файлы (backend, NestJS): `kebab-case` с суффиксом роли — `auth.controller.ts`,
  `requests.service.ts`, `create-request.dto.ts`, `jwt.guard.ts`.
- Файлы (frontend, Vue): компоненты — `PascalCase.vue`, сторы — `camelCase.ts`
  (`useRequestsStore.ts`), типы компонента — `Component.types.ts`.
- Переменные и функции: `camelCase`, без сокращений (`purchaseRequest`, а не `pr`).
- Классы, интерфейсы, типы, enum: `PascalCase` (`PurchaseRequest`, `UserRole`).
- Булевы значения читаются как утверждение: `isApproved`, `hasPendingRequests`.
- Функции читаются как действие: `findRequestsByAuthor`, `toRequestDto`.

## Структура модулей

- **Backend:** доменные модули в `src/<module>/` — каждый со своими
  `*.controller.ts`, `*.service.ts`, `dto/`, `entities`/Prisma-моделями.
  Общие вещи (guards, filters, decorators) — в `src/common/`.
- **Frontend:** разделение слоёв — `api/` (клиенты), `stores/` (Pinia),
  `views/` (страницы), `components/` (переиспользуемые), `types/` (контракты).
- Бизнес-логика — в сервисах (backend) и сторах (frontend), не в контроллерах
  и не в компонентах.
- Типы централизованы в отведённых местах слоя, а не разбросаны по файлам реализации.

## Обработка ошибок

- Backend: доменные ошибки через исключения NestJS (`BadRequestException`,
  `UnauthorizedException`, `ForbiddenException`, `NotFoundException`); единый формат
  ответов через exception filter.
- Валидация DTO через `class-validator` + глобальный `ValidationPipe`.
- Frontend: перехват ошибок API в слое клиентов/сторов, понятные сообщения в UI.

## Логирование

- Backend: встроенный `Logger` NestJS; уровень через `LOG_LEVEL`. Не логировать
  секреты, пароли и токены.

## Тестирование

- Backend: Jest (unit-тесты сервисов, e2e для контроллеров).
- Frontend: Vitest (+ Vue Test Utils) для компонентов и сторов.
