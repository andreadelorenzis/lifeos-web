import { Application, Container, Texture } from "pixi.js";
import { createTopSection } from "./sections/topSection";
import { createChestSection } from "./sections/chestSection";
import { themeManager } from "../theme/themeManager";
import { createMiddleSection } from "./sections/middleSection";
import { Player } from "../entities/actors/Player";
import { Controls } from "../input/Controls";
import { Enemy } from "../entities/actors/Enemy";
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
    const playerRunFrames: Texture[] = Object.values(
      this.assets.charRun.textures,
    );
    const playerAttackFrames: Texture[] = Object.values(
      this.assets.charAttack.textures,
    );
    const playerIdleFrames: Texture[] = Object.values(
      this.assets.charIdle.textures,
    );
    const playerHitFrames: Texture[] = [this.assets.charHit];
    const playerDeath: Texture[] = Object.values(
      this.assets.charDeath.textures,
    );
    const playerDeathWithMove: Texture[] = Object.values(
      this.assets.charDeathWithMove.textures,
    );

    this.player = new Player(
      this.app.screen.width / 2,
      this.app.screen.height / 2,
      {
        idle: playerIdleFrames,
        attack: playerAttackFrames,
        run: playerRunFrames,
        hit: playerHitFrames,
        death: playerDeath,
        deathWithMove: playerDeathWithMove,
      },
    );
    this.player.scale = 2;
    this.player.bounds = terrain.getBounds();

    // Enemy
    const enemyRunFrames: Texture[] = Object.values(
      this.assets.blackLancherRun.textures,
    );
    const enemyAttackFrames: Texture[] = Object.values(
      this.assets.blackLancherRightAttack.textures,
    );
    const enemyIdleFrames: Texture[] = Object.values(
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
      enemy.update(dt);

      // Collision detection with player
      if (this.player && !this.player.health.isDead()) {
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 40) {
          // 40px collision radius
          this.player.health.takeDamage(35);
          this.player.knockbackFrom(enemy.x, enemy.y);
        }

        if (dist < 80 && this.player.state === State.Attack) {
          enemy.health.takeDamage(35);
          enemy.knockbackFrom(this.player.x, this.player.y);
        }
      }
    }
  }
}
