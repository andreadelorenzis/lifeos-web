import { Application, Container } from "pixi.js";
import { createTopSection } from "./sections/topSection";
import { createChestSection } from "./sections/chestSection";
import { themeManager } from "../theme/themeManager";
import { createMiddleSection } from "./sections/middleSection";

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

export function buildScene(
  app: Application,
  container: HTMLElement,
  assets: any,
) {
  const root = new Container();
  app.stage.addChild(root);

  function rebuild() {
    root.removeChildren();

    const middle = createMiddleSection(app, container, assets, 0);
    const top = createTopSection(app, container, assets);
    const chests = createChestSection(app, container, assets, chestsData);

    root.addChild(middle);
    root.addChild(top);
    root.addChild(chests);

    themeManager.updateTheme();
  }

  rebuild();

  return { rebuild };
}
