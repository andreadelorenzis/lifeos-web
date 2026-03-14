<script setup lang="ts">
import { ref } from "vue";
import Tabs from "./components/Tabs.vue";
import ToastContainer from "./components/ToastContainer.vue";
import { useTheme } from "./composables/useTheme";
import Gamification from "./components/Gamification/Gamification.vue";
import GamificationNew from "./components/Gamification/GamificationNew.vue";

const { isDark, toggleDark } = useTheme();
</script>

<template>
  <div
    :class="[{ dark: isDark }]"
    class="flex justify-center bg-surface-bg app-container"
  >
    <div class="min-h-screen flex justify-center productivity-container">
      <div class="w-full max-w-lg px-2 py-16 sm:px-0">
        <Tabs />
      </div>
    </div>

    <div class="gamification-container">
      <GamificationNew />
    </div>
    <button class="theme-toggle" @click="toggleDark">
      {{ isDark ? "☀️" : "🌙" }}
    </button>
    <ToastContainer position="top-left" />
  </div>
</template>

<style scoped>
.app-container {
  position: relative;
  min-height: 100vh;
}

.productivity-container {
  width: 50%;
  min-width: 0;
  border-right: 2px solid var(--color-neutral-500);
  padding: 0 20px;

  display: none;
}

.gamification-container {
  width: 100%;
  min-width: 0;
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
