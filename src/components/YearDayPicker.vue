<script setup lang="ts">
import { ref, watch, computed } from 'vue';

const props = defineProps<{
  modelValue: number[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[]): void;
}>();

// Simple UI for adding a day of the year: User selects Month and Day, we convert to day-of-year (1-366).
// We'll calculate day-of-year based on a leap year to allow choosing up to Feb 29 (day 60).
const months = [
  { value: 1, label: 'Jan', days: 31 },
  { value: 2, label: 'Feb', days: 29 }, // Leap year generic
  { value: 3, label: 'Mar', days: 31 },
  { value: 4, label: 'Apr', days: 30 },
  { value: 5, label: 'May', days: 31 },
  { value: 6, label: 'Jun', days: 30 },
  { value: 7, label: 'Jul', days: 31 },
  { value: 8, label: 'Aug', days: 31 },
  { value: 9, label: 'Sep', days: 30 },
  { value: 10, label: 'Oct', days: 31 },
  { value: 11, label: 'Nov', days: 30 },
  { value: 12, label: 'Dec', days: 31 }
];

const selectedDays = ref<number[]>([...props.modelValue]);

watch(() => props.modelValue, (newVal) => {
    selectedDays.value = [...newVal];
}, { deep: true });

const selectedMonth = ref(1);
const selectedDay = ref(1);

const availableDaysInMonth = computed(() => {
  const month = months.find(m => m.value === selectedMonth.value);
  return month ? month.days : 31;
});

// Calculate day of year
const getDayOfYear = (month: number, day: number) => {
  let days = 0;
  for (let i = 0; i < month - 1; i++) {
    const m = months[i];
    if (m) {
      days += m.days;
    }
  }
  return days + day;
};

// Calculate Date from day of year (using 2024 as reference for leap year support)
const getDateFromDayOfYear = (dayOfYear: number) => {
  const date = new Date(2024, 0); // Jan 1 2024
  date.setDate(dayOfYear);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const addDay = () => {
    const doy = getDayOfYear(selectedMonth.value, selectedDay.value);
    if (!selectedDays.value.includes(doy)) {
        selectedDays.value.push(doy);
        emit('update:modelValue', [...selectedDays.value]);
    }
};

const removeDay = (doy: number) => {
    const index = selectedDays.value.indexOf(doy);
    if (index > -1) {
        selectedDays.value.splice(index, 1);
        emit('update:modelValue', [...selectedDays.value]);
    }
};

</script>

<template>
  <div class="space-y-4">
    <div class="flex items-end gap-2">
      <div>
        <label class="block text-xs font-medium text-neutral-700 mb-1">Month</label>
        <select 
          v-model="selectedMonth" 
          @change="() => { if (selectedDay > availableDaysInMonth) selectedDay = availableDaysInMonth; }"
          class="px-2 py-1.5 border border-surface-border bg-surface-bg rounded-md text-sm focus:ring-2 focus:ring-primary-bg"
        >
          <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
      </div>
      <div>
        <label class="block text-xs font-medium text-neutral-700 mb-1">Day</label>
        <select 
          v-model="selectedDay"
          class="px-2 py-1.5 border border-surface-border bg-surface-bg rounded-md text-sm focus:ring-2 focus:ring-primary-bg"
        >
          <option v-for="d in availableDaysInMonth" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>
      <button 
        type="button" 
        @click="addDay"
        class="px-3 py-1.5 bg-primary-bg text-primary-text rounded-md text-sm hover:bg-primary-bg-hover transition-colors font-medium h-8"
      >
        Add Setup
      </button>
    </div>

    <!-- Selected Days List -->
    <div v-if="selectedDays.length > 0" class="flex flex-wrap gap-2 mt-3">
        <div 
            v-for="doy in selectedDays" 
            :key="doy"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-border/30 dark:bg-surface-border/10 border border-surface-border rounded-full text-sm"
        >
            <span>{{ getDateFromDayOfYear(doy) }}</span>
            <button 
                type="button"
                @click="removeDay(doy)" 
                class="text-neutral-500 hover:text-red-500 transition-colors bg-white dark:bg-neutral-800 rounded-full w-4 h-4 flex items-center justify-center font-bold pb-0.5 leading-none"
                aria-label="Remove"
            >
                &times;
            </button>
        </div>
    </div>
    <p v-else class="text-xs text-neutral-500 mt-2">No days selected.</p>
    <p class="text-xs text-neutral-500">
        Note: For non-leap years, Feb 29 (if selected) will trigger on Feb 28.
    </p>
  </div>
</template>
