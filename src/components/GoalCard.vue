<script setup lang="ts">
import { computed } from 'vue';
import { Star, Trash2, Edit2 } from 'lucide-vue-next';
import { type Goal as GoalType } from '@/services/GoalService';

interface Props {
  goal: GoalType;
}

interface Emits {
  edit: [];
  delete: [];
}


const props = defineProps<Props>();
const emit = defineEmits<EmitEvents>();

const progressPercentage = computed(() => {
  const value = Math.round((props.goal.currentProgress / props.goal.targetQuantity) * 100);
  console.log('Calculating progress percentage:', {
    currentProgress: props.goal.currentProgress,
    targetQty: props.goal.targetQuantity,
    calculatedValue: value,
  });
  return value;
});

const isOverdue = computed(() => {
  return new Date() > new Date(props.goal.deadline) && props.goal.statusName.toLowerCase() === 'active';
});

const daysRemaining = computed(() => {
  const now = new Date();
  const deadline = new Date(props.goal.deadline);
  const diff = deadline.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 3600 * 24));
});

const statusColors: Record<string, string> = {
  Active: 'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
  Failed: 'bg-red-100 text-red-700',
  Paused: 'bg-yellow-100 text-yellow-700',
};

const renderStars = (count: number) => {
  return Array.from({ length: 5 }, (_, i) => i < count);
};

interface EmitEvents {
  edit: [];
  delete: [];
}

const formatDate = (dateStr: string | Date) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString();
}

</script>

<template>
  <div class="bg-surface-bg border border-surface-border rounded-lg p-4 space-y-4 hover:shadow-md transition-shadow">
    <!-- Header: Title, Status, and Actions -->
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-neutral-900">{{ goal.name }}</h3>
        <p v-if="goal.description" class="text-sm text-neutral-500 mt-1">{{ goal.description }}</p>
      </div>
      <div class="flex gap-2 ml-4">
        <button
          @click="emit('edit')"
          class="p-2 text-neutral-500 hover:text-blue-500 transition-colors"
          title="Edit goal"
        >
          <Edit2 :size="18" />
        </button>
        <button
          @click="emit('delete')"
          class="p-2 text-neutral-500 hover:text-red-500 transition-colors"
          title="Delete goal"
        >
          <Trash2 :size="18" />
        </button>
      </div>
    </div>

    <!-- Status Badge -->
    <div class="flex gap-2 flex-wrap">
      <span :class="['px-3 py-1 rounded-full text-xs font-semibold', statusColors[goal.statusName.charAt(0).toUpperCase() + goal.statusName.slice(1)] || 'bg-gray-100 text-gray-700']">
        {{ goal.statusName.charAt(0).toUpperCase() + goal.statusName.slice(1) }}
      </span>
      <span v-if="isOverdue" class="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
        Overdue
      </span>
    </div>

    <!-- Difficulty and Importance with Stars -->
    <div class="grid grid-cols-2 gap-4 text-sm">
      <div>
        <p class="text-neutral-500 mb-1">Difficulty</p>
        <div class="flex gap-1">
          <Star
            v-for="filled in renderStars(goal.difficulty)"
            :key="`diff-${filled}`"
            :size="16"
            :class="filled ? 'fill-orange-500 text-orange-500' : 'text-neutral-300'"
          />
        </div>
      </div>
      <div>
        <p class="text-neutral-500 mb-1">Importance</p>
        <div class="flex gap-1">
          <Star
            v-for="filled in renderStars(goal.importance)"
            :key="`imp-${filled}`"
            :size="16"
            :class="filled ? 'fill-red-500 text-red-500' : 'text-neutral-300'"
          />
        </div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="space-y-2">
      <div class="flex justify-between text-sm">
        <span class="text-neutral-500">
          Progress: {{ goal.currentProgress }} / {{ goal.targetQuantity }} {{ goal.unitCode }}
        </span>
        <span class="font-semibold text-neutral-900">{{ progressPercentage }}%</span>
      </div>
      <div class="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
        <div
          :style="{ width: `${progressPercentage}%` }"
          class="bg-blue-500 h-full transition-all duration-300"
        />
      </div>
    </div>

    <!-- Deadline and Days Remaining -->
    <div class="grid grid-cols-2 gap-4 text-sm">
      <div>
        <p class="text-neutral-500 mb-1">Deadline</p>
        <p class="font-medium text-neutral-900">{{ formatDate(goal.deadline) }}</p>
      </div>
      <div>
        <p class="text-neutral-500 mb-1">Time Remaining</p>
        <p :class="daysRemaining < 0 ? 'text-red-600' : 'text-green-600'" class="font-medium">
          {{ Math.abs(daysRemaining) }} days {{ daysRemaining < 0 ? 'overdue' : 'left' }}
        </p>
      </div>
    </div>

    <!-- Reason, Reward, Punishment -->
    <div class="space-y-3 pt-2 border-t border-neutral-200">
      <div v-if="goal.reason">
        <p class="text-xs text-neutral-500 uppercase font-semibold">Why</p>
        <p class="text-sm text-neutral-700 mt-1">{{ goal.reason }}</p>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div v-if="goal.reward">
          <p class="text-xs text-neutral-500 uppercase font-semibold">Reward</p>
          <p class="text-sm text-green-700 mt-1">{{ goal.reward }}</p>
        </div>
        <div v-if="goal.punishment">
          <p class="text-xs text-neutral-500 uppercase font-semibold">Punishment</p>
          <p class="text-sm text-red-700 mt-1">{{ goal.punishment }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
