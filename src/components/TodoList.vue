<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import TaskService, { type Task } from '@/services/TaskService'

const inputValue = ref('')
const showCompleted = ref(false)
const queryClient = useQueryClient()

// Fetch tasks
const { isPending, isError, data, error } = useQuery({
  queryKey: ['tasks'],
  queryFn: async () => {
    const { data } = await TaskService.getTasks()
    // Filter for one-time tasks if needed, or backend handles it? 
    // The requirement says "TodoList", assuming we show all or just one-time tasks?
    // Let's show all for now, or filter by !isHabit if appropriate. 
    // For now, let's just use all tasks returned by getTasks, but usually TodoList might be separate from Habits.
    // However, the GoalList shows Goals. Let's assume TodoList shows non-habit tasks for now, 
    // or we can filter on the client side if getTasks checks everything.
    // Actually, let's just show all tasks to be safe, or check if we should filter.
    // Re-reading: "In TodoList integrate CRUD API calls...". 
    // Let's assume we show what the API returns.
    return data
  }
})

// Computeds
const tasks = computed(() => data.value || [])
const activeTodos = computed(() => tasks.value.filter(t => !t.completedAt))
const completedTodos = computed(() => tasks.value.filter(t => t.completedAt))

// Mutations
const createTaskMutation = useMutation({
  mutationFn: (text: string) => TaskService.createTask({
    name: text,
    frequencyId: 1
  }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    inputValue.value = ''
  }
})

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
function addTodo() {
  if (inputValue.value.trim()) {
    createTaskMutation.mutate(inputValue.value)
  }
}

function toggleTodo(task: Task) {
  toggleTaskMutation.mutate(task)
}

function deleteTodo(id: number) {
  if (confirm('Are you sure you want to delete this task?')) {
    deleteTaskMutation.mutate(id)
  }
}

function handleKeyPress(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    addTodo()
  }
}
</script>

<template>
  <div class="todo-list bg-surface-bg">
    <h1 class="text-neutral-900">My Todos</h1>
    
    <div class="input-container">
      <input
        v-model="inputValue"
        @keypress="handleKeyPress"
        type="text"
        placeholder="Add a new todo..."
        class="text-neutral-900 bg-neutral-0 border border-surface-border focus:border-primary-bg"
        :disabled="createTaskMutation.isPending.value"
      />
      <button 
        @click="addTodo" 
        class="add-btn bg-primary-bg text-primary-text hover:bg-primary-bg-hover disabled:opacity-50"
        :disabled="createTaskMutation.isPending.value"
      >
        {{ createTaskMutation.isPending.value ? 'Adding...' : 'Add' }}
      </button>
    </div>

    <!-- Error State -->
    <div v-if="isError" class="p-3 mb-4 bg-red-50 border border-red-200 rounded-md text-center">
      <p class="text-red-700 text-sm">Failed to load tasks: {{ error?.message }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="isPending" class="text-center py-8 text-neutral-500">
      Loading tasks...
    </div>

    <div v-else>
      <!-- Active Todos -->
      <ul v-if="activeTodos.length > 0" class="todos border border-surface-border">
        <li v-for="todo in activeTodos" :key="todo.id" class="todo-item bg-surface-bg border border-surface-border hover:bg-neutral-100">
          <input
            type="checkbox"
            :checked="!!todo.completedAt"
            @change="toggleTodo(todo)"
            class="accent-primary-bg"
            :disabled="toggleTaskMutation.isPending.value"
          />
          <span :class="{ 'text-neutral-900': true }">{{ todo.name }}</span>
          <button @click="deleteTodo(todo.id)" class="delete-btn bg-danger-bg text-danger-text hover:bg-red-600" :disabled="deleteTaskMutation.isPending.value">Delete</button>
        </li>
      </ul>
      
      <p v-else-if="completedTodos.length === 0" class="empty-state text-neutral-500">No todos yet. Add one to get started!</p>
      <p v-else class="empty-state text-neutral-500">No active tasks. Good job!</p>

      <!-- Completed Todos Section -->
      <div v-if="completedTodos.length > 0" class="completed-section">
        <button @click="showCompleted = !showCompleted" class="toggle-completed-btn text-neutral-500 hover:text-neutral-700">
          {{ showCompleted ? 'Hide' : 'Show' }} Completed ({{ completedTodos.length }})
          <span class="icon" :class="{ rotated: showCompleted }">▼</span>
        </button>
        
        <ul v-if="showCompleted" class="todos completed-list border border-surface-border">
          <li v-for="todo in completedTodos" :key="todo.id" class="todo-item bg-surface-bg border border-surface-border hover:bg-neutral-100 opacity-60">
            <input
              type="checkbox"
              :checked="!!todo.completedAt"
              @change="toggleTodo(todo)"
              class="accent-primary-bg"
              :disabled="toggleTaskMutation.isPending.value"
            />
            <span class="completed text-neutral-500">{{ todo.name }}</span>
            <button @click="deleteTodo(todo.id)" class="delete-btn bg-danger-bg text-danger-text hover:bg-red-600" :disabled="deleteTaskMutation.isPending.value">Delete</button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.todo-list {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
  font-size: var(--font-size-xl);
  font-weight: 600;
}

.input-container {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

input[type="text"] {
  flex: 1;
  padding: 10px 12px;
  border-radius: 4px;
  font-size: var(--font-size-md);
  transition: border-color 0.2s;
}

input[type="text"]:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.add-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: var(--font-size-sm);
  transition: background-color 0.2s, transform 0.1s;
}

.add-btn:active {
  transform: scale(0.98);
}

.todos {
  list-style: none;
  padding: 0;
  margin: 0;
  border-radius: 4px;
  overflow: hidden;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  transition: background-color 0.2s;
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-item input[type="checkbox"] {
  cursor: pointer;
  width: 20px;
  height: 20px;
}

.todo-item span {
  flex: 1;
  word-break: break-word;
}

.todo-item span.completed {
  text-decoration: line-through;
}

.delete-btn {
  padding: 5px 10px;
  font-size: var(--font-size-xs);
  border: none;
  transition: background-color 0.2s;
}

.empty-state {
  text-align: center;
  padding: 20px;
  font-style: italic;
}

.completed-section {
  margin-top: 20px;
  border-top: 1px solid var(--surface-border);
  padding-top: 10px;
}

.toggle-completed-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-sm);
  padding: 8px 0;
  width: 100%;
  justify-content: flex-start;
  transition: color 0.2s;
}

.toggle-completed-btn .icon {
  font-size: 0.8em;
  transition: transform 0.2s;
}

.toggle-completed-btn .icon.rotated {
  transform: rotate(180deg);
}

.completed-list {
  margin-top: 10px;
}

.opacity-60 {
  opacity: 0.6;
}
</style>