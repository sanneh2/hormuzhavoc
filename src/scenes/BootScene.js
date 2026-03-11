import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Draw loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x0a1628, 0.9);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 60, 'LOADING...', {
      fontSize: '22px',
      fill: '#f0c040',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    const percentText = this.add.text(width / 2, height / 2, '0%', {
      fontSize: '18px',
      fill: '#ffffff',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      percentText.setText(parseInt(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0xf0c040, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Generate all textures procedurally — no external assets needed
    this.generateTextures();
  }

  generateTextures() {
    // ── Tanker (player ship) — top-down supertanker/VLCC ─────────────────
    // Canvas 64×120: bow = top (y=0), bridge/stern = bottom (y=120)
    const tanker = this.make.graphics({ x: 0, y: 0, add: false });

    // Hull outline — dark red anti-fouling paint on the outer strips
    tanker.fillStyle(0x7a1a10);
    tanker.fillRect(0, 8, 64, 104);
    // Bow point (slightly tapered, not knife-sharp — typical tanker bow)
    tanker.fillTriangle(0, 8, 64, 8, 32, 0);

    // Main deck — rust-brown weathered steel
    tanker.fillStyle(0x5c3d18);
    tanker.fillRect(4, 6, 56, 108);
    tanker.fillTriangle(4, 6, 60, 6, 32, 0);

    // Deck centerline stripe (slightly lighter, running full length)
    tanker.fillStyle(0x6b4a22);
    tanker.fillRect(29, 4, 6, 110);

    // ── Longitudinal pipe runs either side of centreline ─────────────────
    tanker.fillStyle(0x878080);
    tanker.fillRect(20, 5, 3, 104);
    tanker.fillRect(41, 5, 3, 104);

    // ── Cargo tank hatches — 2 columns × 6 rows ──────────────────────────
    // These are the round screw-down inspection hatches on each cargo tank
    for (let row = 0; row < 6; row++) {
      const hy = 13 + row * 13;
      tanker.fillStyle(0x3a2710);
      tanker.fillEllipse(14, hy, 14, 8);
      tanker.lineStyle(1, 0x9a7040, 1);
      tanker.strokeEllipse(14, hy, 14, 8);
      tanker.fillStyle(0x3a2710);
      tanker.fillEllipse(50, hy, 14, 8);
      tanker.lineStyle(1, 0x9a7040, 1);
      tanker.strokeEllipse(50, hy, 14, 8);
    }

    // ── Mid-ship crossover pipe manifold (loading/unloading arms) ────────
    tanker.fillStyle(0x9090a0);
    tanker.fillRect(4, 88, 56, 5);
    // Manifold T-joints
    tanker.fillStyle(0xb0b0b8);
    for (let mx = 10; mx <= 54; mx += 11) {
      tanker.fillRect(mx - 1, 85, 3, 11);
    }

    // ── Superstructure / bridge tower at stern (bottom) ───────────────────
    tanker.fillStyle(0xd4d0c4);
    tanker.fillRect(10, 98, 44, 18);
    // Shadow/depth on top edge of superstructure
    tanker.fillStyle(0xb8b4a8);
    tanker.fillRect(10, 98, 44, 3);
    // Bridge windows (4 across)
    tanker.fillStyle(0x6ab4d8);
    tanker.fillRect(13, 102, 8, 5);
    tanker.fillRect(23, 102, 8, 5);
    tanker.fillRect(33, 102, 8, 5);
    tanker.fillRect(43, 102, 8, 5);
    // Wing bridges (narrow side extensions)
    tanker.fillStyle(0xbcb8ac);
    tanker.fillRect(4, 101, 8, 10);
    tanker.fillRect(52, 101, 8, 10);

    // ── Funnel / smokestack ────────────────────────────────────────────────
    tanker.fillStyle(0x1e1e1e);
    tanker.fillRect(26, 92, 12, 8);
    tanker.fillStyle(0x111111);
    tanker.fillRect(28, 88, 8, 6);
    // Stack top rim
    tanker.lineStyle(1, 0x505050, 1);
    tanker.strokeRect(26, 92, 12, 2);

    // ── Radar mast at bow ──────────────────────────────────────────────────
    tanker.fillStyle(0x707070);
    tanker.fillRect(30, 2, 4, 3);
    tanker.fillRect(26, 3, 12, 1);

    // ── Anchor hawse pipes (port & starboard bow) ─────────────────────────
    tanker.fillStyle(0x555555);
    tanker.fillCircle(11, 5, 3);
    tanker.fillCircle(53, 5, 3);
    // Chain lockers
    tanker.lineStyle(1, 0x888888, 1);
    tanker.strokeCircle(11, 5, 3);
    tanker.strokeCircle(53, 5, 3);

    tanker.generateTexture('tanker', 64, 120);
    tanker.destroy();

    // ── Mine ─────────────────────────────────────────────────────────────
    const mine = this.make.graphics({ x: 0, y: 0, add: false });
    mine.fillStyle(0x1a1a1a);
    mine.fillCircle(20, 20, 18);
    mine.lineStyle(2, 0xa8a8a8, 1);
    mine.strokeCircle(20, 20, 18);
    mine.fillStyle(0x303030);
    // Spikes
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const sx = 20 + Math.cos(angle) * 18;
      const sy = 20 + Math.sin(angle) * 18;
      mine.fillTriangle(sx, sy, sx + Math.cos(angle + 0.35) * 6, sy + Math.sin(angle + 0.35) * 6, sx + Math.cos(angle - 0.35) * 6, sy + Math.sin(angle - 0.35) * 6);
    }
    mine.fillStyle(0x545454);
    mine.fillCircle(20, 20, 9);
    mine.fillStyle(0xcc3333);
    mine.fillCircle(20, 20, 4);
    mine.generateTexture('mine', 40, 40);
    mine.destroy();

    // ── Rocket ────────────────────────────────────────────────────────────
    const rocket = this.make.graphics({ x: 0, y: 0, add: false });
    rocket.fillStyle(0xcc3333);
    rocket.fillRect(8, 10, 14, 36);
    rocket.fillTriangle(8, 10, 22, 10, 15, 0);
    rocket.fillStyle(0xff6600);
    rocket.fillTriangle(6, 46, 10, 30, 1, 46);
    rocket.fillTriangle(24, 46, 20, 30, 29, 46);
    rocket.fillStyle(0xffaa00);
    rocket.fillTriangle(8, 46, 15, 34, 22, 46);
    rocket.generateTexture('rocket', 30, 50);
    rocket.destroy();

    // ── Speedboat ─────────────────────────────────────────────────────────
    const boat = this.make.graphics({ x: 0, y: 0, add: false });
    boat.fillStyle(0xdd2222);
    boat.fillRect(0, 8, 50, 18);
    boat.fillTriangle(0, 8, 0, 26, -10, 17);  // pointed bow (offset trick)
    boat.fillStyle(0xdd2222);
    boat.fillTriangle(50, 8, 50, 26, 62, 17);
    // Redo just the hull in view
    boat.fillStyle(0xdd2222);
    boat.fillRect(4, 8, 42, 18);
    boat.fillStyle(0xff4444);
    // Bow point
    boat.fillTriangle(4, 8, 4, 26, 0, 17);
    // Cockpit
    boat.fillStyle(0xffeeaa);
    boat.fillRect(28, 4, 14, 14);
    // Wake lines
    boat.fillStyle(0xaaddff);
    boat.fillRect(0, 28, 46, 3);
    boat.generateTexture('speedboat', 50, 34);
    boat.destroy();

    // ── Oil Barrel ────────────────────────────────────────────────────────
    const barrel = this.make.graphics({ x: 0, y: 0, add: false });
    barrel.fillStyle(0x171717);
    barrel.fillEllipse(18, 4, 22, 8);
    barrel.fillRect(7, 4, 22, 28);
    barrel.fillEllipse(18, 32, 22, 8);
    barrel.fillStyle(0x2f2f2f);
    barrel.fillRect(7, 10, 22, 3);
    barrel.fillRect(7, 23, 22, 3);
    barrel.lineStyle(2, 0x5a5a5a, 1);
    barrel.strokeEllipse(18, 4, 22, 8);
    barrel.strokeEllipse(18, 32, 22, 8);
    barrel.fillStyle(0xd7a93c);
    barrel.fillRect(10, 13, 16, 10);
    barrel.fillStyle(0x111111);
    barrel.fillTriangle(18, 15, 14, 20, 22, 20);
    barrel.fillRect(16, 20, 4, 3);
    barrel.generateTexture('barrel', 32, 36);
    barrel.destroy();

    // ── Cash pickup ───────────────────────────────────────────────────────
    const insurance = this.make.graphics({ x: 0, y: 0, add: false });
    insurance.fillStyle(0xa8d88d);
    insurance.fillRoundedRect(5, 9, 22, 14, 2);
    insurance.fillStyle(0x7dbb63);
    insurance.fillRoundedRect(9, 5, 22, 14, 2);
    insurance.lineStyle(2, 0x4d7f3d, 1);
    insurance.strokeRoundedRect(9, 5, 22, 14, 2);
    insurance.fillStyle(0xffffff);
    insurance.fillCircle(20, 12, 4);
    insurance.fillStyle(0x4d7f3d);
    insurance.fillRect(19, 9, 2, 6);
    insurance.fillRect(17, 11, 6, 2);
    insurance.fillStyle(0xcfe8ba);
    insurance.fillRoundedRect(11, 21, 18, 10, 2);
    insurance.lineStyle(1, 0x7dbb63, 1);
    insurance.strokeRoundedRect(11, 21, 18, 10, 2);
    insurance.generateTexture('insurance', 36, 40);
    insurance.destroy();

    // ── Navigation Bonus (compass) ────────────────────────────────────────
    const nav = this.make.graphics({ x: 0, y: 0, add: false });
    nav.fillStyle(0x113f8c);
    nav.fillCircle(18, 18, 16);
    nav.lineStyle(2, 0xffffff, 1);
    nav.strokeCircle(18, 18, 14);
    nav.fillStyle(0x2277ff);
    nav.fillCircle(18, 18, 10);
    nav.fillStyle(0xffffff);
    nav.fillTriangle(18, 6, 14, 18, 22, 18);
    nav.fillStyle(0xff3333);
    nav.fillTriangle(18, 30, 14, 18, 22, 18);
    nav.fillStyle(0xf0c040);
    nav.fillRect(17, 2, 2, 5);
    nav.fillStyle(0xffffcc);
    nav.fillCircle(18, 18, 3);
    nav.generateTexture('navbonus', 36, 36);
    nav.destroy();

    // ── Drone strike marker ───────────────────────────────────────────────
    const drone = this.make.graphics({ x: 0, y: 0, add: false });
    drone.lineStyle(3, 0xff2222, 1);
    drone.strokeCircle(24, 24, 20);
    drone.lineBetween(4, 24, 44, 24);
    drone.lineBetween(24, 4, 24, 44);
    drone.lineStyle(2, 0xff6600, 0.8);
    drone.strokeCircle(24, 24, 12);
    drone.generateTexture('dronesight', 48, 48);
    drone.destroy();

    // ── Explosion ─────────────────────────────────────────────────────────
    const expl = this.make.graphics({ x: 0, y: 0, add: false });
    expl.fillStyle(0xff6600);
    expl.fillCircle(32, 32, 28);
    expl.fillStyle(0xffcc00);
    expl.fillCircle(32, 32, 20);
    expl.fillStyle(0xffffff);
    expl.fillCircle(32, 32, 10);
    expl.generateTexture('explosion', 64, 64);
    expl.destroy();

    // ── Background water tiles ─────────────────────────────────────────────
    const water = this.make.graphics({ x: 0, y: 0, add: false });
    water.fillStyle(0x1a6b8a);
    water.fillRect(0, 0, 480, 720);
    // Strait shores
    water.fillStyle(0xd4a85a);  // sandy shore left
    water.fillRect(0, 0, 60, 720);
    water.fillStyle(0xc4983a);
    water.fillRect(0, 0, 40, 720);
    water.fillStyle(0xd4a85a);  // right shore
    water.fillRect(420, 0, 60, 720);
    water.fillStyle(0xc4983a);
    water.fillRect(440, 0, 40, 720);
    // Water shimmer lines
    water.fillStyle(0x2280aa, 0.4);
    for (let y = 0; y < 720; y += 40) {
      water.fillRect(65, y + 10, 350, 3);
      water.fillRect(90, y + 25, 280, 2);
    }
    water.generateTexture('background', 480, 720);
    water.destroy();

    // ── Scrolling water strip ─────────────────────────────────────────────
    const strip = this.make.graphics({ x: 0, y: 0, add: false });
    strip.fillStyle(0x1a6b8a);
    strip.fillRect(0, 0, 480, 80);
    strip.fillStyle(0x2280aa, 0.5);
    strip.fillRect(65, 15, 350, 4);
    strip.fillRect(90, 40, 280, 3);
    strip.fillRect(120, 60, 240, 2);
    strip.generateTexture('waterstrip', 480, 80);
    strip.destroy();

    // ── Particle ──────────────────────────────────────────────────────────
    const particle = this.make.graphics({ x: 0, y: 0, add: false });
    particle.fillStyle(0xffffff);
    particle.fillCircle(4, 4, 4);
    particle.generateTexture('particle', 8, 8);
    particle.destroy();

    // ── HUD panel texture ─────────────────────────────────────────────────
    const hud = this.make.graphics({ x: 0, y: 0, add: false });
    hud.fillStyle(0x0a1628, 0.92);
    hud.fillRect(0, 0, 480, 60);
    hud.lineStyle(2, 0xf0c040, 1);
    hud.strokeRect(1, 1, 478, 58);
    hud.generateTexture('hudpanel', 480, 60);
    hud.destroy();
  }

  create() {
    // Title splash
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.image(width / 2, height / 2, 'background');

    // Title card
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x0a1628, 0.88);
    titleBg.fillRoundedRect(40, height / 2 - 160, 400, 280, 16);
    titleBg.lineStyle(3, 0xf0c040, 1);
    titleBg.strokeRoundedRect(40, height / 2 - 160, 400, 280, 16);

    this.add.text(width / 2, height / 2 - 110, '⚓ HORMUZ HAVOC ⚓', {
      fontSize: '30px',
      fill: '#f0c040',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 60, 'Navigate the Strait of Hormuz\nAvoid mines, rockets & speedboats\nCollect oil barrels, cash & nav bonuses!', {
      fontSize: '14px',
      fill: '#ccddff',
      fontFamily: 'Courier New',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 20, '← / → or A / D to steer', {
      fontSize: '14px',
      fill: '#aaffaa',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Blinking start text
    const startText = this.add.text(width / 2, height / 2 + 80, 'PRESS ANY KEY TO START', {
      fontSize: '17px',
      fill: '#ffffff',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    // Start on any input
    this.input.keyboard.once('keydown', () => this.scene.start('GameScene'));
    this.input.once('pointerdown', () => this.scene.start('GameScene'));
  }
}
