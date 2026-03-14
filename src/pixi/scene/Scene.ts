import { Application, Container } from "pixi.js";
import { createTopSection } from "./sections/topSection";
import { createChestSection } from "./sections/chestSection";
import { themeManager } from "../theme/themeManager";
import { createMiddleSection } from "./sections/middleSection";
import { Player } from "../entities/characters/Player";
import { Controls } from "../input/Controls";

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
    const middle = createMiddleSection(
      this.app,
      this.appHtmlContainer,
      this.assets,
      0,
    );

    // Character textures
    const runFrames = Object.values(this.assets.charRun.textures);
    const attackFrames = Object.values(this.assets.charAttack.textures);
    const idleFrames = Object.values(this.assets.charIdle.textures);

    this.player = new Player(
      this.app.screen.width / 2,
      this.app.screen.height / 2,
      {
        idle: idleFrames,
        attack: attackFrames,
        run: runFrames,
      },
    );

    middle.addChild(this.player);

    this.sceneContainer.addChild(middle);
    this.sceneContainer.addChild(top);
    this.sceneContainer.addChild(chests);

    themeManager.updateTheme();
  }

  update(dt: number, controls: Controls) {
    if (this.player) this.player.update(dt, controls);
  }
}
