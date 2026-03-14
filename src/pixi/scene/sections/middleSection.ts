import {
  Container,
  Graphics,
  AnimatedSprite,
  type Application,
  Sprite,
} from "pixi.js";
import { gsap } from "gsap/gsap-core";
import { Player } from "@/pixi/actors/Player";
import { Terrain } from "../terrain/Terrain";

// --- Main World Section ---
export function createMiddleSection(
  app: Application,
  container: HTMLElement,
  assets: any,
  y: number,
): { container: Container; terrain: Terrain } {
  const worldSection = new Container();
  worldSection.y = y;

  const screenWidth = app.screen.width;
  const screenHeight = app.screen.height;

  // Calculate remaining space between top section and bottom section
  const sectionHeight = screenHeight;

  // Green world background
  const worldBg = new Graphics();
  worldBg.rect(0, 0, screenWidth, sectionHeight);
  worldBg.fill({ color: 0x47aba9, alpha: 1 });
  worldSection.addChild(worldBg);

  // Add terrain
  const terrain = new Terrain(assets.tilemapColor1.textures, worldSection);

  return { container: worldSection, terrain };
}
