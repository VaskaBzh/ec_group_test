<script setup lang="ts">
import { useRouter, RouterLink } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/useAuthStore';
import { logger } from '@/shared/logger';

/**
 * Шапка приложения: бренд, навигация по роли и выход.
 *
 * Показывает навигацию и кнопку выхода только аутентифицированному
 * пользователю; ссылки зависят от роли (заявитель — создание заявки,
 * проверяющий — список на проверку).
 */
const authStore = useAuthStore();
const router = useRouter();
const { isAuthenticated, isRequester, isReviewer, currentUser } = storeToRefs(authStore);

/** Выйти и вернуться на страницу входа. */
async function handleLogout(): Promise<void> {
  logger.debug('[AppHeader] logout clicked');
  authStore.logout();
  await router.push({ name: 'login' });
}
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <span class="app-header__brand">Заявки на покупку</span>

      <nav v-if="isAuthenticated" class="app-header__nav">
        <RouterLink v-if="isRequester" :to="{ name: 'create-request' }" class="app-header__link">
          Новая заявка
        </RouterLink>
        <RouterLink v-if="isReviewer" :to="{ name: 'review-requests' }" class="app-header__link">
          Заявки на проверку
        </RouterLink>
      </nav>

      <div v-if="isAuthenticated" class="app-header__user">
        <span class="app-header__email">{{ currentUser?.email }}</span>
        <button type="button" class="button button--ghost button--small" @click="handleLogout">
          Выйти
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.app-header__inner {
  display: flex;
  align-items: center;
  gap: 24px;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 12px 16px;
}

.app-header__brand {
  font-weight: 700;
  font-size: 16px;
}

.app-header__nav {
  display: flex;
  gap: 16px;
  flex: 1;
}

.app-header__link {
  color: var(--color-text-muted);
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
}

.app-header__link.router-link-active {
  color: var(--color-primary);
}

.app-header__user {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.app-header__email {
  font-size: 14px;
  color: var(--color-text-muted);
}
</style>
