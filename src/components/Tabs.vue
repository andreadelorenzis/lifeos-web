<script lang="ts" setup>
import { ref } from 'vue';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'
import TodoList from './TodoList.vue';
import HabitList from './HabitList.vue';
import GoalList from './GoalList.vue';
import PomodoroTimer from './PomodoroTimer.vue';
import { ListChecks } from 'lucide-vue-next';
import { CheckCircle } from 'lucide-vue-next';
import { Target } from 'lucide-vue-next';
import { Flag } from 'lucide-vue-next';
import { Rocket } from 'lucide-vue-next';

const categories = ref([
    {name: 'To-Dos', id: 1, icon: ListChecks},
    {name: 'Habits', id: 2, icon: CheckCircle},
    {name: 'Focus', id: 3, icon: Target},
    {name: 'Goals', id: 4, icon: Flag},
    {name: 'Boost', id: 5, icon: Rocket},
])
</script>

<template>
  <TabGroup>
    <TabList class="flex p-1 space-x-1 rounded-xl bg-surface-bg border border-surface-border rounded-radius-sm">
        <Tab
        v-for="category in categories"
        as="template"
        :key="category.id"
        v-slot="{ selected }"
        >
            <button
                :class="[
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                selected
                    ? 'bg-primary-bg text-primary-text hover:bg-primary-bg-hover'
                    : 'text-neutral-900 hover:bg-neutral-100',
                'px-spacing-4 py-spacing-3 font-font-weight-medium text-font-size-sm transition-colors duration-fast cursor-pointer'
                ]"
            >
                <div class="flex flex-col items-center gap-1">
                    <component :is="category.icon" :size="18" />
                    {{ category.name }}
                </div>
            </button>
        </Tab>
    </TabList>

    <TabPanels class="mt-2 bg-surface-bg">
      <TabPanel
        v-for="category in categories"
        :key="category.id"
        :class="[
        ]"
      >
        <div v-if="category.id === 1">
          <TodoList />
        </div>
        <div v-if="category.id === 2">
          <HabitList />
        </div>
        <div v-if="category.id === 3">
          <PomodoroTimer />
        </div>
        <div v-if="category.id === 4">
          <GoalList />
        </div>
        <div v-if="category.id === 5">
          <div class="text-center py-12">
            <p class="text-neutral-500">Coming soon...</p>
          </div>
        </div>
      </TabPanel>
    </TabPanels>
  </TabGroup>
</template>