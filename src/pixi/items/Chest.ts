import {
  Container,
  AnimatedSprite,
  Graphics,
  Sprite,
  ParticleContainer,
  Particle,
  type Application,
  type Texture,
  type Ticker,
} from "pixi.js";
import { gsap } from "gsap/gsap-core";
import { Entity, type AnimationMap } from "../entities/Entity";

export class Chest extends Entity {
  constructor(x: number, y: number, animations: AnimationMap) {
    super(x, y, { animations });
  }

  open(app: Application, particleTex: Texture): Promise<void> {
    return new Promise((resolve) => {
      this.play("open", () => {
        this.spawnLoot(app, particleTex).then(resolve);
      });
    });
  }

  private spawnLoot(app: Application, particleTex: Texture): Promise<void> {
    return new Promise((resolve) => {
      const parent = this.parent;
      if (!parent) {
        resolve();
        return;
      }

      if (!this.animations) {
        return;
      }

      // 1. Create the item coming out (small circle)
      const item = new Graphics();
      item.circle(0, 0, 25);
      item.fill({ color: 0xffd700 }); // gold
      item.x = this.x;
      item.y = this.y + this.height * 0.1;
      item.scale.set(0);
      parent.addChild(item);

      // 2. Create the front part of the chest
      const openAnim = this.animations.open || [];
      const frontChest = new Sprite(openAnim[openAnim.length - 1]);
      frontChest.anchor.set(0.5);
      frontChest.x = this.x;
      frontChest.y = this.y;
      frontChest.scale.set(this.scale.x, this.scale.y);

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
      parent.addChild(frontChest);
      parent.addChild(mask);

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
          x: this.x,
          y: this.y,
        });
        particle.anchorX = 0.5;
        particle.anchorY = 0.5;
        particle.scaleX = 0.2;
        particle.scaleY = 0.2;
        particleContainer.addParticle(particle);

        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        particles.push({
          particle,
          vx: Math.cos(angle) * speed,
          vy: -Math.abs(Math.sin(angle)) * speed - 4,
          life: 1,
        });
      }

      const totalLife = 1;
      parent.addChildAt(particleContainer, parent.getChildIndex(frontChest));

      const tickerFn = (ticker: Ticker) => {
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          if (!p) continue;
          p.particle.x += p.vx * ticker.deltaTime;
          p.particle.y += p.vy * ticker.deltaTime;
          p.vy += 0.2 * ticker.deltaTime;
          const dt = ticker.deltaMS / 1000;
          p.life -= dt;
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
        y: this.y - this.height / 2 - 40,
        duration: 1,
        ease: "back.out(1.5)",
        onComplete: () => {
          // Wait a bit, then fade out and cleanup
          gsap.to([item, frontChest, this], {
            alpha: 0,
            duration: 0.5,
            delay: 1,
            onComplete: () => {
              app.ticker.remove(tickerFn);
              particleContainer.destroy();
              item.destroy();
              frontChest.destroy();
              mask.destroy();
              resolve();
            },
          });
        },
      });
    });
  }
}
