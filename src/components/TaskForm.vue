<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMutation, useQueryClient, useQuery } from '@tanstack/vue-query'
import TaskService from '@/services/TaskService'
import GoalService from '@/services/GoalService'
import FrequencyService from '@/services/FrequencyService'

const props = defineProps<{
  onSuccess?: () => void
  onCancel?: () => void
}>()

const queryClient = useQueryClient()

// Form State
const taskName = ref('')
const taskDescription = ref('')
const taskFrequencyId = ref(5) // Default to 'one-time'
const taskGoalId = ref<number | undefined>(undefined)
const taskQuantity = ref<number | undefined>(undefined)

watch(taskGoalId, (newGoalId) => {
  if (newGoalId) {
    if (taskQuantity.value === undefined) {
      taskQuantity.value = 1
    }
  } else {
    taskQuantity.value = undefined
  }
})

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

const createTaskMutation = useMutation({
  mutationFn: () => TaskService.createTask({
    name: taskName.value,
    description: taskDescription.value,
    frequencyId: taskFrequencyId.value,
    goalId: taskGoalId.value,
    quantity: taskQuantity.value
  }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    resetForm()
    props.onSuccess?.()
  }
})

function resetForm() {
  taskName.value = ''
  taskDescription.value = ''
  taskFrequencyId.value = 5 // Default one-time
  taskGoalId.value = undefined
  taskQuantity.value = undefined
}

function saveTask() {
  if (taskName.value.trim()) {
    createTaskMutation.mutate()
  }
}
</script>

<template>
  <div class="space-y-4">
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
          class="w-full px-3 py-2 border border-surface-border bg-surface-bg text-neutral-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg"
        >
          <option :value="undefined">None</option>
          <option v-for="goal in goalsData" :key="goal.id" :value="goal.id">
            {{ goal.name }}
          </option>
        </select>
      </div>

      <!-- Quantity -->
      <div v-if="taskGoalId">
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
    </div>

    <!-- Actions -->
    <div class="flex gap-3">
        <button
            v-if="onCancel"
            @click="onCancel"
            class="flex-1 px-4 py-2 bg-neutral-100 text-neutral-700 font-medium rounded-md hover:bg-neutral-200 transition-colors"
        >
            Cancel
        </button>
        <button
          @click="saveTask"
          :disabled="createTaskMutation.isPending.value || !taskName.trim()"
          class="flex-1 px-4 py-2 bg-primary-bg text-primary-text font-medium rounded-md hover:bg-primary-bg-hover transition-colors disabled:opacity-50"
        >
          {{ createTaskMutation.isPending.value ? 'Saving...' : 'Create Task' }}
        </button>
    </div>
  </div>
</template>
