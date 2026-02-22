<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import TaskService, { type Task } from '@/services/TaskService'
import GoalService from '@/services/GoalService'
import TaskCard from './TaskCard.vue'
import TaskForm from './TaskForm.vue'
import Modal from './Modal.vue'
import { Plus, CalendarCheck, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
import { taskModalStore } from '@/stores/TaskModalStore'
import { watch } from 'vue'

const queryClient = useQueryClient()
const { error: toastError, success: toastSuccess } = useToast()
const isModalOpen = ref(false)
const isEditMode = ref(false)
const editingTask = ref<Task | null>(null)
const defaultGoalId = ref<number | undefined>(undefined)
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
  onMutate: async (task: Task) => {
    // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
    await queryClient.cancelQueries({ queryKey: ['tasks'] })

    // Snapshot the previous value
    const previousTasks = queryClient.getQueryData(['tasks'])

    // Optimistically update to the new value
    queryClient.setQueryData(['tasks'], (old: Task[] | undefined) => {
      if (!old) return []

      return old.map(t => {
        if (t.id === task.id) {
          const isCompleting = !t.completedAt
          
          let newProgress = t.progress
          if (t.quantity) {
             newProgress = isCompleting ? t.quantity : 0
          }

          return {
            ...t,
            completedAt: isCompleting ? new Date().toISOString() : null,
            progress: newProgress
          }
        }
        return t
      })
    })

    // Return a context object with the snapshotted value
    return { previousTasks }
  },
  onError: (err, newTask, context: any) => {
    if (context?.previousTasks) {
      queryClient.setQueryData(['tasks'], context.previousTasks)
    }
    toastError('Failed to update task')
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }
})

const createTaskMutation = useMutation({
  mutationFn: (newTask: any) => TaskService.createTask(newTask),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    closeModal()
    toastSuccess('Task created successfully')
  },
  onError: () => {
    toastError('Failed to create task')
  }
})

const updateTaskMutation = useMutation({
  mutationFn: ({ id, task }: { id: number; task: Partial<Task> }) => TaskService.updateTask(id, task),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    closeModal()
    toastSuccess('Task updated successfully')
  },
  onError: () => {
    toastError('Failed to update task')
  }
})

const updateGoalMutation = useMutation({
  mutationFn: ({ id, goal }: { id: number; goal: { deadline: string } }) => GoalService.updateGoal(id, goal),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['goals'] })
    toastSuccess('Goal deadline auto-extended successfully')
  },
  onError: () => {
    toastError('Failed to auto-extend goal deadline')
  }
})

const deleteTaskMutation = useMutation({
  mutationFn: (id: number) => TaskService.deleteTask(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    toastSuccess('Task deleted successfully')
  },
  onError: () => {
    toastError('Failed to delete task')
  }
})

const updateProgressMutation = useMutation({
  mutationFn: ({ task, delta }: { task: Task; delta: number }) => {
    return TaskService.addTaskProgress(task.id, { quantity: delta });
  },
  onMutate: async ({ task, delta }) => {
    await queryClient.cancelQueries({ queryKey: ['tasks'] })
    const previousTasks = queryClient.getQueryData(['tasks'])
    
    queryClient.setQueryData(['tasks'], (old: Task[] | undefined) => {
      if (!old) return []
      return old.map(t => {
        if (t.id === task.id) {
          let np = (t.progress || 0) + delta;
          if (np < 0) np = 0;
          return { ...t, progress: np }
        }
        return t
      })
    })
    return { previousTasks }
  },
  onError: (err, variables, context: any) => {
    if (context?.previousTasks) {
      queryClient.setQueryData(['tasks'], context.previousTasks)
    }
    toastError('Failed to update progress')
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['goals'] })
  }
})

// Actions
const openModal = (task?: Task) => {
  if (task) {
    isEditMode.value = true
    editingTask.value = task
  } else {
    isEditMode.value = false
    editingTask.value = null
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  editingTask.value = null
  defaultGoalId.value = undefined
  taskModalStore.closeModal()
}

// Watch global store for remote open requests (e.g. from GoalCard "Decompose")
watch(() => taskModalStore.state.value.isOpen, (isOpen) => {
    if (isOpen) {
        defaultGoalId.value = taskModalStore.state.value.goalId
        isModalOpen.value = true
        isEditMode.value = false
        editingTask.value = null
    }
}, { immediate: true })

function handleToggle(task: Task) {
  toggleTaskMutation.mutate(task)
}

function handleDelete(id: number) {
  if (confirm('Are you sure you want to delete this task?')) {
    deleteTaskMutation.mutate(id)
  }
}

function handleUpdateProgress(task: Task, delta: number) {
  updateProgressMutation.mutate({ task, delta })
}

const handleFormSubmit = async (taskData: any) => {
  // Extract decomposition flags
  const { applyDeadlineExtension, suggestedDeadline, ...cleanTaskData } = taskData;

  if (applyDeadlineExtension && suggestedDeadline && cleanTaskData.goalId) {
     // Fetch the existing goal to preserve its other values, then update just the deadline
     try {
       const { data: existingGoal } = await GoalService.getGoal(cleanTaskData.goalId);
       updateGoalMutation.mutate({
           id: cleanTaskData.goalId,
           goal: {
               ...existingGoal, // Preserve name, targetQuantity, etc.
               deadline: suggestedDeadline 
           }
       });
     } catch (err) {
       console.error("Failed to auto-update goal:", err);
     }
  }

  if (isEditMode.value && editingTask.value) {
    updateTaskMutation.mutate({ id: editingTask.value.id, task: cleanTaskData })
  } else {
    createTaskMutation.mutate(cleanTaskData)
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
        @click="() => openModal()"
        class="flex items-center gap-2 px-4 py-2 bg-primary-bg text-primary-text font-medium rounded-md hover:bg-primary-bg-hover transition-colors"
        v-if="tasks.length !== 0"
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
          @click="() => openModal()"
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
            :is-pending="toggleTaskMutation.isPending.value || deleteTaskMutation.isPending.value || updateProgressMutation.isPending.value"
            @toggle="handleToggle(task)"
            @edit="openModal(task)"
            @delete="handleDelete(task.id)"
            @updateProgress="handleUpdateProgress(task, $event)"
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
            :is-pending="toggleTaskMutation.isPending.value || deleteTaskMutation.isPending.value || updateProgressMutation.isPending.value"
            @toggle="handleToggle(task)"
            @edit="openModal(task)"
            @delete="handleDelete(task.id)"
            @updateProgress="handleUpdateProgress(task, $event)"
          />
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Modal :is-open="isModalOpen" :title="isEditMode ? 'Edit Task' : 'Add New Task'" @close="closeModal">
      <!-- Error Message -->
      <div v-if="createTaskMutation.isError.value || updateTaskMutation.isError.value" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
        <p class="text-red-700 text-sm font-medium">
          {{ ((createTaskMutation.error || updateTaskMutation.error) as any)?.response?.data?.message || ((createTaskMutation.error || updateTaskMutation.error) as any)?.message || 'An error occurred' }}
        </p>
      </div>

      <TaskForm
        :initial-task="editingTask"
        :preset-goal-id="defaultGoalId"
        :is-loading="createTaskMutation.isPending.value || updateTaskMutation.isPending.value"
        @submit="handleFormSubmit"
        @cancel="closeModal"
      />
    </Modal>
  </div>
</template>
