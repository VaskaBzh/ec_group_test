import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import { logger } from './shared/logger';
import { getConfiguredLogLevel } from './shared/logger';

/**
 * Точка входа frontend-приложения.
 *
 * Создаёт корневой компонент, подключает Pinia (состояние) и vue-router
 * (маршрутизация), затем монтирует приложение в `#app`.
 */
const application = createApp(App);

application.use(createPinia());
application.use(router);

application.mount('#app');

logger.info(`[main] application mounted (log level: ${getConfiguredLogLevel()})`);
