import {
  AnimatedSprite,
  Graphics,
  Particle,
  ParticleContainer,
  Sprite,
  Ticker,
  type Application,
  type Container,
  type Texture,
} from "pixi.js";
import { gsap } from "gsap/gsap-core";

interface ChestData {
  id: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  locked: boolean;
}

export function animateChest(
  app: Application,
  chest: Sprite,
  container: Container,
  chestSheet: any,
  particleTex: Texture,
  chestData: ChestData,
): Promise<void> {
  return new Promise((resolve) => {
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

    // Animate scale
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
        chest.destroy();
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
          gsap.to(item.scale, {
            x: 1,
            y: 1,
            duration: 1,
            ease: "back.out(1.5)",
          });
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
                  resolve();
                },
              });
            },
          });
        };
      },
    });
  });
}
