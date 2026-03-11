import Phaser from 'phaser';

/**
 * Rocket — 3-phase guided missile
 *
 * Phase 1 'approach'  — drifts slowly downward (Y ≤ hoverY) while gently
 *                        following the player's X column.  Player can see
 *                        it coming with time to react.
 * Phase 2 'hovering'  — brakes to a near-stop at hoverY, flashes red/white
 *                        for ~700 ms while clearly aiming at the player.
 *                        Gives the player a clear "dodge NOW" cue.
 * Phase 3 'diving'    — fires at full speed toward the player; continues
 *                        steering toward the player for ~900 ms with
 *                        increasing authority, then becomes ballistic.
 *                        This forces the player to keep moving, not just
 *                        step aside once.
 */
export default class Rocket extends Phaser.GameObjects.Image {
  constructor(scene, x, y, speed, player, config = {}) {
    super(scene, x, y, 'rocket');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this._player          = player;
    this._speed           = speed;
    this._phase           = 'approach';
    this._elapsed         = 0;

    // Configurable (scaled by difficulty in GameScene)
    this._hoverY          = config.hoverY          || 90;
    this._hoverDuration   = config.hoverDuration   || 720;   // ms aiming at player
    this._approachSpeed   = config.approachSpeed   || 55;    // slow descent
    this._guideDuration   = config.guideDuration   || 900;   // ms of continued steering after launch
    this._maxGuideSpeed   = config.maxGuideSpeed   || 160;   // lateral guide authority (px/s)
    this._flashInterval   = 120;                              // ms between flashes
    this._flashTimer      = 0;
    this._flashState      = false;

    this.body.setVelocity(0, this._approachSpeed);
    this.body.setSize(14, 40);
    this.body.setOffset(8, 5);
  }

  update(delta) {
    if (!this._player || !this._player.active) return;
    this._elapsed += delta;

    if (this._phase === 'approach') {
      // Gently slide toward player's column so they get a clear read
      const diffX = this._player.x - this.x;
      const trackVx = Phaser.Math.Clamp(diffX * 1.6, -110, 110);
      this.body.setVelocityX(trackVx);

      if (this.y >= this._hoverY) {
        // Arrive at hover band — brake and start aiming
        this._phase = 'hovering';
        this._elapsed = 0;
        this.body.setVelocity(0, 0);
      }

    } else if (this._phase === 'hovering') {
      // Stay locked in place, track player X slowly (telegraphing aim)
      const diffX = this._player.x - this.x;
      this.body.setVelocityX(Phaser.Math.Clamp(diffX * 1.2, -60, 60));
      this.body.setVelocityY(0);

      // Flash red ↔ full tint to clearly signal "about to fire"
      this._flashTimer += delta;
      if (this._flashTimer >= this._flashInterval) {
        this._flashTimer = 0;
        this._flashState = !this._flashState;
        this.setTint(this._flashState ? 0xff2222 : 0xffffff);
      }

      if (this._elapsed >= this._hoverDuration) {
        // Fire — lock initial direction toward player, then keep guiding
        this._phase = 'diving';
        this._elapsed = 0;
        this.clearTint();
        const tx = this._player.x - this.x;
        const ty = this._player.y - this.y;
        const len = Math.sqrt(tx * tx + ty * ty) || 1;
        this.body.setVelocity((tx / len) * this._speed, (ty / len) * this._speed);
      }

    } else if (this._phase === 'diving') {
      // Continue steering laterally toward player for guideDuration, then go ballistic
      if (this._elapsed < this._guideDuration) {
        const guideFraction = 1 - this._elapsed / this._guideDuration;
        const diffX = this._player.x - this.x;
        const desiredVx = Phaser.Math.Clamp(
          diffX * 3.5 * guideFraction,
          -this._maxGuideSpeed,
          this._maxGuideSpeed
        );
        // Blend lateral velocity toward desired, keep speed constant
        const curSpd = Math.sqrt(
          this.body.velocity.x ** 2 + this.body.velocity.y ** 2
        ) || this._speed;
        const newVx = Phaser.Math.Linear(this.body.velocity.x, desiredVx, 0.08);
        const newVy = Math.sqrt(Math.max(0, curSpd ** 2 - newVx ** 2));
        this.body.setVelocity(newVx, newVy);
      }
    }

    // Rotate to face direction of travel
    this.angle = Phaser.Math.RadToDeg(
      Math.atan2(this.body.velocity.x, -this.body.velocity.y)
    );
  }
}
