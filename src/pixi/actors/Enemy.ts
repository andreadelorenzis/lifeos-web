import type { Controls } from "@/pixi/input/Controls";
import { Entity, State } from "../entities/Entity";
import { Actor } from "./Actor";

interface EnemyAnimationsMap {
  idle: any;
  run: any;
  attack: any;
  hit?: any;
}

export class Enemy extends Actor {
  readonly ATTACK_COOLDOWN_MS = 0.2;
  speed = 20;

  target: Actor;

  constructor(
    x: number,
    y: number,
    animations: EnemyAnimationsMap,
    target: Actor,
  ) {
    super(x, y, { animations });
    this.state = State.Idle;
    this.target = target;
  }

  computeVelocity(dt: number) {
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.velocityX = (dx / dist) * this.speed;
    this.velocityY = (dy / dist) * this.speed;

    // Flip sprite
    if (this.velocityX < 0) this.scale.x = -Math.abs(this.scale.x);
    else if (this.velocityX > 0) this.scale.x = Math.abs(this.scale.x);
  }
}
