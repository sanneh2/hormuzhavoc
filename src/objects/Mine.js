import Phaser from 'phaser';

export default class Mine extends Phaser.GameObjects.Image {
  constructor(scene, x, y, speed, player, config = {}) {
    super(scene, x, y, 'mine');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this._elapsed = 0;
    this._player = player;
    this._forwardSpeed = speed;
    this._laneX = config.laneX || x;
    this._swayAmplitude = config.swayAmplitude || 16;
    this._swaySpeed = config.swaySpeed || 0.0015;

    this.body.setVelocityY(this._forwardSpeed);
    this.body.setVelocityX(0);
    this.body.setCircle(16, 4, 4);

    scene.tweens.add({
      targets: this,
      scaleX: 1.08,
      scaleY: 1.08,
      alpha: 0.9,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  update(delta) {
    this._elapsed += delta;
    const swayTargetX = this._laneX + Math.sin(this._elapsed * this._swaySpeed) * this._swayAmplitude;
    const vx = Phaser.Math.Clamp((swayTargetX - this.x) * 2.8, -42, 42);
    this.body.setVelocityY(this._forwardSpeed);
    this.body.setVelocityX(vx);

    // Clamp to strait so it never disappears sideways
    if (this.x < 70)  this.x = 70;
    if (this.x > 415) this.x = 415;

    this.angle = Math.sin(this._elapsed * 0.0018) * 8;
  }
}
