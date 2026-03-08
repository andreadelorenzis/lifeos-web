<template>
  <div ref="gamification" class="gamification"></div>
</template>

<style>
.gamification {
  width: 100%;
  height: 100%;
}
</style>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, nextTick } from "vue";
import {
  Application,
  Assets,
  Container,
  Sprite,
  Graphics,
  Text,
  TextStyle,
} from "pixi.js";
import { useTheme } from "@/composables/useTheme";

const gamification = ref<HTMLElement | undefined>(undefined);
const appRef = ref<Application | undefined>(undefined);

const { isDark } = useTheme();

const updateBg = (app: Application) => {
  const el = gamification.value || document.documentElement;
  const style = getComputedStyle(el);
  const color = style.getPropertyValue("--color-surface-bg").trim();
  app.renderer.background.color = color;
};

watch(isDark, async () => {
  await nextTick(); // Wait for the DOM class to update
  if (appRef.value) updateBg(appRef.value);
});

onMounted(async () => {
  if (!gamification.value) return;

  // Create a new application
  const app = new Application();
  appRef.value = app;

  const style = getComputedStyle(gamification.value);
  const color = style.getPropertyValue("--color-surface-bg").trim();

  // Initialize the application
  await app.init({ background: color, resizeTo: gamification.value });

  // Append the application canvas to the document body
  gamification.value?.append(app.canvas);

  // Load the textures
  const chestSheet = await Assets.load("/sprites/chests/chest_common.json");
  const avatarSheet = await Assets.load("/sprites/avatar/character.json");

  const buildUI = () => {
    // Clear stage for rebuild on resize
    app.stage.removeChildren();

    const screenWidth = app.screen.width;
    const screenHeight = app.screen.height;

    // --- Top Section (Avatar & Status) ---
    const topSection = new Container();
    topSection.y = 20; // some top padding
    app.stage.addChild(topSection);

    // Left: Avatar (Takes approx 33% width)
    const avatarWidth = screenWidth * 0.33;
    const avatarContainer = new Container();
    avatarContainer.x = 0;

    // Avatar Background/Circle
    const avatarBg = new Graphics();
    const avatarRadius = Math.min(avatarWidth * 0.4, 60);
    avatarBg.circle(avatarWidth / 2, avatarRadius, avatarRadius);
    avatarBg.fill({ color: 0xffffff, alpha: 0.2 });
    avatarContainer.addChild(avatarBg);

    const avatarNormal = new Sprite(avatarSheet.textures["char_0_2.png"]);
    avatarNormal.anchor.set(0.5);
    avatarNormal.x = avatarWidth / 2;
    avatarNormal.y = avatarRadius;
    // Scale avatar to fit nicely
    avatarContainer.addChild(avatarNormal);

    topSection.addChild(avatarContainer);

    // Right: Status Info (Remaining 66% width)
    const statusContainer = new Container();
    statusContainer.x = avatarWidth;

    const textStyle = new TextStyle({
      fontFamily: "Arial",
      fontSize: 16,
      fill: "#ffffff",
      fontWeight: "bold",
    });

    const levelText = new Text({ text: "Level: 5", style: textStyle });
    const classText = new Text({ text: "Class: Warrior", style: textStyle });
    classText.y = 25;

    // Exp Bar Background
    const expBarWidth = screenWidth * 0.67 - 40; // leaving some margin
    const expBarBg = new Graphics();
    expBarBg.roundRect(0, 55, expBarWidth, 15, 8);
    expBarBg.fill({ color: 0x333333 });

    // Exp Bar Fill (e.g., 60% full)
    const expProgress = 0.6;
    const expBarFill = new Graphics();
    expBarFill.roundRect(0, 55, expBarWidth * expProgress, 15, 8);
    expBarFill.fill({ color: 0x4ade80 }); // green

    // Exp Text
    const expTextStyle = new TextStyle({
      fontFamily: "Arial",
      fontSize: 10,
      fill: "#ffffff",
    });
    const expText = new Text({ text: "Exp: 600 / 1000", style: expTextStyle });
    expText.x = 5;
    expText.y = 56;

    statusContainer.addChild(levelText);
    statusContainer.addChild(classText);
    statusContainer.addChild(expBarBg);
    statusContainer.addChild(expBarFill);
    statusContainer.addChild(expText);

    topSection.addChild(statusContainer);

    // --- Main World Section ---
    const worldSection = new Container();
    worldSection.y = topSection.height + 40; // place below top section
    // TODO: populate world section later
    app.stage.addChild(worldSection);

    // --- Bottom Section (Chests) ---
    const bottomSection = new Container();
    bottomSection.y = screenHeight - 140; // place at bottom
    app.stage.addChild(bottomSection);

    const chestCount = 4;
    const spacing = screenWidth / (chestCount + 1);

    for (let i = 0; i < chestCount; i++) {
      const chest = new Sprite(chestSheet.textures["chest_closed"]);
      chest.anchor.set(0.5);
      // Distribute evenly
      chest.x = spacing * (i + 1);
      chest.y = 50;
      chest.scale.set(2);
      bottomSection.addChild(chest);
    }
  };

  buildUI();

  // Store reference to resize listener for cleanup
  const handleResize = () => buildUI();
  window.addEventListener("resize", handleResize);

  // Expose it to cleanup
  (gamification.value as any)._pixiResizeHandler = handleResize;
});

onUnmounted(() => {
  if (gamification.value && (gamification.value as any)._pixiResizeHandler) {
    window.removeEventListener(
      "resize",
      (gamification.value as any)._pixiResizeHandler,
    );
  }
  if (appRef.value) {
    appRef.value.destroy(true, { children: true, texture: false } as any);
  }
});
</script>
