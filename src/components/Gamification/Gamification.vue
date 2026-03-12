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
  Texture,
  ParticleContainer,
  Particle,
} from "pixi.js";
import { useTheme } from "@/composables/useTheme";
import { gsap } from "gsap/gsap-core";

interface ChestData {
  id: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  locked: boolean;
}

const gamification = ref<HTMLElement | undefined>(undefined);
const appRef = shallowRef<Application | undefined>(undefined);

// Dummy chest data
const chestsData = ref<(ChestData | null)[]>([
  { id: 1, rarity: "common", locked: false },
  { id: 2, rarity: "rare", locked: false },
  null,
  { id: 3, rarity: "epic", locked: false },
]);

const { isDark } = useTheme();

const textElements = shallowRef<Text[]>([]);
const avatarBgRef = shallowRef<Graphics | undefined>(undefined);
const chestBoxesRef = shallowRef<{ bg: Graphics; chest: ChestData | null }[]>(
  [],
);

const updateTheme = (app: Application) => {
  const el = gamification.value || document.documentElement;
  const style = getComputedStyle(el);
  const bgColor = style.getPropertyValue("--color-surface-bg").trim();
  const textColor = style.getPropertyValue("--color-neutral-900").trim();
  const borderColor =
    style.getPropertyValue("--color-surface-border").trim() || "#ffffff";
  const primaryBg =
    style.getPropertyValue("--color-primary-bg").trim() || "#ffffff";
  const primaryBgHover =
    style.getPropertyValue("--color-primary-bg-hover").trim() || "#ffffff";

  app.renderer.background.color = bgColor;
  textElements.value = textElements.value.filter((text) => !text.destroyed);
  textElements.value.forEach((text) => {
    text.style.fill = textColor;
  });
  if (avatarBgRef.value) {
    avatarBgRef.value.tint = borderColor;
  }
  chestBoxesRef.value.forEach(({ bg, chest }) => {
    if (chest && !chest.locked) {
      bg.tint = primaryBg;
      bg.eventMode = "static";
      bg.on("pointerover", () => (bg.tint = primaryBgHover));
      bg.on("pointerout", () => (bg.tint = primaryBg));
    } else {
      bg.tint = borderColor;
      bg.eventMode = "none";
      bg.off("pointerover");
      bg.off("pointerout");
    }
  });
};

watch(isDark, async () => {
  await nextTick(); // Wait for the DOM class to update
  if (appRef.value) updateTheme(appRef.value);
});

