# Архитектура: Structured Modules (технические слои)

## Обзор

Приложение строится как **модульный монолит**: backend (NestJS) разбит на доменные
модули по областям функциональности, где каждый модуль инкапсулирует свои HTTP-обработчики,
сервисы (оркестрация сценариев), доступ к данным и модели. Внутри модуля код организован
по техническим слоям (`controllers` → `services` → `repositories`). Frontend (Vue 3 +
TypeScript) следует зеркальному принципу разделения: API-клиенты, сторы (Pinia), страницы
и переиспользуемые компоненты.

Паттерн выбран как прагматичная середина: он даёт чёткие границы модулей и однонаправленный
поток зависимостей без формализма Explicit Architecture, и естественно ложится на
идиоматику NestJS (один модуль = папка с контроллером, сервисом, модулем DI).

## Обоснование решения

- **Тип проекта:** веб-приложение «Заявка на покупку» (авторизация, приём и проверка заявок).
- **Технологический стек:** TypeScript, NestJS (backend), Vue 3 + TypeScript (frontend),
  PostgreSQL, Prisma.
- **Ключевой фактор:** средняя сложность домена с ясными границами (`auth`, `requests`,
  `users`), небольшая команда, единый деплой. Нужны структура и изоляция модулей, но без
  накладных расходов строгих слоёв домена.

## Структура папок

### Backend (NestJS)

```text
backend/
├── prisma/
│   ├── schema.prisma                      # Схема БД (User, PurchaseRequest, enum'ы)
│   ├── migrations/                        # Миграции Prisma
│   └── seed.ts                            # Сидер: тестовые пользователи и заявки
├── src/
│   ├── modules/
│   │   ├── auth/                          # ── МОДУЛЬ: авторизация ──
│   │   │   ├── controllers/
│   │   │   │   └── auth.controller.ts     # register, login
│   │   │   ├── services/
│   │   │   │   └── auth.service.ts        # оркестрация: хеш пароля, выпуск JWT
│   │   │   ├── dto/
│   │   │   │   ├── register.dto.ts
│   │   │   │   └── login.dto.ts
│   │   │   ├── strategies/                # JWT-стратегия Passport
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── users/                         # ── МОДУЛЬ: пользователи ──
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   │   └── users.service.ts       # поиск/создание пользователя
│   │   │   ├── repositories/
│   │   │   │   └── users.repository.ts    # доступ к данным через Prisma
│   │   │   ├── models/                    # доменные модели/типы пользователя
│   │   │   └── users.module.ts
│   │   │
│   │   └── requests/                      # ── МОДУЛЬ: заявки на покупку ──
│   │       ├── controllers/
│   │       │   └── requests.controller.ts # create, list (сортировка+пагинация), approve, reject
│   │       ├── services/
│   │       │   └── requests.service.ts    # оркестрация сценариев заявок
│   │       ├── repositories/
│   │       │   └── requests.repository.ts # orderBy/skip/take через Prisma
│   │       ├── dto/
│   │       │   ├── create-request.dto.ts
│   │       │   └── list-requests.query.dto.ts   # поля сортировки, направление, пагинация
│   │       ├── models/
│   │       │   └── purchase-request.model.ts     # доменная логика статусов
│   │       └── requests.module.ts
│   │
│   ├── shared/                            # ── ОБЩЕЕ (cross-cutting) ──
│   │   ├── guards/                        # JwtAuthGuard, RolesGuard
│   │   ├── decorators/                    # @CurrentUser, @Roles
│   │   ├── filters/                       # единый формат ошибок
│   │   ├── prisma/                        # PrismaModule + PrismaService
│   │   ├── types/                         # общие типы (UserRole, RequestStatus)
│   │   └── config/                        # конфигурация окружения
│   │
│   ├── app.module.ts
│   └── main.ts                            # bootstrap, ValidationPipe, CORS
└── test/
```

### Frontend (Vue 3 + TypeScript)

```text
frontend/
├── src/
│   ├── api/                               # HTTP-клиенты (axios/fetch), типизированные вызовы
│   │   ├── authApi.ts
│   │   └── requestsApi.ts
│   ├── stores/                            # Pinia — состояние и бизнес-логика UI
│   │   ├── useAuthStore.ts
│   │   └── useRequestsStore.ts
│   ├── views/                             # страницы-маршруты
│   │   ├── LoginView.vue
│   │   ├── CreateRequestView.vue
│   │   └── ReviewRequestsView.vue         # список с сортировкой и пагинацией
│   ├── components/                        # переиспользуемые компоненты
│   │   └── RequestsTable.vue
│   ├── types/                             # контракты компонентов и API
│   │   ├── request.types.ts
│   │   └── RequestsTable.types.ts         # props/emits таблицы
│   ├── router/                            # vue-router + guard на роли
│   └── main.ts
└── ...
```

