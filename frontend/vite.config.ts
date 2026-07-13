import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

/**
 * Конфигурация сборки frontend.
 *
 * - Подключает плагин Vue (SFC + `<script setup>`).
 * - Алиас `@` указывает на `src/`, чтобы импорты не зависели от глубины вложенности.
 * - Dev-сервер поднимается на порту 5173; обращение к backend идёт напрямую по
 *   `VITE_API_URL` (backend включает CORS), поэтому прокси не требуется.
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Общий пакет `@ec-group/contracts` подключён как локальная зависимость и
  // резолвится по симлинку в путь вне `node_modules`. Он собран в CommonJS,
  // поэтому явно включаем его в CommonJS→ESM трансформацию Rollup — иначе на
  // сборке именованные экспорты (Zod-схемы) не определяются.
  optimizeDeps: {
    include: ['@ec-group/contracts'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/, /shared[/\\]contracts/],
    },
  },
  server: {
    port: 5173,
  },
});
