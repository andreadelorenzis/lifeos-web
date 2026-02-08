<script setup lang="ts">
import { ref } from 'vue'

interface Todo {
  id: number
  text: string
  completed: boolean
}

const todos = ref<Todo[]>([])
const inputValue = ref('')
const nextId = ref(1)

function addTodo() {
  if (inputValue.value.trim()) {
    todos.value.push({
      id: nextId.value++,
      text: inputValue.value,
      completed: false
    })
    inputValue.value = ''
  }
}

function toggleTodo(id: number) {
  const todo = todos.value.find(t => t.id === id)
  if (todo) {
    todo.completed = !todo.completed
  }
}

function deleteTodo(id: number) {
  todos.value = todos.value.filter(t => t.id !== id)
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
      />
      <button @click="addTodo" class="add-btn bg-primary-bg text-primary-text hover:bg-primary-bg-hover">Add</button>
    </div>

    <ul v-if="todos.length > 0" class="todos border border-surface-border">
      <li v-for="todo in todos" :key="todo.id" class="todo-item bg-surface-bg border border-surface-border hover:bg-neutral-100">
        <input
          type="checkbox"
          :checked="todo.completed"
          @change="toggleTodo(todo.id)"
          class="accent-primary-bg"
        />
        <span :class="{ completed: todo.completed, 'text-neutral-900': !todo.completed, 'text-neutral-500': todo.completed }">{{ todo.text }}</span>
        <button @click="deleteTodo(todo.id)" class="delete-btn bg-danger-bg text-danger-text hover:bg-red-600">Delete</button>
      </li>
    </ul>
    
    <p v-else class="empty-state text-neutral-500">No todos yet. Add one to get started!</p>
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
</style>