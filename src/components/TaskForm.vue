<script setup lang="ts">
import { ref, computed, watch, } from 'vue'
import { useQueryClient, useQuery } from '@tanstack/vue-query'
import type { Task } from '@/services/TaskService'
import GoalService from '@/services/GoalService'
import FrequencyService from '@/services/FrequencyService'
import DecompositionService from '@/services/DecompositionService'
import DurationPicker from './DurationPicker.vue'

const props = defineProps<{
  initialTask?: Task | null;
  presetGoalId?: number;
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', payload: any): void;
  (e: 'cancel'): void;
}>();

const queryClient = useQueryClient()

// Form State
const taskName = ref('')
const taskDescription = ref('')
const taskFrequencyId = ref(5) // Default to 'one-time'
const taskGoalId = ref<number | undefined>(undefined)
const taskQuantity = ref<number | undefined>(undefined)
const taskProgress = ref<number | undefined>(undefined)

// Decomposition State
const proposedQuantity = ref<number | null>(null)
const decompositionFeasible = ref<boolean | null>(null)
const suggestedDeadline = ref<string | null>(null)
const valueShortfall = ref<number | null>(null)
const applyDeadlineExtension = ref<boolean>(false)
const applySuggestedQuantity = ref<boolean>(false)
const isDecomposing = ref(false)

// Watch for initialTask changes to populate form when editing
watch(() => props.initialTask, (task) => {
  if (task) {
    taskName.value = task.name || ''
    taskDescription.value = task.description || ''
    taskFrequencyId.value = task.frequencyId || 5
    taskGoalId.value = task.goalId || undefined
    taskQuantity.value = task.quantity || undefined
    taskProgress.value = task.progress || undefined
  } else {
    resetForm()
  }
}, { immediate: true })

watch(() => props.presetGoalId, (goalId) => {
    if (goalId && !props.initialTask) {
        taskGoalId.value = goalId;
        taskFrequencyId.value = 1; // daily
    }
}, { immediate: true })

// Fetch Frequencies
const { data: frequenciesData } = useQuery({
  queryKey: ['frequencies'],
  queryFn: async () => {
    const { data } = await FrequencyService.getFrequencies()
    return data
  },
  initialData: []
})

const frequencies = computed(() => frequenciesData.value || [])

// Fetch Goals
const { data: goalsData } = useQuery({
  queryKey: ['goals'],
  queryFn: async () => {
    const { data } = await GoalService.getGoals()
    return data
  }
})

const selectedGoalUnitCode = computed(() => {
    if (!taskGoalId.value || !goalsData.value) return null;
    const goal = goalsData.value.find((g: any) => g.id === taskGoalId.value);
    return goal?.unitCode || null;
})


function resetForm() {
  taskName.value = ''
  taskDescription.value = ''
  taskFrequencyId.value = 5 // Default one-time
  taskGoalId.value = undefined
  taskQuantity.value = undefined
  taskProgress.value = undefined
  proposedQuantity.value = null
  decompositionFeasible.value = null
  suggestedDeadline.value = null
  valueShortfall.value = null
  applyDeadlineExtension.value = false
  applySuggestedQuantity.value = false
}

// Decomposition Watcher
watch([taskGoalId, taskFrequencyId], async ([newGoalId, newFreqId]) => {
  if (newGoalId && newFreqId) {
    // Only auto-decompose on fresh task creation, or when explicitly requested
    if (props.initialTask) return;
    
    isDecomposing.value = true
    try {
      const response = await DecompositionService.decompose({
        goalId: newGoalId,
        frequencyId: newFreqId
      })
      if (response.data && response.data.requiredQuantity > 0) {
         proposedQuantity.value = response.data.requiredQuantity
         // Suggest the quantity immediately to the user
         if (taskQuantity.value === undefined || taskQuantity.value === 0) {
             taskQuantity.value = response.data.requiredQuantity
         }
      } else {
         proposedQuantity.value = null
      }
    } catch (error) {
       console.error("Failed to fetch decomposition", error)
       proposedQuantity.value = null
    } finally {
       isDecomposing.value = false
       // Reset validity flags on frequency change
       decompositionFeasible.value = null
    }
  } else {
    proposedQuantity.value = null
  }
}, { immediate: true })

