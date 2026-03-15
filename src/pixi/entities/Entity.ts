import { AnimatedSprite, Container, Sprite, Texture } from "pixi.js";

export enum State {
  Idle,
  Run,
  Attack,
  Cooldown,
}

export type AnimationMap = {
  idle: Texture[];
} & Record<string, Texture[]>;

export class Entity extends Container {
  sprite: Sprite | AnimatedSprite;
  protected animations?: Record<string, Texture[]>;

  constructor(
    x: number,
    y: number,
    options: { animations?: AnimationMap; texture?: Texture },
  ) {
    super();
    this.x = x;
    this.y = y;

    if (options.animations) {
      this.animations = options.animations;
      const idleFrames = options.animations.idle;
      const sprite = new AnimatedSprite(idleFrames);
      sprite.animationSpeed = 0.15;
      sprite.play();
      this.sprite = sprite;
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
