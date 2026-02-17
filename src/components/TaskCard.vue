<script setup lang="ts">
import { type Task } from '@/services/TaskService';

const props = defineProps<{
  task: Task;
  isPending: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle', task: Task): void;
  (e: 'delete', id: number): void;
}>();

const formatFrequency = (name: string) => {
  if (!name) return '';
  // Capitalize first letter
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const isCompleted = (task: Task) => !!task.completedAt;
</script>

<template>
  <div 
    class="task-card bg-surface-bg border border-surface-border rounded-lg p-4 transition-all duration-200"
    :class="{ 'opacity-60': isCompleted(task) }"
  >
    <div class="flex items-start gap-4">
      <!-- Checkbox -->
      <div class="pt-1">
        <input
          type="checkbox"
          :checked="isCompleted(task)"
          @change="emit('toggle', task)"
          class="w-5 h-5 cursor-pointer accent-primary-bg rounded border-neutral-300 focus:ring-primary-bg"
          :disabled="isPending"
        />
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
          
          <button
            @click="emit('delete', task.id)"
            class="text-neutral-400 hover:text-red-500 transition-colors ml-2"
            :disabled="isPending"
          >
            <span class="sr-only">Delete</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </button>
        </div>

        <p v-if="task.description" class="text-sm text-neutral-500 mt-1">
          {{ task.description }}
        </p>

        <!-- Meta info -->
        <div class="flex flex-wrap items-center gap-2 mt-3 text-xs">
          <!-- Frequency Badge -->
          <span 
            class="px-2 py-0.5 rounded-full font-medium"
            :class="task.frequencyName === 'one-time' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'"
          >
            {{ formatFrequency(task.frequencyName) }}
          </span>

          <!-- Goal Badge -->
          <span v-if="(task as any).goalName" class="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 font-medium">
            Goal: {{ (task as any).goalName }}
          </span>

          <!-- Quantity/Unit Badge -->
          <span v-if="task.quantity || (task as any).goalUnit" class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
            {{ task.quantity || 0 }} {{ (task as any).goalUnit || '' }}
          </span>

          <span class="text-neutral-400 ml-auto">
            {{ new Date(task.createdAt).toLocaleDateString() }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
