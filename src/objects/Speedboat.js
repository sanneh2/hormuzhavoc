export default class Speedboat extends Phaser.GameObjects.Image {
  constructor(scene, x, y, speed, player) {
    super(scene, x, y, 'speedboat');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this._speed = speed;
    this._player = player;
    this._zigzagFreq = Phaser.Math.FloatBetween(1.8, 3.2);
    this._zigzagAmp = Phaser.Math.FloatBetween(50, 110);
    this._elapsed = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this._lastX = x;

    this.body.setVelocityY(speed);
    this.body.setSize(40, 18);
    this.body.setOffset(5, 8);
  }

  update(delta) {
    this._elapsed += delta * 0.001;

    // Chase player X with a hard cap — never faster than 130px/s sideways
    const targetX = this._player ? this._player.x : this.x;
    const diff = targetX - this.x;
    const chase = Phaser.Math.Clamp(diff * 0.6, -130, 130);
    const zigzag = Math.sin(this._elapsed * this._zigzagFreq) * this._zigzagAmp;
    this.body.setVelocityX(chase + zigzag);

    // Tilt based on horizontal movement
    const tilt = (this.x - this._lastX) * 1.5;
    this.angle = Phaser.Math.Clamp(tilt, -25, 25);
    this._lastX = this.x;

    // Clamp to strait
    if (this.x < 70)  this.x = 70;
    if (this.x > 410) this.x = 410;
  }
}
