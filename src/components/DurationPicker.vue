<script setup lang="ts">
import { ref, watch } from 'vue';
import { ChevronUp, ChevronDown } from 'lucide-vue-next';

const props = defineProps<{
  modelValue?: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
  (e: 'change', payload: { hours: number, minutes: number, seconds: number, formatted: string, totalSeconds: number }): void;
}>();

const hours = ref('00');
const minutes = ref('00');
const seconds = ref('00');

const formatTwoDigits = (val: number) => {
  return val.toString().padStart(2, '0');
};

watch(() => props.modelValue, (newVal) => {
  const val = newVal || 0;
  // Only update if the total seconds differ from our current state, to prevent overriding changes while typing
  const currentTotal = (parseInt(hours.value || '0') * 3600) + (parseInt(minutes.value || '0') * 60) + parseInt(seconds.value || '0');
  if (val !== currentTotal) {
    hours.value = formatTwoDigits(Math.floor(val / 3600));
    minutes.value = formatTwoDigits(Math.floor((val % 3600) / 60));
    seconds.value = formatTwoDigits(val % 60);
  }
}, { immediate: true });

const enforceLimits = () => {
  let h = parseInt(hours.value || '0');
  let m = parseInt(minutes.value || '0');
  let s = parseInt(seconds.value || '0');

  if (m > 59) m = 59;
  if (m < 0 || isNaN(m)) m = 0;
  if (s > 59) s = 59;
  if (s < 0 || isNaN(s)) s = 0;
  if (h < 0 || isNaN(h)) h = 0;
  
  hours.value = formatTwoDigits(h);
  minutes.value = formatTwoDigits(m);
  seconds.value = formatTwoDigits(s);
};

const emitChange = () => {
  enforceLimits();

  const h = parseInt(hours.value || '0');
  const m = parseInt(minutes.value || '0');
  const s = parseInt(seconds.value || '0');
  
  const totalSeconds = (h * 3600) + (m * 60) + s;
  
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || totalSeconds === 0) parts.push(`${s}s`);
  const formatted = parts.join(' ');

  emit('update:modelValue', totalSeconds);
  emit('change', {
    hours: h,
    minutes: m,
    seconds: s,
    formatted,
    totalSeconds
  });
};

const increment = (unit: 'hours' | 'minutes' | 'seconds') => {
  let h = parseInt(hours.value || '0');
  let m = parseInt(minutes.value || '0');
  let s = parseInt(seconds.value || '0');

  if (unit === 'hours') h++;
  if (unit === 'minutes' && m < 59) m++;
  if (unit === 'seconds' && s < 59) s++;
  
  hours.value = formatTwoDigits(h);
  minutes.value = formatTwoDigits(m);
  seconds.value = formatTwoDigits(s);
  
  emitChange();
};

const decrement = (unit: 'hours' | 'minutes' | 'seconds') => {
  let h = parseInt(hours.value || '0');
  let m = parseInt(minutes.value || '0');
  let s = parseInt(seconds.value || '0');

  if (unit === 'hours' && h > 0) h--;
  if (unit === 'minutes' && m > 0) m--;
  if (unit === 'seconds' && s > 0) s--;
  
  hours.value = formatTwoDigits(h);
  minutes.value = formatTwoDigits(m);
  seconds.value = formatTwoDigits(s);
  
  emitChange();
};

const selectText = (event: Event) => {
  const target = event.target as HTMLInputElement;
  target.select();
};
</script>

<template>
  <div class="flex gap-4 justify-center items-center py-2">
    <div class="flex flex-col items-center gap-1">
      <button tabindex="-1" @click.prevent="increment('hours')" type="button" class="text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:text-neutral-100 focus:outline-none transition-colors p-1 rounded-sm">
        <ChevronUp :size="20" />
      </button>
      <input 
        v-model="hours" 
        @blur="emitChange"
        @input="emitChange" 
        @click="selectText"
        type="text" 
        inputmode="numeric"
        pattern="[0-9]*"
        class="w-15 h-12 text-2xl font-semibold text-center bg-surface-bg border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-bg text-neutral-900 dark:text-neutral-100 duration-input shadow-sm cursor-default" 
      />
      <button tabindex="-1" @click.prevent="decrement('hours')" type="button" class="text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:text-neutral-100 focus:outline-none transition-colors p-1 rounded-sm">
        <ChevronDown :size="20" />
      </button>
    </div>
    <span class="text-2xl font-bold text-neutral-400">:</span>
    <div class="flex flex-col items-center gap-1">
      <button tabindex="-1" @click.prevent="increment('minutes')" type="button" class="text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:text-neutral-100 focus:outline-none transition-colors p-1 rounded-sm">
        <ChevronUp :size="20" />
      </button>
      <input 
        v-model="minutes" 
        @blur="emitChange"
        @input="emitChange" 
        @click="selectText"
        type="text" 
        inputmode="numeric"
        pattern="[0-9]*"
        class="w-15 h-12 text-2xl font-semibold text-center bg-surface-bg border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-bg text-neutral-900 dark:text-neutral-100 duration-input shadow-sm cursor-default" 
      />
      <button tabindex="-1" @click.prevent="decrement('minutes')" type="button" class="text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:text-neutral-100 focus:outline-none transition-colors p-1 rounded-sm">
        <ChevronDown :size="20" />
      </button>
    </div>
    <span class="text-2xl font-bold text-neutral-400">:</span>
    <div class="flex flex-col items-center gap-1">
      <button tabindex="-1" @click.prevent="increment('seconds')" type="button" class="text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:text-neutral-100 focus:outline-none transition-colors p-1 rounded-sm">
        <ChevronUp :size="20" />
      </button>
      <input 
        v-model="seconds" 
        @blur="emitChange"
        @input="emitChange" 
        @click="selectText"
        type="text" 
        inputmode="numeric"
        pattern="[0-9]*"
        class="w-15 h-12 text-2xl font-semibold text-center bg-surface-bg border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-bg text-neutral-900 dark:text-neutral-100 duration-input shadow-sm cursor-default" 
      />
      <button tabindex="-1" @click.prevent="decrement('seconds')" type="button" class="text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:text-neutral-100 focus:outline-none transition-colors p-1 rounded-sm">
        <ChevronDown :size="20" />
      </button>
    </div>
  </div>
</template>

<style scoped>

</style>
