import type { Actor } from "../actors/Actor";

interface IKnockbackTarget {
  x: number;
  y: number;
  scale: { x: number; y: number };
  clampToBounds: () => void;
  sprite: { tint: number };
}

export class Knockback {
  isKnockedBack = false;
  knockbackTimer = 0;
  knockbackDir = { x: 0, y: 0 };
  KNOCKBACK_DUR = 0.2;
  KNOCKBACK_SPEED = 400;
  target: IKnockbackTarget;

  constructor(
    target: IKnockbackTarget,
    dur = 0.2,
    speed = 400,
    private onKnockback?: () => void,
    private onFinishKnockback?: () => void,
  ) {
    this.target = target;
    this.KNOCKBACK_DUR = dur;
    this.KNOCKBACK_SPEED = speed;
  }

  apply(sourceX: number, sourceY: number) {
    if (this.isKnockedBack) return;
    this.isKnockedBack = true;

    const dx = this.target.x - sourceX;
    const dy = this.target.y - sourceY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1; // avoid div by 0

    this.knockbackDir = {
      x: dx / dist,
      y: dy / dist,
    };
    this.knockbackTimer = this.KNOCKBACK_DUR;
  }

  update(dt: number) {
    // false = not blocking normal movement
    if (!this.isKnockedBack) return false;

    this.knockbackTimer -= dt;
    if (this.knockbackTimer <= 0) {
      this.isKnockedBack = false;
      this.target.sprite.tint = 0xffffff;
    } else {
      this.target.x += this.knockbackDir.x * this.KNOCKBACK_SPEED * dt;
      this.target.y += this.knockbackDir.y * this.KNOCKBACK_SPEED * dt;
      this.target.clampToBounds();
      return true; // true = still in knockback, skip normal movement
    }
  }
}