// Real-time feasibility check when quantity changes
watch(taskQuantity, async (newQuantity) => {
  if (taskGoalId.value && taskFrequencyId.value && newQuantity && newQuantity > 0) {
      if (props.initialTask) return;

      isDecomposing.value = true
      try {
        const response = await DecompositionService.decompose({
          goalId: taskGoalId.value,
          frequencyId: taskFrequencyId.value,
          quantity: newQuantity
        })
        if (response.data && response.data.feasible !== null) {
           decompositionFeasible.value = response.data.feasible
           suggestedDeadline.value = response.data.suggestedDeadline
           valueShortfall.value = response.data.valueShortfall
        }
      } catch (error) {
         console.error("Failed to verify feasibility", error)
      } finally {
         isDecomposing.value = false
      }
  } else {
     decompositionFeasible.value = null
     suggestedDeadline.value = null
     valueShortfall.value = null
  }
})

// Quick helper applied via checkbox
watch(applySuggestedQuantity, (val) => {
    if (val && proposedQuantity.value) {
        taskQuantity.value = proposedQuantity.value
        applySuggestedQuantity.value = false;
    }
})

const submitForm = () => {
  if (!taskName.value.trim()) {
    return;
  }

  let finalQuantity = taskQuantity.value || 0;
  let finalProgress = taskProgress.value || 0;

  const taskData = {
      name: taskName.value,
      description: taskDescription.value,
      frequencyId: taskFrequencyId.value,
      goalId: taskGoalId.value,
      quantity: finalQuantity,
      progress: finalProgress,
      // Pass decomposition suggestions back to the parent to handle
      applyDeadlineExtension: applyDeadlineExtension.value,
      suggestedDeadline: suggestedDeadline.value
  };

  emit('submit', taskData);
};

</script>

