<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import UnitService from '@/services/UnitService';
import type { Goal } from '@/services/GoalService';
import DurationPicker from './DurationPicker.vue';

const props = defineProps<{
  initialGoal?: Goal | null;
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', payload: any): void;
  (e: 'cancel'): void;
}>();

// Form fields
const goalName = ref('');
const goalDescription = ref('');
const goalUnit = ref('');
const goalTarget = ref(0);
const goalProgress = ref(0);
const goalDeadline = ref('');
const goalDifficulty = ref(3);
const goalImportance = ref(3);
const goalReason = ref('');
const goalReward = ref('');
const goalPunishment = ref('');
const goalStatusId = ref<number | null>(null);

import GoalStatusService from '@/services/GoalStatusService';

// Fetch units
const { data: unitsData } = useQuery({
  queryKey: ['units'],
  queryFn: async () => {
    const { data } = await UnitService.getUnits();
    return data;
  }
});

const units = computed(() => unitsData.value || []);

// Fetch statuses
const { data: statusesData } = useQuery({
  queryKey: ['goal-statuses'],
  queryFn: async () => {
    const { data } = await GoalStatusService.getGoalStatuses();
    return data;
  }
});

const statuses = computed(() => statusesData.value || []);

const resetForm = () => {
  goalName.value = '';
  goalDescription.value = '';
  goalUnit.value = '';
  goalTarget.value = 0;
  goalProgress.value = 0;
  goalDeadline.value = '';
  goalDifficulty.value = 3;
  goalImportance.value = 3;
  goalReason.value = '';
  goalReward.value = '';
  goalPunishment.value = '';
  if (statuses.value && statuses.value.length > 0) {
    const activeStatus = statuses.value.find(s => s.name.toLowerCase() === 'active');
    goalStatusId.value = activeStatus ? activeStatus.id : (statuses.value[0]?.id ?? null);
  } else {
    goalStatusId.value = null;
  }
};

// Watch for initialGoal changes to populate form
watch(() => props.initialGoal, (newGoal) => {
  if (newGoal) {
    goalName.value = newGoal.name;
    goalDescription.value = newGoal.description;
    goalUnit.value = newGoal.unitCode || '';
    goalTarget.value = newGoal.targetQuantity;
    goalProgress.value = newGoal.currentProgress;
    
    goalDeadline.value = (newGoal.deadline instanceof Date ? newGoal.deadline.toISOString().split('T')[0] : String(newGoal.deadline).split('T')[0]) || '';
    goalDifficulty.value = newGoal.difficulty;
    goalImportance.value = newGoal.importance;
    goalReason.value = newGoal.reason;
    goalReward.value = newGoal.reward;
    goalPunishment.value = newGoal.punishment;
    goalStatusId.value = newGoal.statusId;
  } else {
    resetForm();
  }
}, { immediate: true });

const submitForm = () => {
  if (!goalName.value.trim() || !goalUnit.value.trim() || !goalDeadline.value) {
    return;
  }

  let finalTarget = goalTarget.value;
  let finalProgress = goalProgress.value;

  const goalData = {
    name: goalName.value,
    description: goalDescription.value,
    unitCode: goalUnit.value,
    targetQuantity: finalTarget,
    currentProgress: finalProgress,
    deadline: new Date(goalDeadline.value),
    difficulty: goalDifficulty.value,
    importance: goalImportance.value,
    reason: goalReason.value,
    reward: goalReward.value,
    punishment: goalPunishment.value,
    statusId: goalStatusId.value
  };

  emit('submit', goalData);
};
</script>

