export class Health {
  hp: number;
  maxHp: number;

  constructor(maxHp: number = 100, private onDamage?: () => void, private onDeath?: () => void) {
    this.maxHp = maxHp;
    this.hp = maxHp;
  }

  takeDamage(amount: number) {
    if (this.isDead()) return;

    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.onDeath?.();
    } else {
      this.onDamage?.();
    }
  }

  isDead() {
    return this.hp <= 0;
  }
}
