import { Application, Assets } from "pixi.js";
import { buildScene } from "./scene/buildScene";
import { themeManager } from "./theme/themeManager";

export async function createPixiApp(container: HTMLElement) {
  // Create a new application
  const app = new Application();

  // Change background color dinamically when theme changes
  themeManager.register(
    app,
    () =>
      getComputedStyle(container).getPropertyValue("--color-surface-bg").trim(),
    (value, a) => {
      a.renderer.background.color = value;
    },
  );

  // Initialize the application
  await app.init({ resizeTo: container });

  app.stage.interactive = true;

  // Append the application canvas to the html container
  container.appendChild(app.canvas);

  // Load the assets
  const assets = {
    chestSheet: await Assets.load("/sprites/chests/chests_animate.json"),
    avatarSheet: await Assets.load("/sprites/avatar/character.json"),
    particleTex: await Assets.load("/sprites/particles/star_04.png"),
    charIdle: await Assets.load("/sprites/characters/idle.json"),
    charRun: await Assets.load("/sprites/characters/run.json"),
    charAttack: await Assets.load("/sprites/characters/attack.json"),
    tilemapColor1: await Assets.load(
      "/sprites/terrain/tileset/Tilemap_color1.json",
    ),
  };

  const scene = buildScene(app, container, assets);

  const resize = () => scene.rebuild();
  window.addEventListener("resize", resize);

  return {
    destroy() {
      window.removeEventListener(
        "resize",
        (container as any)._pixiResizeHandler,
      );
      if (app) {
        app.destroy(true, { children: true, texture: false } as any);
      }
    },
  };
}
