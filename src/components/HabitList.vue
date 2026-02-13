<script setup lang="ts">
import { ref } from 'vue';
import Modal from './Modal.vue';
import { Plus } from 'lucide-vue-next';
import { CalendarCheck } from 'lucide-vue-next';

interface Habit {
  id: number;
  name: string;
  description: string;
  frequency: string;
  createdAt: Date;
}

const habits = ref<Habit[]>([]);
const habitName = ref('');
const habitDescription = ref('');
const habitFrequency = ref('daily');
const nextId = ref(1);
const isModalOpen = ref(false);

const frequencies = ['daily', 'weekly', 'monthly', 'custom'];

const addHabit = () => {
  if (habitName.value.trim()) {
    habits.value.push({
      id: nextId.value++,
      name: habitName.value,
      description: habitDescription.value,
      frequency: habitFrequency.value,
      createdAt: new Date(),
    });
    
    // Reset form
    habitName.value = '';
    habitDescription.value = '';
    habitFrequency.value = 'daily';
    closeModal();
  }
};

const deleteHabit = (id: number) => {
  habits.value = habits.value.filter(habit => habit.id !== id);
};

const openModal = () => {
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};
</script>

<template>
  <div class="space-y-4 p-4">
    <!-- Header with Toggle Button -->
    <h1 class="text-neutral-900">My Habits</h1>
    <button
    @click="openModal"
    class="flex ml-auto items-center gap-2 px-4 py-2 bg-primary-bg text-primary-text font-medium rounded-md hover:bg-primary-bg-hover transition-colors"
    v-if="habits.length > 0"
    >
    <Plus :size="18" />
    Add Habit
    </button>

    <!-- Modal with Add Habit Form -->
    <Modal :is-open="isModalOpen" title="Add New Habit" @close="closeModal">
      <div class="space-y-4">
        <!-- Name Input -->
        <div>
          <label for="habitName" class="block text-sm font-medium text-neutral-900 mb-1">
            Name
          </label>
          <input
            id="habitName"
            v-model="habitName"
            type="text"
            placeholder="e.g., Morning Workout"
            class="w-full px-3 py-2 border border-surface-border bg-surface-bg text-neutral-900 placeholder-neutral-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg"
          />
        </div>

        <!-- Description Input -->
        <div>
          <label for="habitDescription" class="block text-sm font-medium text-neutral-900 mb-1">
            Description
          </label>
          <textarea
            id="habitDescription"
            v-model="habitDescription"
            placeholder="Add details about your habit..."
            rows="3"
            class="w-full px-3 py-2 border border-surface-border bg-surface-bg text-neutral-900 placeholder-neutral-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg"
          />
        </div>

        <!-- Frequency Select -->
        <div>
          <label for="habitFrequency" class="block text-sm font-medium text-neutral-900 mb-1">
            Frequency
          </label>
          <select
            id="habitFrequency"
            v-model="habitFrequency"
            class="w-full px-3 py-2 border border-surface-border bg-surface-bg text-neutral-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-bg"
          >
            <option v-for="freq in frequencies" :key="freq" :value="freq">
              {{ freq.charAt(0).toUpperCase() + freq.slice(1) }}
            </option>
          </select>
        </div>

        <!-- Add Button -->
        <button
          @click="addHabit"
          class="w-full px-4 py-2 bg-primary-bg text-primary-text font-medium rounded-md hover:bg-primary-bg-hover transition-colors"
        >
          Add Habit
        </button>
      </div>
    </Modal>

    <!-- Habits List -->
    <div v-if="habits.length > 0" class="space-y-2">
      <div
        v-for="habit in habits"
        :key="habit.id"
        class="bg-surface-bg rounded-lg border border-surface-border p-4 space-y-2"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h4 class="font-semibold text-neutral-900">{{ habit.name }}</h4>
            <p v-if="habit.description" class="text-sm text-neutral-500 mt-1">
              {{ habit.description }}
            </p>
            <div class="flex items-center gap-4 mt-2">
              <span class="inline-block px-2 py-1 bg-neutral-100 text-neutral-900 text-xs font-medium rounded">
                {{ habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1) }}
              </span>
              <span class="text-xs text-neutral-500">
                Created: {{ habit.createdAt.toLocaleDateString() }}
              </span>
            </div>
          </div>
          <button
            @click="deleteHabit(habit.id)"
            class="text-red-500 hover:text-red-500 font-medium text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="space-y-4">
        <div class="text-4xl"><CalendarCheck :size="48" class="mx-auto text-neutral-300" /></div>
        <p class="text-neutral-500 text-lg">No habits yet. Create your first habit to get started!</p>
        <button
          @click="openModal()"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary-bg text-primary-text font-medium rounded-md hover:bg-primary-bg-hover transition-colors"
        >
          <Plus :size="18" />
          Create Habit
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
