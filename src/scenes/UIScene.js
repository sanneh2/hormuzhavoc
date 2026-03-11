import Phaser from 'phaser';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  init(data) {
    this._gameScene = data.gameScene;
  }

  create() {
    const W = this.scale.width;

    // HUD panel background
    this.add.image(W / 2, 30, 'hudpanel').setDepth(0);

    // Labels
    const labelStyle = {
      fontSize: '9px',
      fill: '#889aaa',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    };
    const valueStyle = {
      fontSize: '15px',
      fill: '#f0c040',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    };

    // TIME
    this.add.text(30, 10, 'TIME', labelStyle).setDepth(1);
    this._timeText = this.add.text(30, 22, '0:00', valueStyle).setDepth(1);

    // MONEY
    this.add.text(W / 2, 10, 'MONEY', labelStyle).setOrigin(0.5, 0).setDepth(1);
    this._moneyText = this.add.text(W / 2, 22, '$0', valueStyle).setOrigin(0.5, 0).setDepth(1);

    // HIGH SCORE
    const hs = parseInt(localStorage.getItem('hormuz_highscore') || '0');
    this.add.text(W - 30, 10, 'BEST', labelStyle).setOrigin(1, 0).setDepth(1);
    this._highText = this.add.text(W - 30, 22, `${hs}s`, valueStyle).setOrigin(1, 0).setDepth(1);

    // Difficulty badge
    this._diffText = this.add.text(W / 2, 46, '', {
      fontSize: '10px',
      fill: '#ff6633',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(1);
  }

  update() {
    if (!this._gameScene || this._gameScene.isGameOver) return;

    // Time
    const ms = this._gameScene.getTimeAlive();
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    this._timeText.setText(`${mins}:${s.toString().padStart(2, '0')}`);

    // Money
    this._moneyText.setText(`$${this._gameScene.getMoney()}`);

    // High score (live update)
    const hs = parseInt(localStorage.getItem('hormuz_highscore') || '0');
    this._highText.setText(`${hs}s`);

    // Difficulty
    const diff = this._gameScene.getDifficultyLevel();
    if (diff > 0) {
      this._diffText.setText(diff >= 8 ? '🔥 CHAOS MODE 🔥' : `LEVEL ${diff + 1}`);
    }
  }
}
