export class Attack {
  readonly ATTACK_COOLDOWN_MS = 0.2;
  private attackCooldownTimer = 0;

  constructor(private onAttack?: () => void) {}

  update(dt: number) {
    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer -= dt;
    }
  }

  attack(target?: any) {
    if (!this.isCooldown()) {
      this.attackCooldownTimer = this.ATTACK_COOLDOWN_MS;
      if (this.onAttack) this.onAttack();
    }
  }

  isCooldown() {
    return this.attackCooldownTimer > 0;
  }
}