<template>
  <div class="space-y-4 max-h-[70vh] overflow-y-auto">
    <!-- Name -->
    <div>
      <label for="goalName" class="block text-sm font-medium text-neutral-900 mb-1">
        Goal Name *
      </label>
      <input
        id="goalName"
        v-model="goalName"
        type="text"
        placeholder="e.g., Complete Project X"
        class="w-full px-3 py-2 border border-surface-border bg-surface-bg text-neutral-900 placeholder-neutral-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg"
      />
    </div>

    <!-- Description -->
    <div>
      <label for="goalDescription" class="block text-sm font-medium text-neutral-900 mb-1">
        Description
      </label>
      <textarea
        id="goalDescription"
        v-model="goalDescription"
        placeholder="Add details about your goal..."
        rows="2"
        class="w-full px-3 py-2 border border-surface-border bg-surface-bg text-neutral-900 placeholder-neutral-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg"
      />
    </div>

    <!-- Unit of Measure and Target Qty -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="goalUnit" class="block text-sm font-medium text-neutral-900 mb-1">
          Unit of Measure *
        </label>
        <select
          id="goalUnit"
          v-model="goalUnit"
          class="w-full px-3 py-2 border border-surface-border bg-surface-bg text-neutral-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg"
        >
          <option value="" disabled>Select a unit</option>
          <option v-for="unit in units" :key="unit.code" :value="unit.code">
            {{ unit.name }}
          </option>
        </select>
      </div>
      
      <!-- General Target/Progress -->
      <div v-if="goalUnit !== 't'" class="space-y-4">
        <div>
          <label for="goalTarget" class="block text-sm font-medium text-neutral-900 mb-1">
            Target Quantity *
          </label>
          <input
            id="goalTarget"
            v-model.number="goalTarget"
            type="number"
            min="0"
            placeholder="0"
            class="w-full px-3 py-2 border border-surface-border bg-surface-bg text-neutral-900 placeholder-neutral-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg"
          />
        </div>

        <!-- Current Progress -->
        <div>
          <label for="goalProgress" class="block text-sm font-medium text-neutral-900 mb-1">
            Current Progress
          </label>
          <input
            id="goalProgress"
            v-model.number="goalProgress"
            type="number"
            min="0"
            :max="goalTarget"
            placeholder="0"
            class="w-full px-3 py-2 border border-surface-border bg-surface-bg text-neutral-900 placeholder-neutral-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg"
          />
          <p class="text-xs text-neutral-500 mt-1">
            {{ Math.round((goalProgress / goalTarget) * 100) || 0 }}% progress
          </p>
        </div>
      </div>
    </div>

    <!-- Time-based Target/Progress -->
    <div v-if="goalUnit === 't'" class="grid grid-cols-1 gap-4 border-t border-surface-border pt-4">
      <!-- Target -->
      <div>
        <label class="block text-sm font-medium text-neutral-900 mb-2">Target Time</label>
        <DurationPicker v-model="goalTarget" />
      </div>

      <!-- Progress -->
      <div>
        <label class="block text-sm font-medium text-neutral-900 mb-2">Current Progress</label>
        <DurationPicker v-model="goalProgress" />
      </div>
    </div>

    <!-- Deadline -->
    <div>
      <label for="goalDeadline" class="block text-sm font-medium text-neutral-900 mb-1">
        Deadline *
      </label>
      <input
        id="goalDeadline"
        v-model="goalDeadline"
        type="date"
        class="w-full px-3 py-2 border border-surface-border bg-surface-bg text-neutral-900 placeholder-neutral-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg"
      />
    </div>

    <!-- Difficulty and Importance -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="goalDifficulty" class="block text-sm font-medium text-neutral-900 mb-1">
          Difficulty (1-5)
        </label>
        <input
          id="goalDifficulty"
          v-model.number="goalDifficulty"
          type="range"
          min="1"
          max="5"
          class="w-full"
        />
        <p class="text-xs text-neutral-500 mt-1">Level: {{ goalDifficulty }}</p>
      </div>
      <div>
        <label for="goalImportance" class="block text-sm font-medium text-neutral-900 mb-1">
          Importance (1-5)
        </label>
        <input
          id="goalImportance"
          v-model.number="goalImportance"
          type="range"
          min="1"
          max="5"
          class="w-full"
        />
        <p class="text-xs text-neutral-500 mt-1">Level: {{ goalImportance }}</p>
      </div>
    </div>

    <!-- Reason (Why) -->
    <div>
      <label for="goalReason" class="block text-sm font-medium text-neutral-900 mb-1">
        Reason (Why?)
      </label>
      <textarea
        id="goalReason"
        v-model="goalReason"
        placeholder="Why is this goal important to you?"
        rows="2"
        class="w-full px-3 py-2 border border-surface-border bg-surface-bg text-neutral-900 placeholder-neutral-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg"
      />
    </div>

    <!-- Reward -->
    <div>
      <label for="goalReward" class="block text-sm font-medium text-neutral-900 mb-1">
        Reward (Celebration)
      </label>
      <input
        id="goalReward"
        v-model="goalReward"
        type="text"
        placeholder="What will you reward yourself with?"
        class="w-full px-3 py-2 border border-surface-border bg-surface-bg text-neutral-900 placeholder-neutral-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg"
      />
    </div>

    <!-- Punishment -->
    <div>
      <label for="goalPunishment" class="block text-sm font-medium text-neutral-900 mb-1">
        Punishment (Consequences)
      </label>
      <input
        id="goalPunishment"
        v-model="goalPunishment"
        type="text"
        placeholder="What will be the consequence of not achieving?"
        class="w-full px-3 py-2 border border-surface-border bg-surface-bg text-neutral-900 placeholder-neutral-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg"
      />
    </div>

    <!-- Status -->
    <div>
      <label for="goalStatus" class="block text-sm font-medium text-neutral-900 mb-1">
        Status
      </label>
      <select
        id="goalStatus"
        v-model="goalStatusId"
        class="w-full px-3 py-2 border border-surface-border bg-surface-bg text-neutral-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg"
      >
        <option v-for="status in statuses" :key="status.id" :value="status.id">
          {{ status.name.charAt(0).toUpperCase() + status.name.slice(1) }}
        </option>
      </select>
    </div>

    <!-- Submit Button -->
    <div class="flex gap-3">
        <button
            v-if="initialGoal"
            @click="emit('cancel')"
            class="hidden"
        >
        <!-- hidden cancel button if handled by modal close, but good to have event -->
        </button>
        <button
          @click="submitForm"
          :disabled="isLoading"
          class="w-full px-4 py-2 bg-primary-bg text-primary-text font-medium rounded-md hover:bg-primary-bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoading ? 'Saving...' : (initialGoal ? 'Update Goal' : 'Create Goal') }}
        </button>
    </div>
  </div>
</template>
