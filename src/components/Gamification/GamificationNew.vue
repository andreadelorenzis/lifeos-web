<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { createPixiApp } from "../../pixi/createPixiApp";
import { themeManager } from "@/pixi/theme/themeManager";

const gamification = ref<HTMLElement>();
let destroy: (() => void) | undefined;

onMounted(async () => {
  if (!gamification.value) return;

  const instance = await createPixiApp(gamification.value);

  await nextTick();
  themeManager.updateTheme();

  destroy = instance.destroy;
});

onUnmounted(() => {
  destroy?.();
});
</script>

<template>
  <div ref="gamification" class="gamification"></div>
</template>

<style>
.gamification {
  width: 100%;
  height: 100%;
}
</style>
