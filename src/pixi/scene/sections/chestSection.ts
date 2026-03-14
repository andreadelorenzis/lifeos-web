import {
  Application,
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle,
} from "pixi.js";
import { themeManager } from "@/pixi/theme/themeManager";
import { animateChest } from "../animations/animateChest";
import { gsap } from "gsap/gsap-core";
import { Chest } from "../../entities/items/Chest";

interface ChestData {
  id: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  locked: boolean;
}

// --- Bottom Section (Chests) ---
export function createChestSection(
  app: Application,
  container: HTMLElement,
  assets: any,
  chestsData: (ChestData | null)[],
) {
  const screenWidth = app.screen.width;
  const screenHeight = app.screen.height;
  const el = container || document.documentElement;
  const styles = getComputedStyle(el);

  const bottomSection = new Container();
  bottomSection.y = screenHeight - 140;

  const maxSlots = 4;
  const spacing = screenWidth / (maxSlots + 1);

  for (let i = 0; i < maxSlots; i++) {
    const chestData = chestsData[i] || null;

    const boxContainer = new Container();

    const boxFill = new Graphics();
    boxFill.roundRect(-42, -50, 84, 100, 12);
    boxFill.fill({ color: 0xffffff, alpha: 0.7 });

    const boxStroke = new Graphics();
    // Inner Grid lines
    for (let gx = -42 + 14; gx < 42; gx += 14) {
      boxStroke.moveTo(gx, -50);
      boxStroke.lineTo(gx, 50);
    }
    for (let gy = -50 + 14; gy < 50; gy += 14) {
      boxStroke.moveTo(-42, gy);
      boxStroke.lineTo(42, gy);
    }
    boxStroke.stroke({ width: 1, color: 0xffffff, alpha: 0.15 });

    // Outer Thick Border
    boxStroke.roundRect(-42, -50, 84, 100, 12);
    boxStroke.stroke({ width: 4, color: 0xffffff, alpha: 1 });

    boxContainer.addChild(boxFill);
    boxContainer.addChild(boxStroke);

    // Box coloring
    let isUnlocked = chestData && !chestData.locked;

    // Hardcoded Dark Mode Colors
    const darkPrimaryBg = 0x3b82f6;
    const darkPrimaryBgHover = 0x1d4ed8;
    const darkBorderColor = 0x262626;

    if (isUnlocked) {
      boxFill.tint = darkPrimaryBg;
      boxContainer.eventMode = "static";
      boxContainer.cursor = "pointer";
      boxContainer.off("pointerover");
      boxContainer.off("pointerout");
      boxContainer.on("pointerover", () => (boxFill.tint = darkPrimaryBgHover));
      boxContainer.on("pointerout", () => (boxFill.tint = darkPrimaryBg));
    } else {
      boxFill.tint = darkBorderColor;
      boxContainer.eventMode = "none";
    }
    boxStroke.tint = darkBorderColor;

    boxContainer.x = spacing * (i + 1);
    boxContainer.y = 50;
    bottomSection.addChild(boxContainer);

    if (chestData) {
      // Label above chest
      const labelStyle = new TextStyle({
        fontFamily: "Arial",
        fontSize: 10,
        fontWeight: "bold",
        letterSpacing: 1,
        fill: 0xffffff, // Forced to dark mode equivalent
      });
      const labelText = new Text({
        text: chestData.locked ? "Locked" : "OPEN",
        style: labelStyle,
      });
      labelText.anchor.set(0.5);
      labelText.x = boxContainer.x;
      labelText.y = boxContainer.y - 38;
      bottomSection.addChild(labelText);

      const rarityMap: Record<string, number> = {
        common: 0,
        rare: 1,
        epic: 2,
        legendary: 3,
      };
      const rIdx = rarityMap[chestData.rarity] ?? 0;

      const idleTextures = [assets.chestSheet.textures[`chest_${rIdx}_0`]];
      const openTextures = [
        assets.chestSheet.textures[`chest_${rIdx}_0`],
        assets.chestSheet.textures[`chest_${rIdx}_1`],
        assets.chestSheet.textures[`chest_${rIdx}_2`],
        assets.chestSheet.textures[`chest_${rIdx}_3`],
      ];

      const chest = new Chest(boxContainer.x, boxContainer.y, {
        idle: idleTextures,
        open: openTextures,
      });
      chest.scale.set(3);
      bottomSection.addChild(chest);

      if (!chestData.locked) {
        chest.eventMode = "none";
        boxContainer.on("pointerup", async (event) => {
          console.log("Clicked at:", event.global.x, event.global.y);
          labelText.destroy();
          await animateChest(
            app,
            chest,
            bottomSection,
            assets.particleTex
          );

          // Set the chest slot to null
          const index = chestsData.findIndex((c) => c?.id === chestData.id);
          if (index !== -1) {
            chestsData[index] = null;

            // Reset the background box logic to locked dark mode colors
            boxFill.tint = darkBorderColor;
            boxStroke.tint = darkBorderColor;
            boxContainer.eventMode = "none";
            boxContainer.off("pointerover");
            boxContainer.off("pointerout");

            if (boxContainer.parent) {
              const label = boxContainer.parent.children.find(
                (c) => c instanceof Text && c.x === boxContainer.x,
              );
              if (label) label.destroy();
            }
          }
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

  return bottomSection;
}
