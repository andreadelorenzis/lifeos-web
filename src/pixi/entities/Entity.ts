import { AnimatedSprite, Container, Sprite, Texture } from "pixi.js";

export enum State {
  Idle,
  Run,
  Attack,
  Cooldown,
}

export class Entity extends Container {
  protected sprite: Sprite | AnimatedSprite;
  protected animations?: Record<string, any>;

  constructor(
    x: number,
    y: number,
    options: { animations?: Record<string, any>; texture?: Texture },
  ) {
    super();
    this.x = x;
    this.y = y;

    if (options.animations) {
      this.animations = options.animations;
      this.sprite = new AnimatedSprite(this.animations.idle!);
      (this.sprite as AnimatedSprite).animationSpeed = 0.15;
      (this.sprite as AnimatedSprite).play();
    } else if (options.texture) {
      this.sprite = new Sprite(options.texture);
    } else {
      throw new Error("Entity needs a texture or animations");
    }

    this.sprite.anchor.set(0.5);
    this.addChild(this.sprite);
  }

  play(name: string, onComplete?: () => void) {
    if (!this.animations) return;
    const anim = this.animations[name];
    if (!anim) return;
    if (!(this.sprite instanceof AnimatedSprite)) return;
    if (this.sprite.textures === anim && !onComplete) return;

    this.sprite.textures = anim;
    this.sprite.loop = !onComplete;

    if (onComplete) {
      this.sprite.onComplete = undefined;
      this.sprite.onComplete = () => {
        onComplete();
      };
    } else {
      this.sprite.onComplete = undefined;
    }

    this.sprite.gotoAndPlay(0);
  }
}
