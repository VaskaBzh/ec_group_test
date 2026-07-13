<script setup lang="ts">
/**
 * Skeleton-заглушка тела таблицы заявок на время загрузки.
 *
 * Рендерит несколько «пустых» строк с мерцающими ячейками, сохраняя число
 * колонок таблицы, чтобы при появлении данных верстка не «прыгала».
 */
const props = withDefaults(
  defineProps<{
    /** Число колонок таблицы. */
    columns: number;
    /** Число строк-заглушек. */
    rows?: number;
  }>(),
  { rows: 5 },
);
</script>

<template>
  <tbody class="skeleton">
    <tr v-for="row in props.rows" :key="row">
      <td v-for="column in props.columns" :key="column">
        <span class="skeleton__cell" />
      </td>
    </tr>
  </tbody>
</template>

<style scoped>
.skeleton td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.skeleton__cell {
  display: block;
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, #eef0f3 25%, #e2e5ea 37%, #eef0f3 63%);
  background-size: 400% 100%;
  animation: skeleton-shimmer 1.4s ease infinite;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}
</style>
