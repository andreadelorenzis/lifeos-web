<script setup lang="ts">
import { computed } from 'vue';
import { Edit2, Minus, Plus } from 'lucide-vue-next';
import { type Task } from '@/services/TaskService';

interface Props {
  task: Task;
  isPending: boolean;
}

interface EmitEvents {
  toggle: [];
  edit: [];
  delete: [];
  updateProgress: [delta: number];
}

const emit = defineEmits<EmitEvents>();
const props = defineProps<Props>();

const formatFrequency = (name: string) => {
  if (!name) return '';
  // Capitalize first letter
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const isCompleted = (task: Task) => !!task.completedAt;

const progressPercentage = computed(() => {
  if (!props.task.quantity || !props.task.progress || props.task.quantity === 0) return 0;
  const value = Math.round((props.task.progress / props.task.quantity) * 100);
  return value;
});

const formatProgress = (seconds: number | undefined) => {
    if (seconds === undefined) return '0';
    if (props.task.goalUnitCode === 't') {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        let parts = [];
        if (h > 0) parts.push(`${h}h`);
        if (m > 0 || (h > 0 && s > 0)) parts.push(`${m}m`);
        if (s > 0 || (h === 0 && m === 0)) parts.push(`${s}s`);
        return parts.join(' ');
    }
    return String(seconds);
};

const handleUpdateProgress = (isIncrease: boolean) => {
  const amount = props.task.goalUnitCode === 't' ? 60 : 1;
  emit('updateProgress', isIncrease ? amount : -amount);
};
</script>

<template>
  <div 
    class="task-card bg-surface-bg border border-surface-border rounded-lg p-4 transition-all duration-200"
    :class="{ 'opacity-60': isCompleted(task) }"
  >
    <div class="flex items-start gap-4">
      <!-- Checkbox -->
      <div class="pt-1">
        <div class="relative flex items-center justify-center w-5 h-5">
          <input
            type="checkbox"
            :checked="isCompleted(task)"
            @change="emit('toggle')"
            class="peer appearance-none w-5 h-5 cursor-pointer rounded border-2 border-neutral-300 bg-checkbox-unchecked checked:bg-checkbox-checked checked:border-checkbox-checked transition-all focus:outline-none focus:ring-2 focus:ring-checkbox-checked focus:ring-offset-1 dark:focus:ring-offset-surface-bg m-0"
            :disabled="isPending"
          />
          <svg 
            class="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="3" 
            stroke-linecap="round" 
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1">
        <div class="flex justify-between items-start">
          <h4 
            class="font-semibold text-neutral-900 leading-tight"
            :class="{ 'line-through text-neutral-500': isCompleted(task) }"
          >
            {{ task.name }}
          </h4>
          
          <div class="flex gap-1 ml-2">
            <button
              @click="emit('edit')"
              class="text-neutral-400 hover:text-blue-500 transition-colors"
              :disabled="isPending"
              title="Edit task"
            >
              <Edit2 :size="16" />
            </button>
            <button
              @click="emit('delete')"
              class="text-neutral-400 hover:text-red-500 transition-colors"
              :disabled="isPending"
              title="Delete task"
            >
              <span class="sr-only">Delete</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>

        <p v-if="task.description" class="text-sm text-neutral-500 mt-1">
          {{ task.description }}
        </p>

        <!-- Meta info -->
        <div class="flex flex-wrap items-center gap-2 mt-3 text-xs">
          <!-- Frequency Badge -->
          <span 
            class="px-2 py-0.5 rounded-full font-medium dark:bg-badge-bg dark:text-badge-text"
            :class="task.frequencyName === 'one-time' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'"
          >
            {{ formatFrequency(task.frequencyName) }}
          </span>

          <!-- Goal Badge -->
          <span v-if="(task as any).goalName" class="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 dark:bg-badge-bg dark:text-badge-text font-medium">
            Goal: {{ (task as any).goalName }}
          </span>

          <!-- Quantity/Unit Badge -->
          <!-- <span v-if="task.quantity || (task as any).goalUnit" class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
            {{ task.quantity || 0 }} {{ (task as any).goalUnit || '' }}
          </span> -->
          

          <span class="text-neutral-400 ml-auto">
            {{ new Date(task.createdAt).toLocaleDateString() }}
          </span>
        </div>


        <!-- Progress Bar -->
        <div v-if="task.progress !== undefined && task.quantity" class="mt-3 space-y-1">
          <div class="flex justify-between items-center text-xs">
            <span class="text-neutral-500 flex items-center">
              Progress: 
              <span class="inline-flex items-center gap-2 ml-2 bg-neutral-100 dark:bg-neutral-800 rounded-md px-1 py-0.5">
                <button @click="handleUpdateProgress(false)" class="p-0.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors" :disabled="isPending">
                  <Minus :size="14" />
                </button>
                <span class="font-medium text-neutral-700 dark:text-neutral-300 min-w-[3rem] text-center">
                  {{ formatProgress(task.progress) }} / {{ formatProgress(task.quantity) }}
                  <span v-if="task.goalUnitCode !== 't'">{{ task.goalUnitName?.toLowerCase() }}</span>
                </span>
                <button @click="handleUpdateProgress(true)" class="p-0.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors" :disabled="isPending">
                  <Plus :size="14" />
                </button>
              </span>
            </span>
            <span class="font-semibold text-neutral-900">{{ progressPercentage }}%</span>
          </div>
          <div class="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
            <div
              :style="{ width: `${progressPercentage}%` }"
              class="bg-blue-500 h-full transition-all duration-300"
            />
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

