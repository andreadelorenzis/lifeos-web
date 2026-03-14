import { Application, Container } from "pixi.js";
import { createTopSection } from "./sections/topSection";
import { createChestSection } from "./sections/chestSection";
import { themeManager } from "../theme/themeManager";
import { createMiddleSection } from "./sections/middleSection";
import { Player } from "../actors/Player";
import { Controls } from "../input/Controls";
import { Enemy } from "../actors/Enemy";
import { State } from "../entities/Entity";

interface ChestData {
  id: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  locked: boolean;
}

// Dummy chest data
const chestsData: (ChestData | null)[] = [
  { id: 1, rarity: "common", locked: false },
  { id: 2, rarity: "rare", locked: false },
  null,
  { id: 3, rarity: "epic", locked: true },
];

export class Scene {
  app: Application;
  appHtmlContainer: HTMLElement;
  sceneContainer: Container;
  assets: any;
  player!: Player;
  enemies: Enemy[] = [];

  constructor(app: Application, appHtmlContainer: HTMLElement, assets: any) {
    this.app = app;
    this.appHtmlContainer = appHtmlContainer;
    this.assets = assets;
    this.sceneContainer = new Container();
  }

  init() {
    this.app.stage.addChild(this.sceneContainer);
    this.rebuild();
  }

  rebuild() {
    this.sceneContainer.removeChildren();

    const top = createTopSection(this.app, this.appHtmlContainer, this.assets);
    const chests = createChestSection(
      this.app,
      this.appHtmlContainer,
      this.assets,
      chestsData,
    );
    const { container: middle, terrain } = createMiddleSection(
      this.app,
      this.appHtmlContainer,
      this.assets,
      0,
    );

    // Playable character
    const playerRunFrames = Object.values(this.assets.charRun.textures);
    const playerAttackFrames = Object.values(this.assets.charAttack.textures);
    const playerIdleFrames = Object.values(this.assets.charIdle.textures);
    const playerHitFrames = [this.assets.charHit];

    this.player = new Player(
      this.app.screen.width / 2,
      this.app.screen.height / 2,
      {
        idle: playerIdleFrames,
        attack: playerAttackFrames,
        run: playerRunFrames,
        hit: playerHitFrames,
      },
    );
    this.player.scale = 2;
    this.player.bounds = terrain.getBounds();

    // Enemy
    const enemyRunFrames = Object.values(this.assets.blackLancherRun.textures);
    const enemyAttackFrames = Object.values(
      this.assets.blackLancherRightAttack.textures,
    );
    const enemyIdleFrames = Object.values(
      this.assets.blackLancherIdle.textures,
    );
    const enemy = new Enemy(
      this.app.screen.width / 2 - 100,
      this.app.screen.height / 2,
      {
        idle: enemyIdleFrames,
        run: enemyRunFrames,
        attack: enemyAttackFrames,
      },
      this.player,
    );
    enemy.scale = 0.7;
    enemy.bounds = terrain.getBounds();
    this.enemies = [enemy];

    middle.addChild(this.player);
    middle.addChild(enemy);

    this.sceneContainer.addChild(middle);
    this.sceneContainer.addChild(top);
    this.sceneContainer.addChild(chests);

    themeManager.updateTheme();
  }

  update(dt: number, controls: Controls) {
    if (this.player) {
      this.player.update(dt, controls);
    }

    for (const enemy of this.enemies) {
      // Just visually update animations based on an 'idle' input
      enemy.update(dt, {
        horizontal: 0,
        vertical: 0,
        attack: false,
      } as unknown as Controls);

      // Collision detection with player
      if (this.player) {
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 40) {
          // 40px collision radius
          this.player.takeDamage(35);
          this.player.knockback(enemy.x, enemy.y);
        }

        if (dist < 80 && this.player.state === State.Attack) {
          enemy.takeDamage(35);
          enemy.knockback(this.player.x, this.player.y);
        }
      }
    }
  }
}
