<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: number[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[]): void;
}>();

const daysOfMonth = Array.from({ length: 31 }, (_, i) => i + 1);

const selectedDays = ref<number[]>([...props.modelValue]);

watch(() => props.modelValue, (newVal) => {
    selectedDays.value = [...newVal];
}, { deep: true });

const toggleDay = (day: number) => {
  const index = selectedDays.value.indexOf(day);
  if (index > -1) {
    selectedDays.value.splice(index, 1);
  } else {
    selectedDays.value.push(day);
  }
  emit('update:modelValue', [...selectedDays.value]);
};
</script>

<template>
  <div class="grid grid-cols-7 gap-1">
    <button
      v-for="day in daysOfMonth"
      :key="day"
      type="button"
      @click="toggleDay(day)"
      :class="[
        'w-8 h-8 flex items-center justify-center rounded-md text-sm transition-colors border',
        selectedDays.includes(day)
          ? 'bg-primary-bg text-primary-text border-primary-bg'
          : 'bg-surface-bg text-neutral-700 border-surface-border hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:text-neutral-300'
      ]"
    >
      {{ day }}
    </button>
  </div>
  <p class="text-xs text-neutral-500 mt-2">
    Note: If you select 31 and the month has fewer days, it will trigger on the last day of the month.
  </p>
</template>
