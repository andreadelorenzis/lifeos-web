import { Container, Sprite } from "pixi.js";

export class Terrain {
  tileSize = 64;
  paddingCols = 1;
  paddingRows = 1;

  public bounds = { x: 0, y: 0, width: 0, height: 0 };

  constructor(textures: any, container: Container) {
    const width = container.width;
    const height = container.height;

    // We want at least a 3x3 grid to have corners and edges
    const maxCols = Math.max(3, Math.floor(width / this.tileSize));
    // Subtracting approx height for top and bottom UI, plus padding
    const maxRows = Math.max(3, Math.floor(height / this.tileSize));
    // Determine the actual number of cols/rows to draw (minus padding on both sides)
    const cols = maxCols - this.paddingCols * 2;
    const rows = maxRows - this.paddingRows * 2;
    // Center the grid on the screen based on calculated rows/cols
    const gridWidth = cols * this.tileSize;
    const gridHeight = rows * this.tileSize;
    const startX = (width - gridWidth) / 2;
    const startY = (height - gridHeight) / 2;

    this.bounds = { x: startX, y: startY, width: gridWidth, height: gridHeight };

    // Render the grid
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let textureName = "ground_center_center";

        // Determine corners
        if (row === 0 && col === 0) textureName = "ground_top_left";
        else if (row === 0 && col === cols - 1)
          textureName = "ground_top_right";
        else if (row === rows - 1 && col === 0)
          textureName = "ground_bottom_left";
        else if (row === rows - 1 && col === cols - 1)
          textureName = "ground_bottom_right";
        // Determine edges
        else if (row === 0) textureName = "ground_top_center";
        else if (row === rows - 1) textureName = "ground_bottom_center";
        else if (col === 0) textureName = "ground_left_center";
        else if (col === cols - 1) textureName = "ground_right_center";

        const tile = new Sprite(textures[textureName]);
        tile.x = startX + col * this.tileSize;
        tile.y = startY + row * this.tileSize;
        container.addChild(tile);
      }
    }
  }

  public getBounds() {
    return this.bounds;
  }
}
