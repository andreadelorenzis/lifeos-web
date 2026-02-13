<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-vue-next';
import { onBeforeUnmount } from 'vue';

type TimerMode = 'work' | 'break';

interface TimerConfig {
  workDuration: number;
  breakDuration: number;
}

const config = ref<TimerConfig>({
  workDuration: 25,
  breakDuration: 5,
});

const mode = ref<TimerMode>('work');
const isRunning = ref(false);
const totalSeconds = ref(config.value.workDuration * 60);
const remainingSeconds = ref(totalSeconds.value);
const sessionsCompleted = ref(0);
const soundEnabled = ref(true);

let intervalId: number | null = null;

const minutes = computed(() => Math.floor(remainingSeconds.value / 60));
const seconds = computed(() => remainingSeconds.value % 60);
const progress = computed(() => {
  return ((totalSeconds.value - remainingSeconds.value) / totalSeconds.value) * 100;
});

const formattedTime = computed(() => {
  return `${String(minutes.value).padStart(2, '0')}:${String(seconds.value).padStart(2, '0')}`;
});

const isWorkMode = computed(() => mode.value === 'work');
const modeColor = computed(() => (isWorkMode.value ? '#3b82f6' : '#10b981'));
const modeLabel = computed(() => (isWorkMode.value ? 'Work Session' : 'Break Time'));

const playSound = () => {
  if (!soundEnabled.value) return;
  
  // Create a simple beep sound using Web Audio API
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = isWorkMode.value ? 800 : 600;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
};

const switchMode = () => {
  mode.value = mode.value === 'work' ? 'break' : 'work';
  totalSeconds.value = (mode.value === 'work' ? config.value.workDuration : config.value.breakDuration) * 60;
  remainingSeconds.value = totalSeconds.value;
  // isRunning.value = false;
  // if (intervalId) clearInterval(intervalId);
};

const toggleTimer = () => {
  if (isRunning.value) {
    isRunning.value = false;
    if (intervalId) clearInterval(intervalId);
  } else {
    isRunning.value = true;
    intervalId = window.setInterval(() => {
      if (remainingSeconds.value > 0) {
        remainingSeconds.value--;
      } else {
        // Timer finished
        playSound();
        if (mode.value === 'work') {
          sessionsCompleted.value++;
          switchMode();
        } else {
          switchMode();
        }
        //isRunning.value = false;
        // if (intervalId) clearInterval(intervalId);
      }
    }, 1000);
  }
};

const resetTimer = () => {
  isRunning.value = false;
  if (intervalId) clearInterval(intervalId);
  mode.value = 'work';
  totalSeconds.value = config.value.workDuration * 60;
  remainingSeconds.value = totalSeconds.value;
  sessionsCompleted.value = 0;
};

const updateWorkDuration = (value: number) => {
  config.value.workDuration = value;
  if (mode.value === 'work' && !isRunning.value) {
    totalSeconds.value = value * 60;
    remainingSeconds.value = totalSeconds.value;
  }
};

const updateBreakDuration = (value: number) => {
  config.value.breakDuration = value;
  if (mode.value === 'break' && !isRunning.value) {
    totalSeconds.value = value * 60;
    remainingSeconds.value = totalSeconds.value;
  }
};

onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId);
});

</script>

<template>
  <div class="w-full max-w-md mx-auto p-6">
    <!-- Title -->
    <h2 class="text-2xl font-bold text-center mb-8" style="color: var(--color-neutral-900);">
      Pomodoro Timer
    </h2>

    <!-- Timer Circle -->
    <div class="relative w-64 h-64 mx-auto mb-8">
      <!-- Background Circle -->
      <svg class="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 200 200">
        <!-- Background ring -->
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="var(--color-neutral-100)"
          stroke-width="8"
        />
        <!-- Progress ring -->
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          :stroke="modeColor"
          stroke-width="8"
          stroke-dasharray="565.48"
          :stroke-dashoffset="565.48 * (1 - progress / 100)"
          class="transition-all duration-300"
        />
      </svg>

      <!-- Center Content -->
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <div class="text-6xl font-bold font-mono" style="color: var(--color-neutral-900);">
          {{ formattedTime }}
        </div>
        <div class="text-sm font-medium mt-2" :style="{ color: modeColor }">
          {{ modeLabel }}
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex gap-4 justify-center mb-8">
      <button
        @click="toggleTimer"
        class="p-3 rounded-full transition-transform hover:scale-110"
        :style="{ backgroundColor: modeColor, color: 'white' }"
      >
        <Play v-if="!isRunning" :size="24" />
        <Pause v-else :size="24" />
      </button>

      <button
        @click="resetTimer"
        class="p-3 rounded-full transition-transform hover:scale-110"
        style="background-color: var(--color-neutral-100); color: var(--color-neutral-900);"
      >
        <RotateCcw :size="24" />
      </button>

      <button
        @click="() => (soundEnabled = !soundEnabled)"
        class="p-3 rounded-full transition-transform hover:scale-110"
        style="background-color: var(--color-neutral-100); color: var(--color-neutral-900);"
      >
        <Volume2 v-if="soundEnabled" :size="24" />
        <VolumeX v-else :size="24" />
      </button>
    </div>

    <!-- Sessions Completed -->
    <div class="text-center mb-8">
      <p class="text-sm" style="color: var(--color-neutral-500);">Sessions Completed</p>
      <p class="text-3xl font-bold" style="color: var(--color-neutral-900);">{{ sessionsCompleted }}</p>
    </div>

    <!-- Settings -->
    <div class="space-y-4 bg-surface-bg rounded-lg p-6 border border-surface-border">
      <div>
        <label class="block text-sm font-medium mb-2" style="color: var(--color-neutral-900);">
          Work Duration: {{ config.workDuration }} min
        </label>
        <input
          type="range"
          min="1"
          max="60"
          :value="config.workDuration"
          @input="(e) => updateWorkDuration(Number((e.target as HTMLInputElement).value))"
          :disabled="isRunning"
          class="w-full cursor-pointer"
          :style="{ opacity: isRunning ? 0.5 : 1 }"
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-2" style="color: var(--color-neutral-900);">
          Break Duration: {{ config.breakDuration }} min
        </label>
        <input
          type="range"
          min="1"
          max="30"
          :value="config.breakDuration"
          @input="(e) => updateBreakDuration(Number((e.target as HTMLInputElement).value))"
          :disabled="isRunning"
          class="w-full cursor-pointer"
          :style="{ opacity: isRunning ? 0.5 : 1 }"
        />
      </div>
    </div>

    <!-- Mode Switch Button -->
    <button
      @click="switchMode"
      :disabled="isRunning"
      class="w-full mt-6 py-2 rounded-lg font-medium transition-colors"
      :style="{
        backgroundColor: isRunning ? 'var(--color-neutral-100)' : 'var(--color-surface-border)',
        color: 'var(--color-neutral-900)',
        opacity: isRunning ? 0.5 : 1,
      }"
    >
      Skip to {{ mode === 'work' ? 'Break' : 'Work' }}
    </button>
  </div>
</template>

<style scoped>
input[type='range'] {
  accent-color: var(--color-primary-bg);
}

input[type='range']:disabled {
  cursor: not-allowed;
}
</style>
