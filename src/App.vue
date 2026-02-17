<script setup lang="ts">
import { ref } from 'vue';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'
import Tabs from './components/Tabs.vue';


const isDark = ref(false);

const toggleDark = () => {
  isDark.value = !isDark.value;
};
</script>

<template>
    <div :class="{ dark: isDark }" class="bg-surface-bg">
        <div class="min-h-screen flex items-center justify-center">
            <div class="w-full max-w-md px-2 py-16 sm:px-0">
              <Tabs />
              <button class="theme-toggle" @click="toggleDark">
                {{ isDark ? '☀️' : '🌙' }}
              </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
div {
  position: relative;
  min-height: 100vh;
}

.theme-toggle {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  border: none;
  background-color: #333;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.theme-toggle:active {
  transform: scale(0.95);
}
</style>
