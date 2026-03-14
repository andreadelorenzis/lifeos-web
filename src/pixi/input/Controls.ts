export class Controls {
  private keys: Record<string, boolean> = {};

  constructor() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });
  }

  get horizontal(): number {
    if (this.keys["ArrowLeft"] || this.keys["KeyA"]) return -1;
    if (this.keys["ArrowRight"] || this.keys["KeyD"]) return 1;

    return 0;
  }

  get vertical(): number {
    if (this.keys["ArrowUp"] || this.keys["KeyW"]) return -1;
    if (this.keys["ArrowDown"] || this.keys["KeyS"]) return 1;

    return 0;
  }

  get attack(): boolean {
    return this.keys["Space"] ?? false;
  }
}
