export default class Rocket extends Phaser.GameObjects.Image {
  constructor(scene, x, y, speed, player, config = {}) {
    super(scene, x, y, 'rocket');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this._player = player;
    this._speed = speed;
    this._phase = 'tracking'; // 'tracking' → briefly hover, then 'diving'
    this._trackTimer = config.trackTimer || 600;
    this._trackingGain = config.trackingGain || 4;
    this._maxTrackSpeed = config.maxTrackSpeed || 300;
    this._approachSpeed = config.approachSpeed || speed * 0.25;
    this._launchDelay = config.launchDelay || 160;
    this._elapsed = 0;

    // Start with slow approach so player can see it coming
    this.body.setVelocity(0, this._approachSpeed);
    this.body.setSize(14, 40);
    this.body.setOffset(8, 5);
  }

  update(delta) {
    if (!this._player || !this._player.active) return;

    this._elapsed += delta;

    if (this._phase === 'tracking') {
      // Slide horizontally to sit right above the player (fast snap)
      const diffX = this._player.x - this.x;
      this.body.setVelocityX(
        Phaser.Math.Clamp(diffX * this._trackingGain, -this._maxTrackSpeed, this._maxTrackSpeed)
      );

      if (this._elapsed >= this._trackTimer) {
        // Lock on: fire straight at the player's current position
        this._phase = 'diving';
        const tx = this._player.x - this.x;
        const ty = this._player.y - this.y;
        const len = Math.sqrt(tx * tx + ty * ty) || 1;
        this.body.setVelocity((tx / len) * this._speed * 0.88, (ty / len) * this._speed * 0.88);
      }
    } else if (this._phase === 'diving' && this._elapsed < this._trackTimer + this._launchDelay) {
      this.body.setVelocity(this.body.velocity.x * 0.985, this.body.velocity.y * 0.985);
    }
    // During 'diving' — velocity is fixed, no steering

    // Rotate to face direction of travel
    this.angle = Phaser.Math.RadToDeg(
      Math.atan2(this.body.velocity.x, -this.body.velocity.y)
    );
  }
}