const animateChest = (
  app: Application,
  chest: Sprite,
  container: Container,
  chestSheet: any,
  particleTex: Texture,
  chestData: ChestData,
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
      const rarityMap: Record<string, number> = {
        common: 0,
        rare: 1,
        epic: 2,
        legendary: 3,
      };
      const rIdx = rarityMap[chestData.rarity] ?? 0;

      // Start the chest opening animation
      const textures = [
        chestSheet.textures[`chest_${rIdx}_0`],
        chestSheet.textures[`chest_${rIdx}_1`],
        chestSheet.textures[`chest_${rIdx}_2`],
        chestSheet.textures[`chest_${rIdx}_3`],
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
        const frontChest = new Sprite(chestSheet.textures[`chest_${rIdx}_3`]);
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

        // 3. Particles
        const particleContainer = new ParticleContainer({
          dynamicProperties: {
            position: true,
            vertex: false,
            rotation: false,
            color: true,
            alpha: true,
          },
        });

        type ParticleData = {
          particle: Particle;
          vx: number;
          vy: number;
          life: number;
        };

        const particles: ParticleData[] = [];
        for (let i = 0; i < 15; i++) {
          const particle = new Particle({
            texture: particleTex,
            x: anim.x,
            y: anim.y,
          });
          particle.anchorX = 0.5;
          particle.anchorY = 0.5;
          particle.scaleX = 0.2;
          particle.scaleY = 0.2;
          particleContainer.addParticle(particle);

          // burst upwards and outwards
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 4 + 2;
          particles.push({
            particle,
            vx: Math.cos(angle) * speed,
            vy: -Math.abs(Math.sin(angle)) * speed - 4, // Upward burst
            life: 1,
          });
        }

        const totalLife = 1;
        // Add particles behind the front chest mask but in front of background chest
        app.stage.addChildAt(
          particleContainer,
          app.stage.getChildIndex(frontChest),
        );
        const tickerFn = (ticker: Ticker) => {
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            if (!p) continue;
            p.particle.x += p.vx * ticker.deltaTime;
            p.particle.y += p.vy * ticker.deltaTime;
            p.vy += 0.2 * ticker.deltaTime; // Gravity
            const dt = ticker.deltaMS / 1000; // seconds since last tick
            p.life -= dt; // reduce life in seconds
            p.particle.alpha = Math.max(0, p.life / totalLife);

            if (p.life <= 0) {
              particleContainer.removeParticle(p.particle);
              particles.splice(i, 1);
            }
          }
        };
        app.ticker.add(tickerFn);

        // 4. Animate the item popping out
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
                app.ticker.remove(tickerFn);
                particleContainer.destroy();
                overlay.destroy();
                anim.destroy();
                item.destroy();
                frontChest.destroy();
                mask.destroy();

                // Set the chest slot to null
                const index = chestsData.value.findIndex(
                  (c) => c?.id === chestData.id,
                );
                if (index !== -1) {
                  chestsData.value[index] = null;

                  // Reset the background box logic
                  const slotConfig = chestBoxesRef.value[index];
                  if (slotConfig) {
                    slotConfig.chest = null;
                    const el = gamification.value || document.documentElement;
                    const borderColor =
                      getComputedStyle(el)
                        .getPropertyValue("--color-surface-border")
                        .trim() || "#ffffff";
                    slotConfig.bg.tint = borderColor;
                    slotConfig.bg.eventMode = "none";
                    slotConfig.bg.off("pointerover");
                    slotConfig.bg.off("pointerout");

                    if (slotConfig.bg.parent) {
                      const label = slotConfig.bg.parent.children.find(
                        (c) => c instanceof Text && c.x === slotConfig.bg.x,
                      );
                      if (label) label.destroy();
                    }
                  }
                }
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
  // Add some particles
  const particleTex = await Assets.load("/sprites/particles/star_04.png");

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
    avatarBg.fill({ color: 0xffffff, alpha: 0.1 });
    avatarBg.stroke({ width: 2, color: 0xffffff });

    const el = gamification.value || document.documentElement;
    const topStyleObj = getComputedStyle(el);
    const topBorderColor =
      topStyleObj.getPropertyValue("--color-surface-border").trim() ||
      "#ffffff";
    avatarBg.tint = topBorderColor;
    avatarContainer.addChild(avatarBg);
    avatarBgRef.value = avatarBg;

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

    const textColor =
      topStyleObj.getPropertyValue("--color-neutral-900").trim() || "#ffffff";

    const textStyle = new TextStyle({
      fontFamily: "Arial",
      fontSize: 16,
      fill: textColor,
      fontWeight: "bold",
    });

    const levelText = new Text({ text: "Level: 5", style: textStyle });
    const classText = new Text({ text: "Class: Warrior", style: textStyle });
    classText.y = 25;

    // Exp Bar Background
    const expBarWidth = screenWidth * 0.67 - 40; // leaving some margin
    const expBarBg = new Graphics();
    expBarBg.roundRect(0, 55, expBarWidth, 18, 8);
    expBarBg.fill({ color: 0x333333 });

    // Exp Bar Fill (e.g., 60% full)
    const expProgress = 0.6;
    const expBarFill = new Graphics();
    expBarFill.roundRect(0, 55, expBarWidth * expProgress, 18, 8);
    expBarFill.fill({ color: 0x16a34a }); // darker green

    // Exp Text
    const expTextStyle = new TextStyle({
      fontFamily: "Arial",
      fontSize: 12,
      fontWeight: "bold",
      fill: textColor,
    });
    const expText = new Text({ text: "Exp: 600 / 1000", style: expTextStyle });
    expText.x = 8;
    expText.y = 56.5;

    textElements.value = [levelText, classText, expText];

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

    const bottomStyleObj = getComputedStyle(el);
    const bottomBorderColor =
      bottomStyleObj.getPropertyValue("--color-surface-border").trim() ||
      "#ffffff";
    const primaryBg =
      bottomStyleObj.getPropertyValue("--color-primary-bg").trim() || "#ffffff";
    const primaryBgHover =
      bottomStyleObj.getPropertyValue("--color-primary-bg-hover").trim() ||
      "#ffffff";
    const bottomTextColor =
      bottomStyleObj.getPropertyValue("--color-neutral-900").trim() ||
      "#ffffff";

    chestBoxesRef.value = [];
    const maxSlots = 4;
    const spacing = screenWidth / (maxSlots + 1);

    for (let i = 0; i < maxSlots; i++) {
      const chestData = chestsData.value[i] || null;

      const box = new Graphics();
      box.roundRect(-42, -50, 84, 100, 12);
      box.fill({ color: 0xffffff, alpha: 0.1 });
      box.stroke({ width: 2, color: 0xffffff });

      // Box coloring
      if (chestData && !chestData.locked) {
        box.tint = primaryBg;
        box.eventMode = "static";
        box.on("pointerover", () => (box.tint = primaryBgHover));
        box.on("pointerout", () => (box.tint = primaryBg));
      } else {
        box.tint = bottomBorderColor;
      }

      box.x = spacing * (i + 1);
      box.y = 50;
      bottomSection.addChild(box);
      chestBoxesRef.value.push({ bg: box, chest: chestData });

      if (chestData) {
        // Label above chest
        const labelStyle = new TextStyle({
          fontFamily: "Arial",
          fontSize: 10,
          fill: bottomTextColor,
          fontWeight: "bold",
          letterSpacing: 1,
        });
        const labelText = new Text({
          text: chestData.locked ? "Locked" : "OPEN",
          style: labelStyle,
        });
        labelText.anchor.set(0.5);
        labelText.x = box.x;
        labelText.y = box.y - 38; // Place inside box above chest
        bottomSection.addChild(labelText);
        textElements.value.push(labelText);

        const rarityMap: Record<string, number> = {
          common: 0,
          rare: 1,
          epic: 2,
          legendary: 3,
        };
        const rIdx = rarityMap[chestData.rarity] ?? 0;

        const chest = new Sprite(chestSheet.textures[`chest_${rIdx}_0`]);
        chest.anchor.set(0.5);
        chest.x = box.x;
        chest.y = box.y;
        chest.scale.set(3);
        bottomSection.addChild(chest);

        if (!chestData.locked) {
          chest.interactive = true;

          chest.on("pointerup", (event) => {
            console.log("Clicked at:", event.global.x, event.global.y);
            // Destroy label when opening
            labelText.destroy();
            animateChest(
              app,
              chest,
              bottomSection,
              chestSheet,
              particleTex,
              chestData,
            );
          });

          const jumpTimeline = gsap.timeline({ repeat: -1, repeatDelay: 3 });

          // Jump (scale) + tremble (rotation)
          jumpTimeline.to(chest.scale, {
            x: 3.2,
            y: 2.8,
            duration: 0.1,
            yoyo: true,
            repeat: 3,
            ease: "power1.inOut",
          });
          jumpTimeline.to(chest, {
            rotation: 0.1,
            duration: 0.1,
            yoyo: true,
            repeat: 9,
            ease: "power1.inOut",
          });
        }
      }
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
