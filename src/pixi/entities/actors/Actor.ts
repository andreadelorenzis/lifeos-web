import { AnimatedSprite, Container, Sprite, Texture } from "pixi.js";
import { Controls } from "../../input/Controls";
import { Entity, State, type AnimationMap } from "../Entity";

export abstract class Actor extends Entity {
  velocityX = 0;
  velocityY = 0;

  speed = 100;

  bounds?: any;

  hitboxWidth = 30;
  hitboxHeight = 30;

  state: State = State.Idle;

  constructor(
    x: number,
    y: number,
    options: { animations?: AnimationMap; texture?: Texture },
  ) {
    super(x, y, options);
  }

  run() {
    this.state = State.Run;
    this.play("run");
  }

  clampToBounds() {
    if (!this.bounds) return;
    const halfW = (this.hitboxWidth * Math.abs(this.scale.x)) / 2;
    const halfH = (this.hitboxHeight * Math.abs(this.scale.y)) / 2;
    this.x = Math.max(
      this.bounds.x + halfW,
      Math.min(this.x, this.bounds.x + this.bounds.width - halfW),
    );
    this.y = Math.max(
      this.bounds.y + halfH,
      Math.min(this.y, this.bounds.y + this.bounds.height - halfH),
    );
  }

  update(dt: number, controls?: Controls) {
    // If attacking, don't process movement or new inputs
    if (this.state === State.Attack) return;

    // Compute velocity (Player: input, Enemy: AI)
    this.computeVelocity(dt, controls);

    // Update position
    this.updateMovement(dt);

    if (this.velocityX !== 0 || this.velocityY !== 0) {
      this.run();
    } else {
      this.state = State.Idle;
      this.play("idle");
    }
  }

  updateMovement(dt: number) {
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
    this.clampToBounds();
    if (this.velocityX < 0) this.scale.x = -Math.abs(this.scale.x);
    else if (this.velocityX > 0) this.scale.x = Math.abs(this.scale.x);
  }

  abstract computeVelocity(dt: number, controls?: Controls): void;
}
