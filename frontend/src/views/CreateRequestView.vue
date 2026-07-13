<script setup lang="ts">
import { reactive, ref } from 'vue';
import { CreateRequestInputSchema } from '@ec-group/contracts';
import { useRequestsStore } from '@/stores/useRequestsStore';
import { collectFieldErrors } from '@/shared/validation';
import { extractApiErrorMessage } from '@/api/httpClient';
import { logger } from '@/shared/logger';

/**
 * Экран создания заявки на покупку (роль «заявитель»).
 *
 * Форма (наименование, количество, сумма, комментарий) валидируется общим
 * контрактом `CreateRequestInputSchema` перед отправкой через стор. После
 * успешного создания показывает подтверждение и очищает форму для новой заявки.
 */
const requestsStore = useRequestsStore();

const isSubmitting = ref<boolean>(false);
const formErrorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

/** Значения полей формы (числа держим строками для контроля пустого ввода). */
const formValues = reactive<{
  title: string;
  quantity: string;
  amount: string;
  comment: string;
}>({
  title: '',
  quantity: '',
  amount: '',
  comment: '',
});

/** Ошибки валидации по полям. */
const fieldErrors = reactive<Record<string, string>>({});

/**
 * Привести ввод к числу для валидации контрактом.
 *
 * `<input type="number">` в связке с `v-model` может отдавать как строку, так и
 * число, поэтому приводим значение к строке перед проверкой. Пустой ввод
 * становится `NaN` — контракт `CreateRequestInputSchema` отклонит его с понятным
 * сообщением.
 */
function toNumber(rawValue: string | number): number {
  const normalizedValue = String(rawValue).trim();
  return normalizedValue === '' ? Number.NaN : Number(normalizedValue);
}

/** Сбросить накопленные ошибки полей. */
function clearFieldErrors(): void {
  for (const key of Object.keys(fieldErrors)) {
    delete fieldErrors[key];
  }
}

/** Очистить форму после успешного создания. */
function resetForm(): void {
  formValues.title = '';
  formValues.quantity = '';
  formValues.amount = '';
  formValues.comment = '';
}

/**
 * Отправить форму: провалидировать контрактом и создать заявку через стор.
 */
async function handleSubmit(): Promise<void> {
  formErrorMessage.value = null;
  successMessage.value = null;
  clearFieldErrors();

  const commentValue = formValues.comment.trim();
  const parsed = CreateRequestInputSchema.safeParse({
    title: formValues.title,
    quantity: toNumber(formValues.quantity),
    amount: toNumber(formValues.amount),
    comment: commentValue === '' ? undefined : commentValue,
  });

  logger.debug(
    `[CreateRequestView] submit title="${formValues.title}" quantity=${formValues.quantity} amount=${formValues.amount}`,
  );

  if (!parsed.success) {
    Object.assign(fieldErrors, collectFieldErrors(parsed.error));
    logger.warn('[CreateRequestView] validation failed');
    return;
  }

  isSubmitting.value = true;
  try {
    const createdRequest = await requestsStore.createRequest(parsed.data);
    successMessage.value = `Заявка «${createdRequest.title}» создана.`;
    logger.debug(`[CreateRequestView] created id=${createdRequest.id}`);
    resetForm();
  } catch (error) {
    formErrorMessage.value = extractApiErrorMessage(error, 'Не удалось создать заявку.');
    logger.warn('[CreateRequestView] create failed', formErrorMessage.value);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <section class="create-request">
    <div class="card create-request__card">
      <h1 class="page-title">Новая заявка</h1>

      <p v-if="successMessage" class="form-success">{{ successMessage }}</p>
      <p v-if="formErrorMessage" class="form-error">{{ formErrorMessage }}</p>

      <form novalidate @submit.prevent="handleSubmit">
        <div class="field">
          <label class="field__label" for="title">Наименование</label>
          <input
            id="title"
            v-model="formValues.title"
            type="text"
            class="field__control"
            :class="{ 'field__control--invalid': fieldErrors.title }"
          />
          <span v-if="fieldErrors.title" class="field__error">{{ fieldErrors.title }}</span>
        </div>

        <div class="create-request__row">
          <div class="field">
            <label class="field__label" for="quantity">Количество</label>
            <input
              id="quantity"
              v-model="formValues.quantity"
              type="number"
              min="1"
              step="1"
              class="field__control"
              :class="{ 'field__control--invalid': fieldErrors.quantity }"
            />
            <span v-if="fieldErrors.quantity" class="field__error">{{ fieldErrors.quantity }}</span>
          </div>

          <div class="field">
            <label class="field__label" for="amount">Сумма</label>
            <input
              id="amount"
              v-model="formValues.amount"
              type="number"
              min="0"
              step="0.01"
              class="field__control"
              :class="{ 'field__control--invalid': fieldErrors.amount }"
            />
            <span v-if="fieldErrors.amount" class="field__error">{{ fieldErrors.amount }}</span>
          </div>
        </div>

        <div class="field">
          <label class="field__label" for="comment">Комментарий (необязательно)</label>
          <textarea
            id="comment"
            v-model="formValues.comment"
            class="field__control"
            :class="{ 'field__control--invalid': fieldErrors.comment }"
          ></textarea>
          <span v-if="fieldErrors.comment" class="field__error">{{ fieldErrors.comment }}</span>
        </div>

        <button type="submit" class="button button--primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Отправка…' : 'Создать заявку' }}
        </button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.create-request__card {
  max-width: 560px;
}

.create-request__row {
  display: flex;
  gap: 16px;
}

.create-request__row .field {
  flex: 1;
}

.form-success {
  margin: 0 0 16px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #ecfdf5;
  color: var(--color-success);
  font-size: 14px;
}

@media (max-width: 520px) {
  .create-request__row {
    flex-direction: column;
    gap: 0;
  }
}
</style>
