<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import TaskService, { type Task } from '@/services/TaskService'
import TaskCard from './TaskCard.vue'
import TaskForm from './TaskForm.vue'
import Modal from './Modal.vue'
import { Plus, CalendarCheck, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-vue-next'

const queryClient = useQueryClient()
const isModalOpen = ref(false)
const isCompletedExpanded = ref(false)

// Query
const { isPending, isError, data, error } = useQuery({
  queryKey: ['tasks'],
  queryFn: async () => {
    const { data } = await TaskService.getTasks()
    return data
  }
})

// Computed Properties
const tasks = computed(() => data.value || [])

const activeTasks = computed(() => 
  tasks.value.filter(task => !task.completedAt)
)

const completedTasks = computed(() => 
  tasks.value.filter(task => task.completedAt)
)

// Mutations
const toggleTaskMutation = useMutation({
  mutationFn: (task: Task) => {
    if (task.completedAt) {
      return TaskService.uncompleteTask(task.id)
    } else {
      return TaskService.completeTask(task.id)
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }
})

const deleteTaskMutation = useMutation({
  mutationFn: (id: number) => TaskService.deleteTask(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }
})

// Actions
function openModal() {
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

function handleToggle(task: Task) {
  toggleTaskMutation.mutate(task)
}

function handleDelete(id: number) {
  if (confirm('Are you sure you want to delete this task?')) {
    deleteTaskMutation.mutate(id)
  }
}

function toggleCompleted() {
  isCompletedExpanded.value = !isCompletedExpanded.value
}
</script>

<template>
  <div class="space-y-6 p-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-neutral-900 font-semibold text-xl">My Tasks</h1>
      <button
        @click="openModal"
        class="flex items-center gap-2 px-4 py-2 bg-primary-bg text-primary-text font-medium rounded-md hover:bg-primary-bg-hover transition-colors"
      >
        <Plus :size="18" />
        Add Task
      </button>
    </div>

    <!-- Error State -->
    <div v-if="isError" class="p-3 bg-red-50 border border-red-200 rounded-md">
      <p class="text-red-700 text-sm">Failed to load tasks: {{ error?.message }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="isPending" class="text-center py-12">
      <p class="text-neutral-500">Loading tasks...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="tasks.length === 0" class="text-center py-12">
      <div class="space-y-4">
        <div class="text-4xl"><CalendarCheck :size="48" class="mx-auto text-neutral-300" /></div>
        <p class="text-neutral-500 text-lg">No tasks yet. Create one to get started!</p>
        <button
          @click="openModal"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary-bg text-primary-text font-medium rounded-md hover:bg-primary-bg-hover transition-colors"
        >
          <Plus :size="18" />
          Create Task
        </button>
      </div>
    </div>

    <div v-else>
      <!-- Active Task List -->
      <div class="space-y-3 mb-8">
        <TaskCard
          v-for="task in activeTasks"
          :key="task.id"
          :task="task"
          :is-pending="toggleTaskMutation.isPending.value || deleteTaskMutation.isPending.value"
          @toggle="handleToggle"
          @delete="handleDelete"
        />
        <div v-if="activeTasks.length === 0" class="text-center py-8 text-neutral-400 italic">
          No active tasks. Good job!
        </div>
      </div>

      <!-- Completed Section -->
      <div v-if="completedTasks.length > 0" class="border-t border-surface-border pt-4">
        <button 
          @click="toggleCompleted"
          class="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 font-medium transition-colors mb-4"
        >
          <component :is="isCompletedExpanded ? ChevronDown : ChevronRight" :size="20" />
          <CheckCircle2 :size="18" class="text-green-600" />
          <span>Completed Tasks ({{ completedTasks.length }})</span>
        </button>

        <div v-show="isCompletedExpanded" class="space-y-3 pl-2">
          <TaskCard
            v-for="task in completedTasks"
            :key="task.id"
            :task="task"
            :is-pending="toggleTaskMutation.isPending.value || deleteTaskMutation.isPending.value"
            @toggle="handleToggle"
            @delete="handleDelete"
          />
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Modal :is-open="isModalOpen" title="Add New Task" @close="closeModal">
      <TaskForm @success="closeModal" @cancel="closeModal" />
    </Modal>
  </div>
</template>
