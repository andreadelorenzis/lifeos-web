<script setup lang="ts">
import { ref, computed } from 'vue';
import Modal from './Modal.vue';
import GoalCard from './GoalCard.vue';
import { Plus, Goal } from 'lucide-vue-next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import GoalService, { type Goal as GoalType } from '@/services/GoalService';

const isModalOpen = ref(false);
const isEditMode = ref(false);
const editingId = ref<number | null>(null);

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
const goalStatus = ref<'Active' | 'Completed' | 'Failed' | 'Paused'>('Active');

const statuses: Array<'Active' | 'Completed' | 'Failed' | 'Paused'> = ['Active', 'Completed', 'Failed', 'Paused'];

const queryClient = useQueryClient();

// Fetch goals using TanStack Query
const { isPending, isError, data, error } = useQuery({
  queryKey: ['goals'],
  queryFn: async () => {
    const { data } = await GoalService.getGoals();
    return data;
  }
});

// Computed property for goals array
const goals = computed<GoalType[]>(() => data.value || []);

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
  goalStatus.value = 'Active';
};

const openModal = (goal?: GoalType) => {
  if (goal) {
    isEditMode.value = true;
    editingId.value = goal.id;
    goalName.value = goal.name;
    goalDescription.value = goal.description;
    goalUnit.value = goal.unitOfMeasure;
    goalTarget.value = goal.targetQuantity;
    goalProgress.value = goal.currentProgress;
    goalDeadline.value = (goal.deadline instanceof Date ? goal.deadline.toISOString().split('T')[0] : String(goal.deadline).split('T')[0]) || '';
    goalDifficulty.value = goal.difficulty;
    goalImportance.value = goal.importance;
    goalReason.value = goal.reason;
    goalReward.value = goal.reward;
    goalPunishment.value = goal.punishment;
    goalStatus.value = goal.status;
  } else {
    isEditMode.value = false;
    editingId.value = null;
    resetForm();
  }
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  resetForm();
};

const createGoalMutation = useMutation({
  mutationFn: (newGoal: Omit<GoalType, 'id' | 'createdAt'>) => GoalService.createGoal(newGoal),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    closeModal();
  }
});

const updateGoalMutation = useMutation({
  mutationFn: ({ id, goal }: { id: number; goal: Partial<GoalType> }) => GoalService.updateGoal(id, goal),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    closeModal();
  }
});

const deleteGoalMutation = useMutation({
  mutationFn: (id: number) => GoalService.deleteGoal(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['goals'] });
  }
});

const saveGoal = () => {
  if (!goalName.value.trim() || !goalUnit.value.trim() || !goalDeadline.value) {
    return;
  }

  const goalData = {
    name: goalName.value,
    description: goalDescription.value,
    unitOfMeasure: goalUnit.value,
    targetQuantity: goalTarget.value,
    currentProgress: goalProgress.value,
    deadline: new Date(goalDeadline.value),
    difficulty: goalDifficulty.value,
    importance: goalImportance.value,
    reason: goalReason.value,
    reward: goalReward.value,
    punishment: goalPunishment.value,
    status: goalStatus.value
  };

  if (isEditMode.value && editingId.value) {
    updateGoalMutation.mutate({ id: editingId.value, goal: goalData });
  } else {
    createGoalMutation.mutate({ ...goalData, createdAt: new Date() } as Omit<GoalType, 'id'>);
  }
};

const deleteGoal = (id: number) => {
  if (confirm('Are you sure you want to delete this goal?')) {
    deleteGoalMutation.mutate(id);
  }
};

console.log('deleteGoalMutation.isError:', deleteGoalMutation.isError.value);
</script>


<template>
  <div class="space-y-4 p-4">
    <!-- Header with Toggle Button -->
    <h1 class="text-neutral-900">My Goals</h1>
    
    <!-- Delete Error Alert -->
    
    <div v-if="deleteGoalMutation.isError.value" class="p-3 bg-red-50 border border-red-200 rounded-md">
      <p class="text-red-700 text-sm font-medium">
        {{ (deleteGoalMutation.error as any)?.response?.data?.message || (deleteGoalMutation.error as any)?.message || 'Failed to delete goal' }}
      </p>
    </div>

    <button
    @click="openModal()"
    class="flex ml-auto items-center gap-2 px-4 py-2 bg-primary-bg text-primary-text font-medium rounded-md hover:bg-primary-bg-hover transition-colors"
    v-if="goals.length !== 0"
    >
    <Plus :size="18" />
    New Goal
    </button>

    <!-- Modal with Goal Form -->
    <Modal :is-open="isModalOpen" :title="isEditMode ? 'Edit Goal' : 'Create New Goal'" @close="closeModal">
      <div class="space-y-4 max-h-[70vh] overflow-y-auto">
        <!-- Error Message -->
        <div v-if="createGoalMutation.isError.value || updateGoalMutation.isError.value" class="p-3 bg-red-50 border border-red-200 rounded-md">
          <p class="text-red-700 text-sm font-medium">
            {{ ((createGoalMutation.error || updateGoalMutation.error) as any)?.response?.data?.message || ((createGoalMutation.error || updateGoalMutation.error) as any)?.message || 'An error occurred' }}
          </p>
        </div>

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
            <input
              id="goalUnit"
              v-model="goalUnit"
              type="text"
              placeholder="e.g., pages, hours, $ "
              class="w-full px-3 py-2 border border-surface-border bg-surface-bg text-neutral-900 placeholder-neutral-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg"
            />
          </div>
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
            v-model="goalStatus"
            class="w-full px-3 py-2 border border-surface-border bg-surface-bg text-neutral-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg"
          >
            <option v-for="status in statuses" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
        </div>

        <!-- Submit Button -->
        <button
          @click="saveGoal"
          :disabled="createGoalMutation.isPending.value || updateGoalMutation.isPending.value"
          class="w-full px-4 py-2 bg-primary-bg text-primary-text font-medium rounded-md hover:bg-primary-bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ createGoalMutation.isPending.value || updateGoalMutation.isPending.value ? 'Saving...' : (isEditMode ? 'Update Goal' : 'Create Goal') }}
        </button>
      </div>
    </Modal>

    <!-- Goals Grid -->
    <div v-if="isPending" class="text-center py-12">
      <p class="text-neutral-500">Loading goals...</p>
    </div>

    <div v-else-if="isError" class="text-center py-12">
      <p class="text-red-500">Error loading goals: {{ error?.message }}</p>
    </div>

    <div v-else-if="goals.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <GoalCard
        v-for="goal in goals"
        :key="goal.id"
        :goal="goal"
        @edit="openModal(goal)"
        @delete="deleteGoal(goal.id)"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="space-y-4">
        <div class="text-4xl"><Goal :size="48" class="mx-auto text-neutral-300" /></div>
        <p class="text-neutral-500 text-lg">No goals yet. Create your first goal to get started!</p>
        <button
          @click="openModal()"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary-bg text-primary-text font-medium rounded-md hover:bg-primary-bg-hover transition-colors"
        >
          <Plus :size="18" />
          Create Goal
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
h1 {
  text-align: center;
  margin-bottom: 20px;
  font-size: var(--font-size-xl);
  font-weight: 600;
}
</style>