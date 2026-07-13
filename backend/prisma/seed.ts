import 'dotenv/config';
import { hash } from 'bcrypt';
import { PrismaClient, RequestStatus, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Простое логирование сида с уровнями DEBUG/INFO/WARN/ERROR.
 * Уровень задаётся через `LOG_LEVEL`; по умолчанию — DEBUG.
 */
const LOG_SEVERITY = ['DEBUG', 'INFO', 'WARN', 'ERROR'] as const;
type LogSeverity = (typeof LOG_SEVERITY)[number];

const currentLevelIndex = (() => {
  const raw = process.env.LOG_LEVEL?.trim().toUpperCase();
  const index = LOG_SEVERITY.indexOf(raw as LogSeverity);
  return index === -1 ? 0 : index;
})();

function log(level: LogSeverity, message: string): void {
  if (LOG_SEVERITY.indexOf(level) < currentLevelIndex) {
    return;
  }
  const line = `[Seed] ${message}`;
  if (level === 'ERROR') {
    console.error(line);
  } else if (level === 'WARN') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

const BCRYPT_ROUNDS = 10;

/** Демонстрационные пользователи: заявитель и проверяющий. */
const DEMO_USERS = [
  { email: 'requester@example.com', password: 'requester123', role: UserRole.Requester },
  { email: 'reviewer@example.com', password: 'reviewer123', role: UserRole.Reviewer },
];

/** Циклический набор статусов для демонстрации фильтрации и сортировки. */
const STATUS_CYCLE: RequestStatus[] = [
  RequestStatus.Pending,
  RequestStatus.Approved,
  RequestStatus.Rejected,
];

const DEMO_REQUEST_COUNT = 30;

/**
 * Создаёт/обновляет демонстрационных пользователей (идемпотентно, через upsert
 * по email) и возвращает соответствие email → id.
 */
async function seedUsers(): Promise<Map<string, string>> {
  const usersByEmail = new Map<string, string>();

  for (const demoUser of DEMO_USERS) {
    const passwordHash = await hash(demoUser.password, BCRYPT_ROUNDS);
    const user = await prisma.user.upsert({
      where: { email: demoUser.email },
      update: { passwordHash, role: demoUser.role },
      create: {
        email: demoUser.email,
        passwordHash,
        role: demoUser.role,
      },
    });
    usersByEmail.set(demoUser.email, user.id);
    log('DEBUG', `created user ${user.email} role=${user.role}`);
  }

  return usersByEmail;
}

/**
 * Создаёт демонстрационные заявки на покупку разных статусов от заявителя.
 * Идемпотентно: заявки имеют детерминированные id (`seed-request-N`) и
 * обновляются через upsert при повторном запуске.
 */
async function seedRequests(authorId: string): Promise<number> {
  for (let index = 0; index < DEMO_REQUEST_COUNT; index += 1) {
    const id = `seed-request-${index + 1}`;
    const status = STATUS_CYCLE[index % STATUS_CYCLE.length];
    const quantity = (index % 5) + 1;
    const amount = Number(((index + 1) * 12.5).toFixed(2));

    const data = {
      title: `Демо-заявка №${index + 1}`,
      quantity,
      amount,
      comment: index % 4 === 0 ? null : `Комментарий к заявке №${index + 1}`,
      status,
      authorId,
    };

    await prisma.purchaseRequest.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
    log('DEBUG', `upserted request ${id} status=${status}`);
  }

  return DEMO_REQUEST_COUNT;
}

/** Точка входа сида. */
async function main(): Promise<void> {
  log('INFO', 'start');

  const usersByEmail = await seedUsers();
  const requesterId = usersByEmail.get('requester@example.com');
  if (!requesterId) {
    throw new Error('Requester user was not created — cannot seed requests');
  }

  const createdRequests = await seedRequests(requesterId);
  log('INFO', `created ${createdRequests} requests`);
  log('INFO', 'done');
}

main()
  .catch((error) => {
    log(
      'ERROR',
      `seeding failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
