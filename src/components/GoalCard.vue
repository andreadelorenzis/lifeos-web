<script setup lang="ts">
import { computed } from 'vue';
import { Star, Trash2, Edit2, Split } from 'lucide-vue-next';
import { type Goal as GoalType } from '@/services/GoalService';

interface Props {
  goal: GoalType;
}

interface EmitEvents {
  edit: [];
  delete: [];
  decompose: [];
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

const idealProgressPercentage = computed(() => {
  if (props.goal.idealProgress === undefined || props.goal.idealProgress === null) return 0;
  const target = props.goal.targetQuantity;
  if (target === 0) return 0;
  return Math.min(100, Math.round((props.goal.idealProgress / target) * 100));
});

const formatIdealProgress = computed(() => {
  if (props.goal.idealProgress === undefined || props.goal.idealProgress === null) return '0';
  if (props.goal.unitCode === 't') {
    return formatTime(props.goal.idealProgress);
  }
  return `${props.goal.idealProgress} ${props.goal.unitCode}`;
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
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  paused: 'bg-yellow-100 text-yellow-700',
};

const cardBackgroundColors: Record<string, string> = {
  active: 'bg-surface-bg',
  completed: 'bg-green-100/50 dark:bg-green-900/10',
  failed: 'bg-red-100/50 dark:bg-red-900/10',
  paused: 'bg-yellow-50/50 dark:bg-yellow-50/50',
};

const renderStars = (count: number) => {
  return Array.from({ length: 5 }, (_, i) => i < count);
};

const formatDate = (dateStr: string | Date) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString();
}

const formatTime = (seconds: number) => {
  const totalSeconds = Math.round(seconds);
  if (totalSeconds === 0) return '0s';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  
  return parts.join(' ');
};

</script>

<template>
  <div :class="[
    'border border-surface-border rounded-lg p-4 space-y-4 hover:shadow-md transition-shadow',
    cardBackgroundColors[goal.statusName.toLowerCase()] || 'bg-surface-bg'
  ]">
    <!-- Header: Title, Status, and Actions -->
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-neutral-900">{{ goal.name }}</h3>
        <p v-if="goal.description" class="text-sm text-neutral-500 mt-1">{{ goal.description }}</p>
      </div>
      <div class="flex gap-2 ml-4">
        <button
          v-if="goal.statusName.toLowerCase() === 'active'"
          @click="emit('decompose')"
          class="p-2 text-neutral-500 hover:text-green-500 transition-colors"
          title="Decompose goal into tasks"
        >
          <Split :size="18" />
        </button>
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
      <span :class="['px-3 py-1 rounded-full text-xs font-semibold dark:bg-badge-bg dark:text-badge-text', statusColors[goal.statusName.toLowerCase()] || 'bg-gray-100 text-gray-700']">
        {{ goal.statusName.toLowerCase() }}
      </span>
      <span v-if="isOverdue" class="px-3 py-1 bg-red-100 text-red-700 dark:bg-badge-bg dark:text-badge-text rounded-full text-xs font-semibold">
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
          Progress: 
          <template v-if="goal.unitCode === 't'">
            {{ formatTime(goal.currentProgress) }} / {{ formatTime(goal.targetQuantity) }}
          </template>
          <template v-else>
            {{ goal.currentProgress }} / {{ goal.targetQuantity }} {{ goal.unitCode }}
          </template>
        </span>
        <span class="font-semibold text-neutral-900">{{ progressPercentage }}%</span>
      </div>
      <div 
        class="relative w-full bg-neutral-100 rounded-full h-2 overflow-hidden group"
        :title="`Ideal progress: ${formatIdealProgress}`"
      >
        <!-- Actual Progress (Solid, dynamically colored) -->
        <div
          :style="{ width: `${progressPercentage}%` }"
          class="absolute top-0 left-0 h-full duration-300"
          :class="progressPercentage >= idealProgressPercentage && idealProgressPercentage > 0 ? 'bg-green-500 z-10' : 'bg-blue-500 z-20'"
        />
        <!-- Ideal Progress (Striped, lighter blue) -->
        <div
          v-if="idealProgressPercentage > 0"
          :style="{ width: `${idealProgressPercentage}%` }"
          class="absolute top-0 left-0 h-full bg-blue-300 duration-300 hover:opacity-100"
          :class="progressPercentage >= idealProgressPercentage ? 'opacity-60 z-20' : 'opacity-60 z-10'"
          style="background-image: repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.5) 4px, rgba(255,255,255,0.5) 8px);"
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