## Правила зависимостей

- ✅ Внутри модуля поток строго вниз: `controllers → services → repositories → Prisma`.
- ✅ Модули зависят от `shared/`, но не от внутренностей друг друга — только через
  публичный API модуля (экспорт из `*.module.ts`).
- ✅ Frontend: `views/components → stores → api`. Компоненты не ходят в API напрямую.
- ❌ Пропуск слоёв: контроллер не обращается к репозиторию, минуя сервис.
- ❌ Обратные зависимости: сервис не импортирует контроллер, модель не импортирует сервис.
- ❌ Циклические зависимости модулей (`auth` ↔ `requests`) — общее выносить в `shared/`.

## Коммуникация слоёв и модулей

- **Внедрение зависимостей:** сервисы и репозитории получают зависимости через
  конструктор (DI-контейнер NestJS). `PrismaService` инжектируется в репозитории.
- **Межмодульное взаимодействие:** `requests` использует `users` через его публичный
  сервис (экспортируемый из `UsersModule`), а не через прямой доступ к репозиторию.
- **Авторизация:** `JwtAuthGuard` + `RolesGuard` из `shared/guards` применяются к
  защищённым эндпоинтам; роль пользователя проверяется декоратором `@Roles`.
- **Frontend ↔ backend:** сторы вызывают типизированные API-клиенты; access-токен JWT
  прикрепляется интерцептором.

## Ключевые принципы

1. **Границы модулей.** Каждый модуль инкапсулирует функциональную область и имеет
   публичный API. Другие модули используют только его, не заглядывая внутрь.
2. **Сервисы оркеструют, модели решают.** Сервисы — это Application Services: загрузить
   данные → вызвать метод модели → сохранить. Бизнес-правила (например, допустимость смены
   статуса заявки) живут в моделях, а не в сервисах.
3. **Тонкие контроллеры.** Контроллер валидирует вход (DTO + `ValidationPipe`), вызывает
   один-два метода сервиса и форматирует ответ. Никакой бизнес-логики.
4. **Репозитории инкапсулируют данные.** Вся работа с Prisma (в т.ч. `orderBy`, `skip`,
   `take` для сортировки и пагинации заявок) — в репозиториях, а не в сервисах/контроллерах.
5. **`shared/` минимален.** Туда попадают только по-настоящему сквозные вещи: guards,
   фильтры ошибок, PrismaService, общие типы.

## Примеры кода

### Тонкий контроллер + сортировка/пагинация заявок (NestJS)

```typescript
@Controller('requests')
@UseGuards(JwtAuthGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  /** Список заявок для проверяющего с сортировкой и пагинацией. */
  @Get()
  @Roles(UserRole.Reviewer)
  @UseGuards(RolesGuard)
  async list(@Query() query: ListRequestsQueryDto): Promise<PurchaseRequestDto[]> {
    return this.requestsService.listRequests(query);
  }

  /** Подтверждение заявки. */
  @Patch(':id/approve')
  @Roles(UserRole.Reviewer)
  @UseGuards(RolesGuard)
  async approve(@Param('id') id: string): Promise<PurchaseRequestDto> {
    return this.requestsService.approve(id);
  }
}
```

### Репозиторий инкапсулирует сортировку/пагинацию (Prisma)

```typescript
@Injectable()
export class RequestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Сортировка и пагинация выполняются на уровне БД, не в сервисе. */
  async findMany(query: ListRequestsQueryDto): Promise<PurchaseRequest[]> {
    const { sortField, sortDirection, page, pageSize } = query;
    return this.prisma.purchaseRequest.findMany({
      orderBy: { [sortField]: sortDirection },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }
}
```

### Бизнес-правило живёт в модели, а не в сервисе

```typescript
// ✅ ХОРОШО: инвариант статуса инкапсулирован в доменной модели
export class PurchaseRequestModel {
  constructor(public status: RequestStatus) {}

  approve(): void {
    if (this.status !== RequestStatus.Pending) {
      throw new CannotReviewFinalizedRequestError();
    }
    this.status = RequestStatus.Approved;
  }
}
```

## Антипаттерны

- ❌ **Анемичные модели.** Модель заявки как «мешок данных», а вся логика смены статуса —
  в сервисе. Правила должны быть в модели.
- ❌ **Пропуск слоёв.** Контроллер вызывает Prisma/репозиторий напрямую.
- ❌ **Толстый контроллер.** Валидация бизнес-правил, ветвления по статусу и запросы к БД
  внутри метода контроллера.
- ❌ **Обратные и циклические зависимости.** Сервис импортирует контроллер; `auth` и
  `requests` импортируют внутренности друг друга.
- ❌ **Бизнес-логика во frontend-компонентах.** Запросы и обработка данных должны быть в
  сторах/API-слое, а не в `.vue`-компонентах.
