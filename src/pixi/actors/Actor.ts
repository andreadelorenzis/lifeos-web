import { AnimatedSprite, Container, Sprite, Texture } from "pixi.js";
import { Controls } from "../input/Controls";
import { State } from "../entities/Entity";

export interface AnimationMap {
  idle: any;
  run?: any;
  attack?: any;
  hit?: any;
}

export abstract class Actor extends Container {
  sprite: Sprite | AnimatedSprite;
  animations?: Record<string, any>;

  velocityX = 0;
  velocityY = 0;
  speed = 100;

  hp = 100;
  maxHp = 100;

  bounds?: any;

  hitboxWidth = 30;
  hitboxHeight = 30;

  state: State;

  attackCooldownTimer = 0;
  readonly ATTACK_COOLDOWN_MS = 0.2;
  isKnockedBack = false;
  knockbackTimer = 0;
  knockbackDir = { x: 0, y: 0 };
  readonly KNOCKBACK_DUR = 0.2;
  readonly KNOCKBACK_SPEED = 400;

  constructor(
    x: number,
    y: number,
    options: { animations?: AnimationMap; texture?: Texture },
  ) {
    super();
    this.x = x;
    this.y = y;
    this.state = State.Idle;

    if (options.animations) {
      this.animations = options.animations;
      this.sprite = new AnimatedSprite(this.animations.idle!);
      (this.sprite as AnimatedSprite).animationSpeed = 0.15;
      (this.sprite as AnimatedSprite).play();
    } else if (options.texture) {
      this.sprite = new Sprite(options.texture);
    } else {
      throw new Error("Entity needs a texture or animations");
    }

    this.sprite.anchor.set(0.5);
    this.addChild(this.sprite);
  }

  play(name: string, onComplete?: () => void) {
    if (!this.animations) return;
    const anim = this.animations[name];
    if (!anim) return;
    if (!(this.sprite instanceof AnimatedSprite)) return;
    if (this.sprite.textures === anim && !onComplete) return;

    this.sprite.textures = anim;
    this.sprite.loop = !onComplete;

    if (onComplete) {
      this.sprite.onComplete = undefined;
      this.sprite.onComplete = () => {
        onComplete();
      };
    } else {
      this.sprite.onComplete = undefined;
    }

    this.sprite.gotoAndPlay(0);
  }

  takeDamage(amount: number) {
    this.hp -= amount;
    if (this.hp <= 0) this.die();
    else if (this.animations?.hit) this.play("hit");
    this.sprite.tint = 0xff0000;
  }

  die() {
    this.hp = 0;
    this.play("idle");
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
    // Cooldown
    let isCooldown = this.attackCooldownTimer > 0;
    if (isCooldown) this.attackCooldownTimer -= dt;

    // Knockback
    if (this.isKnockedBack) {
      this.updateKnockbackMovement(dt);
      return; // skip normal movement
    }

    // If attacking, don't process movement or new inputs
    if (this.state === State.Attack) return;

    // Compute velocity (Player: input, Enemy: AI)
    this.computeVelocity(dt, controls);

    // Update position
    this.updateMovement(dt);

    // Movement or attack
    if (controls?.attack && !isCooldown) {
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

  updateMovement(dt: number) {
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
    this.clampToBounds();
    if (this.velocityX < 0) this.scale.x = -Math.abs(this.scale.x);
    else if (this.velocityX > 0) this.scale.x = Math.abs(this.scale.x);
  }

  knockback(sourceX: number, sourceY: number) {
    if (this.isKnockedBack) return;
    this.isKnockedBack = true;
    this.state = State.Idle;

    const dx = this.x - sourceX;
    const dy = this.y - sourceY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1; // avoid div by 0

    this.knockbackDir = {
      x: dx / dist,
      y: dy / dist,
    };
    this.knockbackTimer = this.KNOCKBACK_DUR;
  }

  updateKnockbackMovement(dt: number) {
    this.knockbackTimer -= dt;
    if (this.knockbackTimer <= 0) {
      this.isKnockedBack = false;
      this.sprite.tint = 0xffffff;
    } else {
      this.x += this.knockbackDir.x * this.KNOCKBACK_SPEED * dt;
      this.y += this.knockbackDir.y * this.KNOCKBACK_SPEED * dt;
      this.clampToBounds();
      return; // Skip normal movement
    }
  }

  abstract computeVelocity(dt: number, controls?: Controls): void;
}
