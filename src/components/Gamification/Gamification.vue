<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { Game } from "../../pixi/Game";
import { themeManager } from "@/pixi/theme/themeManager";

const gamification = ref<HTMLElement>();
let game: Game;

onMounted(async () => {
  if (!gamification.value) return;
  game = new Game(gamification.value);
  await nextTick();
  themeManager.updateTheme();
});

onUnmounted(() => {
  game.destroy();
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
