import type { Controls } from "@/pixi/input/Controls";
import { AnimatedSprite, Container, Texture } from "pixi.js";
import { Entity, State } from "../entities/Entity";
import { Actor, type AnimationMap } from "./Actor";

export class Player extends Actor {
  readonly ATTACK_COOLDOWN_MS = 0.2;

  constructor(x: number, y: number, animations: AnimationMap) {
    super(x, y, { animations });
  }

  computeVelocity(dt: number, controls: Controls) {
    this.velocityX = controls.horizontal * this.speed;
    this.velocityY = controls.vertical * this.speed;

    // Flip sprite
    if (this.velocityX < 0) this.scale.x = -Math.abs(this.scale.x);
    else if (this.velocityX > 0) this.scale.x = Math.abs(this.scale.x);
  }
}
