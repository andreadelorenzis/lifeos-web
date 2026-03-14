import {
  Graphics,
  type Application,
  type Container,
  type Texture,
} from "pixi.js";
import { gsap } from "gsap/gsap-core";
import { Chest } from "@/pixi/items/Chest";

export function animateChest(
  app: Application,
  chest: Chest,
  container: Container,
  particleTex: Texture,
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
        chest.open(app, particleTex).then(() => {
          overlay.destroy();
          chest.destroy();
          resolve();
        });
      },
    });
  });
}
