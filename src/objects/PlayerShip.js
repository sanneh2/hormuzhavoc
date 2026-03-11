import Phaser from 'phaser';

export default class PlayerShip extends Phaser.GameObjects.Image {
  constructor(scene, x, y) {
    super(scene, x, y, 'tanker');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setCollideWorldBounds(true);
    this.body.setMaxVelocityX(200);
    this.body.setDragX(600);
    // Narrow hitbox for fairness (texture is now 64×120)
    this.body.setSize(44, 92);
    this.body.setOffset(10, 14);

    this.speed = 220;
    this.isInvincible = false;
    this.invincibleTimer = 0;

    // Touch drag
    this._touchX = null;
    scene.input.on('pointermove', (ptr) => {
      if (ptr.isDown) this._touchX = ptr.x;
    });
    scene.input.on('pointerup', () => { this._touchX = null; });
    scene.input.on('pointerdown', (ptr) => { this._touchX = ptr.x; });
  }

  update(cursors, wasd, delta) {
    const body = this.body;
    let moving = false;

    const left = cursors.left.isDown || wasd.left.isDown;
    const right = cursors.right.isDown || wasd.right.isDown;

    if (left) {
      body.setAccelerationX(-this.speed * 3);
      moving = true;
    } else if (right) {
      body.setAccelerationX(this.speed * 3);
      moving = true;
    } else if (this._touchX !== null) {
      const diff = this._touchX - this.x;
      if (Math.abs(diff) > 10) {
        body.setAccelerationX(diff * 8);
        moving = true;
      } else {
        body.setAccelerationX(0);
      }
    } else {
      body.setAccelerationX(0);
    }

    // Clamp to strait (between shore edges)
    if (this.x < 80) this.x = 80;
    if (this.x > 400) this.x = 400;

    // Slight tilt when turning
    const targetAngle = body.velocity.x * 0.04;
    this.angle = Phaser.Math.Linear(this.angle, targetAngle, 0.1);

    // Invincibility flash
    if (this.isInvincible) {
      this.invincibleTimer -= delta;
      this.alpha = Math.sin(this.invincibleTimer * 0.02) > 0 ? 1 : 0.3;
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false;
        this.alpha = 1;
      }
    }
  }

  makeInvincible(duration = 1800) {
    this.isInvincible = true;
    this.invincibleTimer = duration;
  }
}
