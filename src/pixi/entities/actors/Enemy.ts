import { State, type AnimationMap } from "../Entity";
import { Actor } from "./Actor";
import { Health } from "../components/Health";
import { Attack } from "../components/Attack";
import { Player } from "./Player";
import { Knockback } from "../components/Knockback";

export class Enemy extends Actor {
  speed = 50;

  target: Actor;

  health: Health;
  attacker: Attack;
  knockback: Knockback;

  constructor(x: number, y: number, animations: AnimationMap, target: Actor) {
    super(x, y, { animations });
    this.state = State.Idle;
    this.target = target;

    this.health = new Health(
      100,
      () => {
        if (this.animations?.hit) this.play("hit");
        this.sprite.tint = 0xff0000;
      },
      () => {
        this.play("idle");
      },
    );

    this.attacker = new Attack(() => {
      this.state = State.Attack;
      this.play("attack", () => {
        this.state = State.Idle;
      });
    });

    this.knockback = new Knockback(this);
  }

  knockbackFrom(sourceX: number, sourceY: number) {
    this.knockback.apply(sourceX, sourceY);
    this.state = State.Idle;
  }

  computeVelocity(dt: number) {
    const isPlayer = this.target instanceof Player;
    if (isPlayer && (this.target as Player).health.isDead()) {
      this.velocityX = 0;
      this.velocityY = 0;
      return;
    }
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.velocityX = (dx / dist) * this.speed;
    this.velocityY = (dy / dist) * this.speed;

    // Flip sprite
    if (this.velocityX < 0) this.scale.x = -Math.abs(this.scale.x);
    else if (this.velocityX > 0) this.scale.x = Math.abs(this.scale.x);
  }

  update(dt: number) {
    this.attacker.update(dt);

    const inKnockback = this.knockback.update(dt);
    if (inKnockback) return; // skip normal movement

    if (this.state === State.Attack) return;

    super.update(dt);
  }
}
