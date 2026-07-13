<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import { logger } from '@/shared/logger';

/**
 * Корневой компонент приложения.
 *
 * Держит общий каркас (шапка с навигацией и выходом) и точку вывода активного
 * маршрута. Вся доменная логика вынесена в сторы и вложенные представления.
 */
onMounted(() => {
  logger.debug('[App] mounted');
});
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <main class="app-content">
      <RouterView v-slot="{ Component }">
        <component :is="Component" />
      </RouterView>
    </main>
  </div>
</template>

<style>
:root {
  --color-background: #f5f6f8;
  --color-surface: #ffffff;
  --color-border: #e2e5ea;
  --color-text: #1f2430;
  --color-text-muted: #6b7280;
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-danger: #dc2626;
  --color-success: #16a34a;
  --color-warning: #d97706;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--color-background);
  color: var(--color-text);
}

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-content {
  flex: 1;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px;
}

/* ── Общие элементы интерфейса ── */

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.field__label {
  font-size: 14px;
  font-weight: 600;
}

.field__control {
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 15px;
  background: var(--color-surface);
  color: var(--color-text);
}

textarea.field__control {
  height: auto;
  min-height: 88px;
  padding: 10px 12px;
  resize: vertical;
}

.field__control:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.field__control--invalid {
  border-color: var(--color-danger);
}

.field__error {
  font-size: 13px;
  color: var(--color-danger);
}

.form-error {
  margin: 0 0 16px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fef2f2;
  color: var(--color-danger);
  font-size: 14px;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 40px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  background: var(--color-surface);
  color: var(--color-text);
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button--primary {
  background: var(--color-primary);
  color: #ffffff;
}

.button--primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.button--ghost {
  border-color: var(--color-border);
}

.button--success {
  background: var(--color-success);
  color: #ffffff;
}

.button--danger {
  background: var(--color-danger);
  color: #ffffff;
}

.button--small {
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
}

.page-title {
  margin: 0 0 20px;
  font-size: 24px;
}
</style>
