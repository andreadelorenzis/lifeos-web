<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: number[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[]): void;
}>();

const daysOfWeek = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' }
];

const selectedDays = ref<number[]>([...props.modelValue]);

watch(() => props.modelValue, (newVal) => {
    selectedDays.value = [...newVal];
}, { deep: true });

const toggleDay = (dayValue: number) => {
  const index = selectedDays.value.indexOf(dayValue);
  if (index > -1) {
    selectedDays.value.splice(index, 1);
  } else {
    selectedDays.value.push(dayValue);
  }
  emit('update:modelValue', [...selectedDays.value]);
};
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="day in daysOfWeek"
      :key="day.value"
      type="button"
      @click="toggleDay(day.value)"
      :class="[
        'px-3 py-1.5 rounded-md text-sm font-medium transition-colors border',
        selectedDays.includes(day.value)
          ? 'bg-primary-bg text-primary-text border-primary-bg'
          : 'bg-surface-bg text-neutral-700 border-surface-border hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:text-neutral-300'
      ]"
    >
      {{ day.label }}
    </button>
  </div>
</template>
