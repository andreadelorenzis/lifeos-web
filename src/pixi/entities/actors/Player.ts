import type { Controls } from "@/pixi/input/Controls";
import { State, type AnimationMap } from "../Entity";
import { Actor } from "./Actor";
import { Health } from "../components/Health";
import { Attack } from "../components/Attack";
import { Knockback } from "../components/Knockback";

export class Player extends Actor {
  health: Health;
  attacker: Attack;
  knockback: Knockback;

  private isFading = false;
  private fadeTimer = 0;
  private readonly FADE_DURATION = 2;

  constructor(x: number, y: number, animations: AnimationMap) {
    super(x, y, { animations });

    this.health = new Health(
      100,
      () => {
        if (this.animations?.hit) this.play("hit");
        this.sprite.tint = 0xff0000;
      },
      () => {
        this.play("death", () => {
          // this.startFadeOut();
        });
        // this.play("deathNoMove")
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
  }

  private startFadeOut() {
    this.isFading = true;
    this.fadeTimer = 0;
  }

  computeVelocity(dt: number, controls: Controls) {
    this.velocityX = controls.horizontal * this.speed;
    this.velocityY = controls.vertical * this.speed;

    // Flip sprite
    if (this.velocityX < 0) this.scale.x = -Math.abs(this.scale.x);
    else if (this.velocityX > 0) this.scale.x = Math.abs(this.scale.x);
  }

  update(dt: number, controls?: Controls) {
    this.attacker.update(dt);

    if (this.state === State.Attack) return;
    if (this.health.isDead() && !this.isFading) return;

    if (this.isFading) {
      this.fadeTimer += dt;
      this.sprite.alpha = Math.max(0, 1 - this.fadeTimer / this.FADE_DURATION);

      if (this.fadeTimer >= this.FADE_DURATION) {
        this.destroy();
      }

      return;
    }

    const inKnockback = this.knockback.update(dt);
    if (inKnockback) return; // skip normal movement

    if (controls?.attack) {
      this.attacker.attack();
      return;
    }

    super.update(dt, controls);
  }
}
