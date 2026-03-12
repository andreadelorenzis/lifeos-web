import { Container, Graphics, AnimatedSprite, type Application } from "pixi.js";
import { gsap } from "gsap/gsap-core";

// --- Main World Section ---
export function createMiddleSection(
  app: Application,
  container: HTMLElement,
  assets: any,
  y: number,
): Container {
  const worldSection = new Container();
  worldSection.y = y;

  const screenWidth = app.screen.width;
  const screenHeight = app.screen.height;

  // Calculate remaining space between top section and bottom section
  const sectionHeight = screenHeight;

  // Green world background
  const worldBg = new Graphics();
  worldBg.rect(0, 0, screenWidth, sectionHeight);
  worldBg.fill({ color: 0x377d51, alpha: 1 });
  worldSection.addChild(worldBg);

  // Character textures
  const runFrames = Object.keys(assets.charRun.textures).map(
    (key) => assets.charRun.textures[key],
  );
  const attackFrames = Object.keys(assets.charAttack.textures).map(
    (key) => assets.charAttack.textures[key],
  );

  const charAnim = new AnimatedSprite(runFrames);
  charAnim.anchor.set(0.5, 1); // Anchor bottom center
  charAnim.x = -50;
  charAnim.y = sectionHeight - 300; // Near the bottom of the world container
  charAnim.scale.set(2);
  charAnim.animationSpeed = 0.15;
  charAnim.play();

  worldSection.addChild(charAnim);

  function startRunning() {
    charAnim.textures = runFrames;
    charAnim.play();

    // Move to the right side of the screen
    gsap.to(charAnim, {
      x: screenWidth + 50,
      duration: 5,
      ease: "linear",
      onComplete: () => {
        // Reset to left side and loop
        charAnim.x = -50;
        startRunning();
      },
    });
  }

  function scheduleAttack() {
    // Random interval between 2 and 5 seconds to attack
    const attackDelay = Math.random() * 3000 + 2000;

    setTimeout(() => {
      // Pause movement
      gsap.killTweensOf(charAnim);

      // Play attack animation
      charAnim.textures = attackFrames;
      charAnim.loop = false;
      charAnim.gotoAndPlay(0);

      charAnim.onComplete = () => {
        charAnim.loop = true;
        charAnim.onComplete = undefined;
        // Resume running from current position
        const remainingDistance = screenWidth + 50 - charAnim.x;
        const duration = (remainingDistance / (screenWidth + 100)) * 5; // maintain speed

        charAnim.textures = runFrames;
        charAnim.play();

        gsap.to(charAnim, {
          x: screenWidth + 50,
          duration: duration,
          ease: "linear",
          onComplete: () => {
            charAnim.x = -50;
            startRunning();
          },
        });

        scheduleAttack();
      };
    }, attackDelay);
  }

  startRunning();
  scheduleAttack();

  return worldSection;
}
