import type { Controls } from "@/pixi/input/Controls";
import { AnimatedSprite, Container, Texture } from "pixi.js";
import { Entity } from "../Entity";

enum State {
  Idle,
  Run,
  Attack,
  Cooldown,
}

export class Player extends Entity {
  velocityX = 0;
  velocityY = 0;

  speed = 200;
  state: State;

  attackCooldownTimer = 0;
  readonly ATTACK_COOLDOWN_MS = 0.2;

  constructor(x: number, y: number, animations: Record<string, any>) {
    super(x, y, { animations });
    this.state = State.Idle;
  }

  update(dt: number, controls: Controls) {
    // Attack cooldown timer
    let isCooldown = this.attackCooldownTimer > 0;
    this.attackCooldownTimer -= dt;

    // If attacking, don't process movement or new inputs
    if (this.state === State.Attack) return;

    // Movement Physics
    this.velocityX = controls.horizontal * this.speed;
    this.velocityY = controls.vertical * this.speed;
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
    if (this.velocityX < 0) this.scale.x = -1;
    else if (this.velocityX > 0) this.scale.x = 1;

    // Movement or attack
    if (controls.attack && !isCooldown) {
      if (controls.attack) {
        this.attack();
      }
    } else {
      if (this.velocityX !== 0 || this.velocityY !== 0) {
        this.run();
      } else {
        this.state = State.Idle;
        this.play("idle");
      }
    }
  }

  attack() {
    this.state = State.Attack;
    this.play("attack", () => {
      this.state = State.Idle;
      this.attackCooldownTimer = this.ATTACK_COOLDOWN_MS;
    });
  }
  run() {
    this.state = State.Run;
    this.play("run");
  }
}