<template>
  <form @submit.prevent="submitForm" class="space-y-4">
    <!-- Name -->
    <div>
      <label for="taskName" class="block text-sm font-medium text-neutral-900 mb-1">
        Task Name *
      </label>
      <input
        id="taskName"
        v-model="taskName"
        type="text"
        placeholder="e.g., Buy groceries"
        class="w-full px-3 py-2 border border-surface-border bg-surface-bg text-neutral-900 placeholder-neutral-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg"
      />
    </div>

    <!-- Description -->
    <div>
      <label for="taskDescription" class="block text-sm font-medium text-neutral-900 mb-1">
        Description
      </label>
      <textarea
        id="taskDescription"
        v-model="taskDescription"
        placeholder="Add details..."
        rows="3"
        class="w-full px-3 py-2 border border-surface-border bg-surface-bg text-neutral-900 placeholder-neutral-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg"
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <!-- Frequency -->
      <div>
        <label for="taskFrequency" class="block text-sm font-medium text-neutral-900 mb-1">
          Frequency *
        </label>
        <select
          id="taskFrequency"
          v-model="taskFrequencyId"
          class="w-full px-3 py-2 border border-surface-border bg-surface-bg text-neutral-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg"
        >
          <option v-for="freq in frequencies" :key="freq.id" :value="freq.id">
            {{ freq.name.charAt(0).toUpperCase() + freq.name.slice(1) }}
          </option>
        </select>
      </div>

      <!-- Goal -->
      <div>
        <label for="taskGoal" class="block text-sm font-medium text-neutral-900 mb-1">
          Goal Reference
        </label>
        <select
          id="taskGoal"
          v-model="taskGoalId"
          :disabled="!!presetGoalId && !initialTask"
          class="w-full px-3 py-2 border border-surface-border bg-surface-bg text-neutral-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg disabled:opacity-60 disabled:bg-neutral-100 disabled:cursor-not-allowed"
        >
          <option :value="undefined">None</option>
          <option v-for="goal in goalsData" :key="goal.id" :value="goal.id">
            {{ goal.name }}
          </option>
        </select>
      </div>

      <!-- Goal progress/impact -->
      <template v-if="taskGoalId">
        <!-- Goal Impact -->
        <div v-if="selectedGoalUnitCode !== 't'">
          <label for="taskQuantity" class="block text-sm font-medium text-neutral-900 mb-1">
            Goal Impact
          </label>
          
          <input
          id="taskQuantity"
          v-model.number="taskQuantity"
          type="number"
          min="0"
          step="0.1"
          placeholder="1.0"
          class="w-full px-3 py-2 border border-surface-border bg-surface-bg text-neutral-900 placeholder-neutral-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg"
          />
        </div>
        
        <!-- Progress -->
        <div v-if="selectedGoalUnitCode !== 't'">
          <label for="taskProgress" class="block text-sm font-medium text-neutral-900 mb-1">
            Progress
          </label>

          <input
          id="taskProgress"
          v-model.number="taskProgress"
          type="number"
          min="0"
            step="0.1"
            placeholder="0.0"
            class="w-full px-3 py-2 border border-surface-border bg-surface-bg text-neutral-900 placeholder-neutral-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg"
            />
        </div>
      </template>
    </div>

    <!-- Decomposition Advice Alerts -->
    <div v-if="taskGoalId && decompositionFeasible === false && !props.initialTask" class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-md mt-2">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-yellow-700 dark:text-yellow-200">
            This quantity is not enough to complete the goal on time (shortfall: {{ valueShortfall }}).
          </p>
          <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-200 space-y-2">
             <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="applySuggestedQuantity" class="rounded text-primary-bg focus:ring-primary-bg" />
                Change quantity to {{ proposedQuantity }}
             </label>
             <label v-if="suggestedDeadline" class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="applyDeadlineExtension" class="rounded text-primary-bg focus:ring-primary-bg" />
                Extend goal deadline to {{ new Date(suggestedDeadline).toLocaleDateString() }}
             </label>
          </div>
        </div>
      </div>
    </div>

    <div v-if="taskGoalId && decompositionFeasible === true && !props.initialTask" class="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 p-4 rounded-md mt-2">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-green-700 dark:text-green-200">
            This quantity is sufficient! You will finish the goal by {{ suggestedDeadline ? new Date(suggestedDeadline).toLocaleDateString() : 'the scheduled date' }}.
          </p>
        </div>
      </div>
    </div>

    <!-- Goal progress/impact (time unit) -->
    <template v-if="taskGoalId"> 
      <div v-if="selectedGoalUnitCode === 't'">
        <!-- Goal Impact -->
        <label for="taskQuantity" class="block text-sm font-medium text-neutral-900 mb-1">
          Goal Impact
        </label>
        <DurationPicker
        v-model="taskQuantity"
        />

        <!-- Progress -->
        <label for="taskProgress" class="block text-sm font-medium text-neutral-900 mb-1">
          Progress
        </label>
        <DurationPicker
        v-model="taskProgress"
        />
      </div>
    </template>

    <!-- Actions -->
    <div class="flex gap-3">
        <button
            v-if="initialTask"
            type="button"
            @click="emit('cancel')"
            class="hidden"
        />
        <button
          type="submit"
          :disabled="isLoading"
          class="flex-1 px-4 py-2 bg-primary-bg text-primary-text font-medium rounded-md hover:bg-primary-bg-hover transition-colors disabled:opacity-50"
        >
          {{ isLoading ? 'Saving...' : (initialTask ? 'Update Task' : 'Create Task') }}
        </button>
    </div>
  </form>
</template>
