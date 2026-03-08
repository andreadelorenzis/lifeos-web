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
import { onMounted, onUnmounted, ref, shallowRef, watch, nextTick } from "vue";
import {
  Application,
  Assets,
  Container,
  Sprite,
  Graphics,
  Text,
  TextStyle,
  Ticker,
  AnimatedSprite,
} from "pixi.js";
import { useTheme } from "@/composables/useTheme";
import { gsap } from "gsap/gsap-core";

const gamification = ref<HTMLElement | undefined>(undefined);
const appRef = shallowRef<Application | undefined>(undefined);
const activeChestsCount = ref(4);

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

const animateChest = (
  app: Application,
  chest: Sprite,
  container: Container,
  chestSheet: any,
) => {
  // Create dark overlay to cover everything and block clicks
  const overlay = new Graphics();
  overlay.rect(0, 0, app.screen.width, app.screen.height);
  overlay.fill({ color: 0x000000, alpha: 0.7 });
  overlay.interactive = true; // Blocks clicks
  app.stage.addChild(overlay);

  // We need the chest to be above the overlay, so we move it to the stage
  const globalPos = chest.getGlobalPosition();
  app.stage.addChild(chest);
  chest.x = globalPos.x;
  chest.y = globalPos.y;

  const targetGlobal = { x: app.screen.width / 2, y: app.screen.height / 2 };

  // Animate scale separately
  gsap.to(chest.scale, {
    x: 4,
    y: 4,
    duration: 1,
    ease: "power2.inOut",
  });

  // Animate position
  gsap.to(chest, {
    x: targetGlobal.x,
    y: targetGlobal.y,
    duration: 1,
    ease: "power2.inOut",
    onComplete: () => {
      // Start the chest opening animation
      const textures = [
        chestSheet.textures["chest_0_0"],
        chestSheet.textures["chest_0_1"],
        chestSheet.textures["chest_0_2"],
        chestSheet.textures["chest_0_3"],
      ];

      const anim = new AnimatedSprite(textures);
      anim.anchor.set(0.5);
      anim.x = chest.x;
      anim.y = chest.y;
      anim.scale.set(chest.scale.x, chest.scale.y); // Keep the tweened scale
      anim.animationSpeed = 0.15; // Set animation speed
      anim.loop = false;

      app.stage.addChild(anim);
      chest.destroy(); // Destroy original sprite

      anim.play();

      anim.onComplete = () => {
        // 1. Create the item coming out (small circle)
        const item = new Graphics();
        item.circle(0, 0, 25);
        item.fill({ color: 0xffd700 }); // gold
        item.x = anim.x;
        item.y = anim.y + anim.height * 0.1; // start slightly low, inside the chest
        item.scale.set(0); // scale up during animation
        app.stage.addChild(item);

        // 2. Create the front part of the chest (bottom ~35%)
        const frontChest = new Sprite(chestSheet.textures["chest_0_3"]);
        frontChest.anchor.set(0.5);
        frontChest.x = anim.x;
        frontChest.y = anim.y;
        frontChest.scale.set(anim.scale.x, anim.scale.y);

        // Mask for the front base
        const mask = new Graphics();
        const bottomHeight = frontChest.height * 0.35;
        const startY = frontChest.y + frontChest.height / 2 - bottomHeight;
        mask.rect(
          frontChest.x - frontChest.width / 2,
          startY,
          frontChest.width,
          bottomHeight,
        );
        mask.fill({ color: 0xffffff });

        frontChest.mask = mask;
        app.stage.addChild(frontChest);
        app.stage.addChild(mask);

        // 3. Animate the item popping out
        gsap.to(item.scale, { x: 1, y: 1, duration: 1, ease: "back.out(1.5)" });
        gsap.to(item, {
          y: anim.y - anim.height / 2 - 40, // padding above top of chest
          duration: 1,
          ease: "back.out(1.5)",
          onComplete: () => {
            // Wait a bit, then fade out and cleanup
            gsap.to([item, frontChest, anim], {
              alpha: 0,
              duration: 0.5,
              delay: 1,
              onComplete: () => {
                overlay.destroy();
                anim.destroy();
                item.destroy();
                frontChest.destroy();
                mask.destroy();
                activeChestsCount.value--;

                // Rearrange remaining chests
                const remainingChests = container.children as Sprite[];
                const newSpacing =
                  app.screen.width / (remainingChests.length + 1);
                remainingChests.forEach((remainingChest, index) => {
                  gsap.to(remainingChest, {
                    x: newSpacing * (index + 1),
                    duration: 0.3,
                    ease: "power2.out",
                  });
                });
              },
            });
          },
        });
      };
    },
  });
};

onMounted(async () => {
  if (!gamification.value) return;

  // Create a new application
  const app = new Application();
  appRef.value = app;

  // Get background theme color
  const style = getComputedStyle(gamification.value);
  const color = style.getPropertyValue("--color-surface-bg").trim();

  // Initialize the application
  await app.init({ background: color, resizeTo: gamification.value });

  app.stage.interactive = true;

  // Append the application canvas to the document body
  gamification.value?.append(app.canvas);

  // Load the textures
  const chestSheet = await Assets.load("/sprites/chests/chests_animate.json");
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

    const spacing = screenWidth / (activeChestsCount.value + 1);

    for (let i = 0; i < activeChestsCount.value; i++) {
      const chest = new Sprite(chestSheet.textures["chest_0_0"]);
      chest.anchor.set(0.5);
      // Distribute evenly
      chest.x = spacing * (i + 1);
      chest.y = 50;
      chest.scale.set(3);
      bottomSection.addChild(chest);

      chest.interactive = true;

      // Add click event
      chest.on("pointerup", (event) => {
        console.log("Clicked at:", event.global.x, event.global.y);
        animateChest(app, chest, bottomSection, chestSheet);
      });

      chest.on("pointerover", (event) => {
        console.log("Hovered at:", event.global.x, event.global.y);
      });
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
