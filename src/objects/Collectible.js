export const CollectibleType = {
  BARREL: 'barrel',
  INSURANCE: 'insurance',
  NAVBONUS: 'navbonus'
};

export default class Collectible extends Phaser.GameObjects.Image {
  constructor(scene, x, y, type) {
    super(scene, x, y, type);
    this.collectibleType = type;
    this._elapsed = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this._driftSpeed = Phaser.Math.Between(118, 138);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setVelocityY(this._driftSpeed);
    this.body.setCircle(16, 0, 2);

    // Glowing scale pulse
    scene.tweens.add({
      targets: this,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    scene.tweens.add({
      targets: this,
      alpha: 0.8,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  update(delta) {
    this._elapsed += delta * 0.004;
    this.body.setVelocityY(this._driftSpeed);
    this.angle = Math.sin(this._elapsed) * 3;
  }

  getValue() {
    switch (this.collectibleType) {
      case CollectibleType.BARREL:    return 10;
      case CollectibleType.INSURANCE: return 25;
      case CollectibleType.NAVBONUS:  return 5;
      default: return 0;
    }
  }

  isSlowmo() {
    return this.collectibleType === CollectibleType.NAVBONUS;
  }
}
