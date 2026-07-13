<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  LoginInputSchema,
  RegisterInputSchema,
  UserRoleSchema,
} from '@ec-group/contracts';
import { useAuthStore } from '@/stores/useAuthStore';
import { resolveHomeRouteForRole } from '@/router/roleNavigation';
import { collectFieldErrors } from '@/shared/validation';
import { extractApiErrorMessage } from '@/api/httpClient';
import { logger } from '@/shared/logger';
import type { UserRole } from '@/types/request.types';

/**
 * Экран входа и регистрации.
 *
 * Одна форма с переключением режима вход/регистрация. Ввод валидируется общими
 * Zod-контрактами (`LoginInputSchema` / `RegisterInputSchema`) — сообщения об
 * ошибках показываются рядом с полями. После успеха пользователь уводится на
 * домашний маршрут своей роли.
 */

/** Режим формы. */
type FormMode = 'login' | 'register';

const authStore = useAuthStore();
const router = useRouter();

const mode = ref<FormMode>('login');
const isSubmitting = ref<boolean>(false);
const formErrorMessage = ref<string | null>(null);

/** Значения полей формы. */
const formValues = reactive<{ email: string; password: string; role: UserRole }>({
  email: '',
  password: '',
  role: 'Requester',
});

/** Ошибки валидации по полям. */
const fieldErrors = reactive<Record<string, string>>({});

/** Доступные роли для регистрации (из контракта). */
const availableRoles = UserRoleSchema.options;

/** Человекочитаемые подписи ролей. */
const roleLabels: Record<UserRole, string> = {
  Requester: 'Заявитель',
  Reviewer: 'Проверяющий',
};

const isRegisterMode = computed<boolean>(() => mode.value === 'register');

const submitLabel = computed<string>(() =>
  isRegisterMode.value ? 'Зарегистрироваться' : 'Войти',
);

/** Переключить режим и очистить ошибки. */
function switchMode(nextMode: FormMode): void {
  mode.value = nextMode;
  formErrorMessage.value = null;
  clearFieldErrors();
}

/** Сбросить накопленные ошибки полей. */
function clearFieldErrors(): void {
  for (const key of Object.keys(fieldErrors)) {
    delete fieldErrors[key];
  }
}

/**
 * Отправить форму: провалидировать контрактом, вызвать стор, увести по роли.
 */
async function handleSubmit(): Promise<void> {
  formErrorMessage.value = null;
  clearFieldErrors();
  logger.debug(`[LoginView] submit mode=${mode.value} email=${formValues.email}`);

  if (isRegisterMode.value) {
    const parsed = RegisterInputSchema.safeParse({
      email: formValues.email,
      password: formValues.password,
      role: formValues.role,
    });
    if (!parsed.success) {
      Object.assign(fieldErrors, collectFieldErrors(parsed.error));
      logger.warn('[LoginView] register validation failed');
      return;
    }
    await runAuthentication(() => authStore.register(parsed.data));
    return;
  }

  const parsed = LoginInputSchema.safeParse({
    email: formValues.email,
    password: formValues.password,
  });
  if (!parsed.success) {
    Object.assign(fieldErrors, collectFieldErrors(parsed.error));
    logger.warn('[LoginView] login validation failed');
    return;
  }
  await runAuthentication(() => authStore.login(parsed.data));
}

/** Выполнить вход/регистрацию и обработать результат единообразно. */
async function runAuthentication(authenticate: () => Promise<void>): Promise<void> {
  isSubmitting.value = true;
  try {
    await authenticate();
    const role = authStore.role;
    if (role) {
      logger.debug(`[LoginView] authenticated, redirecting role=${role}`);
      await router.push(resolveHomeRouteForRole(role));
    }
  } catch (error) {
    formErrorMessage.value = extractApiErrorMessage(error, 'Не удалось выполнить вход.');
    logger.warn('[LoginView] authentication failed', formErrorMessage.value);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <section class="login">
    <div class="card login__card">
      <h1 class="page-title">{{ isRegisterMode ? 'Регистрация' : 'Вход' }}</h1>

      <div class="login__tabs">
        <button
          type="button"
          class="login__tab"
          :class="{ 'login__tab--active': !isRegisterMode }"
          @click="switchMode('login')"
        >
          Вход
        </button>
        <button
          type="button"
          class="login__tab"
          :class="{ 'login__tab--active': isRegisterMode }"
          @click="switchMode('register')"
        >
          Регистрация
        </button>
      </div>

      <p v-if="formErrorMessage" class="form-error">{{ formErrorMessage }}</p>

      <form novalidate @submit.prevent="handleSubmit">
        <div class="field">
          <label class="field__label" for="email">Email</label>
          <input
            id="email"
            v-model="formValues.email"
            type="email"
            autocomplete="email"
            class="field__control"
            :class="{ 'field__control--invalid': fieldErrors.email }"
          />
          <span v-if="fieldErrors.email" class="field__error">{{ fieldErrors.email }}</span>
        </div>

        <div class="field">
          <label class="field__label" for="password">Пароль</label>
          <input
            id="password"
            v-model="formValues.password"
            type="password"
            :autocomplete="isRegisterMode ? 'new-password' : 'current-password'"
            class="field__control"
            :class="{ 'field__control--invalid': fieldErrors.password }"
          />
          <span v-if="fieldErrors.password" class="field__error">{{ fieldErrors.password }}</span>
        </div>

        <div v-if="isRegisterMode" class="field">
          <label class="field__label" for="role">Роль</label>
          <select id="role" v-model="formValues.role" class="field__control">
            <option v-for="roleOption in availableRoles" :key="roleOption" :value="roleOption">
              {{ roleLabels[roleOption] }}
            </option>
          </select>
          <span v-if="fieldErrors.role" class="field__error">{{ fieldErrors.role }}</span>
        </div>

        <button type="submit" class="button button--primary login__submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Отправка…' : submitLabel }}
        </button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.login {
  display: flex;
  justify-content: center;
  padding-top: 32px;
}

.login__card {
  width: 100%;
  max-width: 420px;
}

.login__tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.login__tab {
  flex: 1;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-weight: 600;
  cursor: pointer;
}

.login__tab--active {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.login__submit {
  width: 100%;
  margin-top: 4px;
}
</style>
