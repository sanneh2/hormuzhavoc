export const DroneState = {
  WARNING: 'warning',
  EXPLODING: 'exploding',
  DONE: 'done'
};

export default class Drone extends Phaser.GameObjects.Container {
  constructor(scene, x, y, player, config = {}) {
    super(scene, x, y);
    scene.add.existing(this);

    this.state = DroneState.WARNING;
    this._elapsed = 0;
    this._warningDuration = config.warningDuration || 1800;
    this._trackingDuration = config.trackingDuration || Math.max(800, this._warningDuration - 520);
    this._dangerDuration = config.dangerDuration || 170;
    this._player = player;
    this._lockShown = false;

    // Warning reticle — use make (add:false) so objects live only in the container
    this._sight = scene.make.image({ key: 'dronesight', x: 0, y: 0, add: false }).setAlpha(0);
    this.add(this._sight);

    // Warning text
    this._warnText = scene.make.text({
      x: 0, y: -36,
      text: '⚠ INCOMING ⚠',
      style: { fontSize: '11px', fill: '#ff3333', fontFamily: 'Courier New', fontStyle: 'bold' },
      add: false
    }).setOrigin(0.5).setAlpha(0);
    this.add(this._warnText);

    // Explosion image (hidden initially)
    this._explosion = scene.make.image({ key: 'explosion', x: 0, y: 0, add: false }).setAlpha(0).setScale(0.5);
    this.add(this._explosion);

    // Tween sight in
    scene.tweens.add({
      targets: [this._sight, this._warnText],
      alpha: 1,
      duration: 300,
      ease: 'Linear'
    });

    // Pulse the warning
    scene.tweens.add({
      targets: this._sight,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 300,
      yoyo: true,
      repeat: -1
    });

    this._scene = scene;
    this.isDangerous = false; // becomes true during explosion
    this._blastRadius = config.blastRadius || 54;
  }

  update(delta) {
    this._elapsed += delta;

    if (this.state === DroneState.WARNING) {
      this._trackPlayer();

      if (this._elapsed >= this._warningDuration) {
        this._strike();
      }
    } else if (this.state === DroneState.EXPLODING) {
      if (this._elapsed >= this._warningDuration + this._dangerDuration) {
        this.isDangerous = false;
      }

      if (this._elapsed >= this._warningDuration + 400) {
        this.state = DroneState.DONE;
      }
    }
  }

  _trackPlayer() {
    if (!this._player || !this._player.active) return;

    if (this._elapsed >= this._trackingDuration) {
      if (!this._lockShown) {
        this._lockShown = true;
        this._warnText.setText('LOCKED - MOVE');
        this._scene.tweens.add({
          targets: this._sight,
          scaleX: 1.55,
          scaleY: 1.55,
          duration: 140,
          yoyo: true,
          repeat: 2
        });
      }

      return;
    }

    const remaining = Math.max(0, this._warningDuration - this._elapsed);
    const playerBody = this._player.body;
    const velocityX = playerBody ? playerBody.velocity.x : 0;
    const predictedX = Phaser.Math.Clamp(
      this._player.x + velocityX * Math.min(remaining, 420) * 0.00018,
      84,
      this._scene.scale.width - 84
    );
    const predictedY = Phaser.Math.Clamp(
      this._player.y,
      120,
      this._scene.scale.height - 90
    );
    const xLerp = 0.14;
    const yLerp = 0.18;

    this.x = Phaser.Math.Linear(this.x, predictedX, xLerp);
    this.y = Phaser.Math.Linear(this.y, predictedY, yLerp);
  }

  _strike() {
    this.state = DroneState.EXPLODING;
    this.isDangerous = true;
    this._sight.setVisible(false);
    this._warnText.setVisible(false);

    this._scene.tweens.add({
      targets: this._explosion,
      alpha: 1,
      scaleX: 2.2,
      scaleY: 2.2,
      duration: 180,
      ease: 'Back.easeOut',
      onComplete: () => {
        this._scene.tweens.add({
          targets: this._explosion,
          alpha: 0,
          scaleX: 3,
          scaleY: 3,
          duration: 280,
          ease: 'Linear'
        });
      }
    });

    // Screen shake
    this._scene.cameras.main.shake(300, 0.012);
  }

  getBlastRadius() { return this._blastRadius; }
}
