<script setup lang="ts">
import { ref, computed } from 'vue';
import Modal from './Modal.vue';
import GoalCard from './GoalCard.vue';
import GoalForm from './GoalForm.vue';
import { Plus, Goal } from 'lucide-vue-next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import GoalService, { type Goal as GoalType } from '@/services/GoalService';

const isModalOpen = ref(false);
const isEditMode = ref(false);
const editingGoal = ref<GoalType | null>(null);

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

const openModal = (goal?: GoalType) => {
  if (goal) {
    isEditMode.value = true;
    editingGoal.value = goal;
  } else {
    isEditMode.value = false;
    editingGoal.value = null;
  }
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  editingGoal.value = null;
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

const handleFormSubmit = (goalData: any) => {
  if (isEditMode.value && editingGoal.value) {
    updateGoalMutation.mutate({ id: editingGoal.value.id, goal: goalData });
  } else {
    createGoalMutation.mutate({ ...goalData, createdAt: new Date() } as Omit<GoalType, 'id'>);
  }
};

const deleteGoal = (id: number) => {
  if (confirm('Are you sure you want to delete this goal?')) {
    deleteGoalMutation.mutate(id);
  }
};
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
      <!-- Error Message -->
      <div v-if="createGoalMutation.isError.value || updateGoalMutation.isError.value" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
        <p class="text-red-700 text-sm font-medium">
          {{ ((createGoalMutation.error || updateGoalMutation.error) as any)?.response?.data?.message || ((createGoalMutation.error || updateGoalMutation.error) as any)?.message || 'An error occurred' }}
        </p>
      </div>

      <GoalForm
        :initial-goal="editingGoal"
        :is-loading="createGoalMutation.isPending.value || updateGoalMutation.isPending.value"
        @submit="handleFormSubmit"
        @cancel="closeModal"
      />
    </Modal>

    <!-- Goals Grid -->
    <div v-if="isPending" class="text-center py-12">
      <p class="text-neutral-500">Loading goals...</p>
    </div>

    <div v-else-if="isError" class="text-center py-12">
      <p class="text-red-500">Error loading goals: {{ error?.message }}</p>
    </div>

    <div v-else-if="goals.length > 0" class="grid grid-cols-1 gap-4">
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