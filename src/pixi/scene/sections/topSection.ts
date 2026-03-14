import { themeManager } from "@/pixi/theme/themeManager";
import {
  Application,
  Container,
  Graphics,
  Sprite,
  AnimatedSprite,
  Text,
  TextStyle,
} from "pixi.js";

// --- Top Section (Avatar & Status) ---
export function createTopSection(
  app: Application,
  container: HTMLElement,
  assets: any,
) {
  const el = container || document.documentElement;
  const styles = getComputedStyle(el);
  const screenWidth = app.screen.width;
  const screenHeight = app.screen.height;

  const topSection = new Container();
  topSection.y = 20; // top padding

  const avatarWidth = screenWidth * 0.33;
  const avatarRadius = Math.min(avatarWidth * 0.4, 60);

  // Status info layout calculations
  const statusHeight = 95;
  const statusY = avatarRadius * 2 - statusHeight - 5;
  const maxStatusWidth = 500;
  const rectWidth = Math.min(
    screenWidth - avatarWidth / 2 - 20,
    maxStatusWidth,
  );
  const skewOffset = Math.tan((30 * Math.PI) / 180) * statusHeight;

  // Polygon points for the status rectangle, skewed on the right
  const polyPoints = [
    avatarWidth / 2,
    statusY, // Top-left

    avatarWidth / 2 + rectWidth,
    statusY, // Top-right

    avatarWidth / 2 + rectWidth - skewOffset,
    statusY + statusHeight, // Bottom-right (skewed)

    avatarWidth / 2,
    statusY + statusHeight, // Bottom-left
  ];

  // --- 1. Right side (Status Rectangle) ---
  const rectFill = new Graphics();
  rectFill.poly(polyPoints);
  rectFill.fill({ color: 0xffffff, alpha: 1 });

  const inset = 5;
  const innerPolyPoints = [
    avatarWidth / 2,
    statusY + inset, // top-left

    avatarWidth / 2 + rectWidth - inset - 4,
    statusY + inset, // top-right

    avatarWidth / 2 + rectWidth - skewOffset - inset,
    statusY + statusHeight - inset, // Bottom-right (skewed)

    avatarWidth / 2,
    statusY + statusHeight - inset, // bottom-left
  ];

  const rectBorderOuter = new Graphics();
  rectBorderOuter.poly(polyPoints); // Bigger polygon
  rectBorderOuter.poly(innerPolyPoints); // Smaller polygon
  rectBorderOuter.stroke({ width: 2, color: 0xffffff, alpha: 1 });

  topSection.addChild(rectFill);
  topSection.addChild(rectBorderOuter);

  // --- 2. Left side (Avatar Circle) ---
  const circleFill = new Graphics();
  circleFill.circle(avatarWidth / 2, avatarRadius, avatarRadius);
  circleFill.fill({ color: 0xffffff, alpha: 1 });

  const circleBorderOuter = new Graphics();
  circleBorderOuter.circle(avatarWidth / 2, avatarRadius, avatarRadius); // Bigger circle
  circleBorderOuter.circle(avatarWidth / 2, avatarRadius, avatarRadius - 5); // Smaller circle
  circleBorderOuter.stroke({ width: 2, color: 0xffffff, alpha: 1 });

  // Add circle to scene second (so it renders on top of the rectangle lines)
  topSection.addChild(circleFill);
  topSection.addChild(circleBorderOuter);

  rectFill.tint = "#2d3748";
  circleFill.tint = "#2d3748";

  rectBorderOuter.tint = "#777777";
  circleBorderOuter.tint = "#777777";

  // Avatar Container
  const avatarContainer = new Container();
  avatarContainer.x = 0;

  const idleFrames = Object.keys(assets.charIdle.textures).map(
    (key) => assets.charIdle.textures[key],
  );

  const avatarAnim = new AnimatedSprite(idleFrames);
  avatarAnim.anchor.set(0.5);
  avatarAnim.x = avatarWidth / 2;
  avatarAnim.y = avatarRadius;
  avatarAnim.scale = 2;
  avatarAnim.animationSpeed = 0.15;
  avatarAnim.play();
  avatarContainer.addChild(avatarAnim);

  topSection.addChild(avatarContainer);

  // Status Info Container
  const statusContainer = new Container();
  statusContainer.x = avatarWidth / 2 + avatarRadius + 20; // Some left padding after circle
  statusContainer.y = statusY; // Shifted down

  const textStyle = new TextStyle({
    fontFamily: "Arial",
    fontSize: 16,
    fontWeight: "bold",
    fill: 0xffffff,
  });

  const combinedText = new Text({
    text: "Warrior - Level 5",
    style: textStyle,
  });
  combinedText.y = 10;

  const barHeight = 18;
  const availableBarWidth = Math.max(
    rectWidth - (statusContainer.x - avatarWidth / 2) - skewOffset - 20,
    100,
  );

  // Exp Bar
  const expBarWidth = availableBarWidth;
  const expBarBg = new Graphics();
  expBarBg.roundRect(0, 36, expBarWidth, barHeight, 8);
  expBarBg.fill({ color: 0x595757 });

  const expProgress = 0.6;
  const expBarFill = new Graphics();
  expBarFill.roundRect(0, 36, expBarWidth * expProgress, barHeight, 8);
  expBarFill.fill({ color: 0x16a34a });

  const textInnerStyle = new TextStyle({
    fontFamily: "Arial",
    fontSize: 12, // Slightly smaller
    fontWeight: "bold",
    fill: 0xffffff,
  });

  const expText = new Text({ text: "Exp: 600 / 1000", style: textInnerStyle });
  expText.x = 8;
  expText.y = 37.5;

  // Health Bar
  const healthBarWidth = availableBarWidth * 0.85;
  const healthBarBg = new Graphics();
  healthBarBg.roundRect(0, 62, healthBarWidth, barHeight, 8);
  healthBarBg.fill({ color: 0x595757 });

  const healthProgress = 0.8;
  const healthBarFill = new Graphics();
  healthBarFill.roundRect(0, 62, healthBarWidth * healthProgress, barHeight, 8);
  healthBarFill.fill({ color: 0xe11d48 }); // Red color for health

  const healthText = new Text({ text: "HP: 80 / 100", style: textInnerStyle });
  healthText.x = 8;
  healthText.y = 63.5;

  statusContainer.addChild(combinedText);
  statusContainer.addChild(expBarBg);
  statusContainer.addChild(expBarFill);
  statusContainer.addChild(expText);
  statusContainer.addChild(healthBarBg);
  statusContainer.addChild(healthBarFill);
  statusContainer.addChild(healthText);

  topSection.addChild(statusContainer);

  return topSection;
}
