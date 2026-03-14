import { Entity } from "../Entity";

export class Enemy extends Entity {
  hp: number = 100;

  takeDamage(dmg: number) {
    this.hp -= dmg;
  }
}
