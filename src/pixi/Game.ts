import { Application, Assets, Container } from "pixi.js";
import { Scene } from "./scene/Scene";
import { themeManager } from "./theme/themeManager";
import { Controls } from "./input/Controls";

export class Game {
  app: Application;
  container: HTMLElement;
  controls: Controls;
  scene!: Scene;

  constructor(container: HTMLElement) {
    this.container = container;
    this.app = new Application();
    this.controls = new Controls();
    this.init();
  }

  async init() {
    // Init application
    this.app.stage.interactive = true;
    await this.app.init({ resizeTo: this.container });
    this.app.stage.interactive = true;
    this.container.appendChild(this.app.canvas);

    // Load assets
    const assets = await this.loadAssets();

    // Build scene
    this.scene = new Scene(this.app, this.container, assets);
    this.scene.init();

    // Resize handler
    const resize = () => this.scene.rebuild();
    window.addEventListener("resize", resize);

    // Update loop
    this.app.ticker.add(this.update.bind(this));
  }

  async loadAssets() {
    return {
      tilemapColor1: await Assets.load(
        "/sprites/terrain/tileset/Tilemap_color1.json",
      ),
      chestSheet: await Assets.load("/sprites/chests/chests_animate.json"),
      avatarSheet: await Assets.load("/sprites/avatar/character.json"),
      particleTex: await Assets.load("/sprites/particles/star_04.png"),
      charIdle: await Assets.load("/sprites/characters/idle.json"),
      charRun: await Assets.load("/sprites/characters/run.json"),
      charAttack: await Assets.load("/sprites/characters/attack.json"),
      charDeath: await Assets.load("/sprites/characters/_DeathNoMovement.json"),
      charDeathWithMove: await Assets.load("/sprites/characters/_Death.json"),
      charHit: await Assets.load("/sprites/characters/hit.png"),
      blackLancherIdle: await Assets.load(
        "/sprites/units/Black Units/Lancer/Lancer_Idle.json",
      ),
      blackLancherRightAttack: await Assets.load(
        "/sprites/units/Black Units/Lancer/Lancer_Right_Attack.json",
      ),
      blackLancherRun: await Assets.load(
        "/sprites/units/Black Units/Lancer/Lancer_Run.json",
      ),
    };
  }

  update(ticker: any) {
    const dt = ticker.deltaMS / 1000;
    this.scene.update(dt, this.controls);
  }

  destroy() {}
}
