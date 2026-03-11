import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.timeAlive  = data.timeAlive  || 0;
    this.money      = data.money      || 0;
    this.highScore  = data.highScore  || 0;
    this.highMoney  = data.highMoney  || 0;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Background from atlas
    this.add.image(W / 2, H / 2, 'background').setAlpha(0.5);

    // Dark overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.72);
    overlay.fillRect(0, 0, W, H);

    // Panel
    const panelX = 40;
    const panelY = H / 2 - 210;
    const panelW = 400;
    const panelH = 420;

    const panel = this.add.graphics();
    panel.fillStyle(0x0a1628, 0.95);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16);
    panel.lineStyle(3, 0xf0c040, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 16);

    // Title
    this.add.text(W / 2, panelY + 28, '💥 SHIP SUNK! 💥', {
      fontSize: '26px',
      fill: '#ff4444',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Divider
    const divider = this.add.graphics();
    divider.lineStyle(1.5, 0x334455, 1);
    divider.lineBetween(panelX + 20, panelY + 65, panelX + panelW - 20, panelY + 65);

    // Stats
    const secs = Math.floor(this.timeAlive / 1000);
    const mins = Math.floor(secs / 60);
    const s    = secs % 60;
    const timeStr = `${mins}:${s.toString().padStart(2, '0')}`;

    const statStyle  = { fontSize: '13px', fill: '#8899aa', fontFamily: 'Courier New' };
    const valueStyleBig = { fontSize: '20px', fill: '#f0c040', fontFamily: 'Courier New', fontStyle: 'bold' };
    const valueStyleMed = { fontSize: '16px', fill: '#ccddff', fontFamily: 'Courier New', fontStyle: 'bold' };

    this.add.text(W / 2, panelY + 90,  'TIME SURVIVED',     statStyle).setOrigin(0.5);
    this.add.text(W / 2, panelY + 112, timeStr,             valueStyleBig).setOrigin(0.5);

    this.add.text(W / 2, panelY + 150, 'TOTAL EARNINGS',    statStyle).setOrigin(0.5);
    this.add.text(W / 2, panelY + 172, `$${this.money.toLocaleString()}`, valueStyleBig).setOrigin(0.5);

    divider.lineBetween(panelX + 20, panelY + 205, panelX + panelW - 20, panelY + 205);

    // High scores
    this.add.text(panelX + 30, panelY + 220, '🏆 BEST TIME:', statStyle);
    this.add.text(panelX + panelW - 30, panelY + 220, `${this.highScore}s`, valueStyleMed).setOrigin(1, 0);

    this.add.text(panelX + 30, panelY + 248, '💰 BEST MONEY:', statStyle);
    this.add.text(panelX + panelW - 30, panelY + 248, `$${this.highMoney.toLocaleString()}`, valueStyleMed).setOrigin(1, 0);

    // New high score announcement
    const prevHigh = parseInt(localStorage.getItem('hormuz_prevhigh') || '0');
    if (this.highScore > prevHigh) {
      this.add.text(W / 2, panelY + 292, '⭐ NEW HIGH SCORE! ⭐', {
        fontSize: '15px',
        fill: '#ffdd44',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    }
    localStorage.setItem('hormuz_prevhigh', this.highScore.toString());

    // Play Again button
    const btnY = panelY + panelH - 50;
    const btn = this.add.graphics();
    btn.fillStyle(0x1a8822, 1);
    btn.fillRoundedRect(W / 2 - 110, btnY - 20, 220, 44, 10);
    btn.lineStyle(2, 0x44ff66, 1);
    btn.strokeRoundedRect(W / 2 - 110, btnY - 20, 220, 44, 10);

    const btnText = this.add.text(W / 2, btnY + 2, '▶  PLAY AGAIN', {
      fontSize: '18px',
      fill: '#ffffff',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Pulse the button
    this.tweens.add({
      targets: [btn, btnText],
      alpha: 0.7,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Click / keyboard restart
    btnText.on('pointerdown', () => this._restart());
    this.input.keyboard.once('keydown', () => this._restart());

    // Hover effect
    btnText.on('pointerover', () => btnText.setStyle({ fill: '#aaffaa' }));
    btnText.on('pointerout',  () => btnText.setStyle({ fill: '#ffffff' }));

    // Entrance animation
    panel.setAlpha(0);
    this.tweens.add({ targets: panel, alpha: 1, duration: 400, ease: 'Power2' });

    const allText = this.children.list.filter(c => c instanceof Phaser.GameObjects.Text);
    allText.forEach(t => t.setAlpha(0));
    this.tweens.add({ targets: allText, alpha: 1, duration: 500, delay: 200, ease: 'Power2' });
  }

  _restart() {
    this.scene.start('GameScene');
  }
}
