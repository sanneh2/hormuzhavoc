import Phaser from 'phaser';

import PlayerShip from '../objects/PlayerShip.js';
import Mine from '../objects/Mine.js';
import Rocket from '../objects/Rocket.js';
import Speedboat from '../objects/Speedboat.js';
import Collectible, { CollectibleType } from '../objects/Collectible.js';
import Drone, { DroneState } from '../objects/Drone.js';
import { soundManager } from '../objects/SoundManager.js';

const QUIPS = [
  'Insurance premium increased!',
  'Oil price spike!  📈',
  'GPS signal lost!',
  'Captain needs coffee ☕',
  'Piracy risk level: EXTREME',
  'Lloyd\'s of London: No comment.',
  'OPEC meeting in session...',
  'Sanctions loading...',
  'Cargo manifest: classified',
  'Navigation update: good luck',
  'Hull integrity: "fine"',
  'Tanker size: XL  Risk: XXL',
];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init() {
    this.money = 0;
    this.timeAlive = 0;            // ms
    this.isGameOver = false;
    this._difficultyLevel = 0;
    this._difficultyTimer = 0;
    this._spawnTimer = 0;
    this._spawnInterval = 950;     // ms between spawns
    this._collectibleTimer = 0;
    this._collectibleInterval = 2200;
    this._quipTimer = 0;
    this._quipInterval = 8000;
    this._slowmoActive = false;
    this._slowmoDuration = 0;
    this._drones = [];
    this._obstacles = [];
    this._collectibles = [];
    this._enemyDeck = [];
    this._laneXs = [96, 168, 240, 312, 384];
    this._rocketCooldownTimer = 0;
    this._rocketSpawnCooldown = 9000;
    this._rocketUnlockTime = 18000;
    this._rocketUnlockDifficulty = 1;
    this._droneCooldownTimer = 0;
    this._droneSpawnCooldown = 7000;
    this._droneUnlockTime = 15000;
    this._waterY = 0;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Background ────────────────────────────────────────────────────────
    this._bg = this.add.image(W / 2, H / 2, 'background').setDepth(0);

    // Scrolling water strips for parallax feel
    this._waterStrips = [];
    for (let i = 0; i < 10; i++) {
      const strip = this.add.image(W / 2, i * 80, 'waterstrip').setDepth(1).setAlpha(0.45);
      this._waterStrips.push(strip);
    }

    // ── Physics groups ────────────────────────────────────────────────────
    this._obstacleGroup = this.physics.add.group();
    this._collectibleGroup = this.physics.add.group();

    // ── Player ────────────────────────────────────────────────────────────
    this._player = new PlayerShip(this, W / 2, H - 110);
    this._player.setDepth(10);

    // ── Input ─────────────────────────────────────────────────────────────
    this._cursors = this.input.keyboard.createCursorKeys();
    this._wasd = {
      left:  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      up:    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
    };
    this._muteKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);

    // ── Overlaps ──────────────────────────────────────────────────────────
    this.physics.add.overlap(
      this._player,
      this._obstacleGroup,
      this._handleHit,
      null,
      this
    );

    this.physics.add.overlap(
      this._player,
      this._collectibleGroup,
      this._handleCollect,
      null,
      this
    );

    // ── Wake particles behind ship ────────────────────────────────────────
    this._wakeEmitter = this.add.particles(0, 0, 'particle', {
      speed: { min: 20, max: 60 },
      angle: { min: 160, max: 200 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 600,
      frequency: 60,
      tint: 0xaaddff,
    });
    this._wakeEmitter.setDepth(9);
    this._wakeEmitter.startFollow(this._player, 0, 50);

    // ── Sound engine ──────────────────────────────────────────────────────
    soundManager.startEngine();

    // ── UI Scene ──────────────────────────────────────────────────────────
    this.scene.launch('UIScene', { gameScene: this });

    // ── Entrance tween ────────────────────────────────────────────────────
    this._player.y = H + 80;
    this.tweens.add({
      targets: this._player,
      y: H - 110,
      duration: 900,
      ease: 'Back.easeOut',
      onComplete: () => {
        this._spawnOpeningWave();
      }
    });
  }

  // ── Spawning ────────────────────────────────────────────────────────────
  _spawnOpeningWave() {
    const openingWave = ['mine', 'boat'];
    openingWave.forEach((type, index) => {
      this.time.delayedCall(220 + index * 320, () => this._spawnObstacle(type));
    });
  }

  _spawnObstacle(forcedType = null) {
    const W = this.scale.width;
    const diff = this._difficultyLevel;
    const baseSpeed = 130 + diff * 18;
    let type = forcedType || this._nextObstacleType();

    if (type === 'rocket' && !this._canSpawnRocket()) {
      type = this._getFallbackObstacleType();
    }

    if (type === 'drone' && !this._canSpawnDrone()) {
      type = this._getFallbackObstacleType();
    }

    if (type === 'mine') {
      this._spawnMine(W, baseSpeed);
      return;
    }

    if (type === 'rocket') {
      this._spawnRocket(W, baseSpeed);
      return;
    }

    if (type === 'boat') {
      this._spawnSpeedboat(W, baseSpeed);
      return;
    }

    this._spawnDrone(W);
  }

  _nextObstacleType() {
    if (this._enemyDeck.length === 0) {
      this._enemyDeck = this._buildEnemyDeck();
    }

    return this._enemyDeck.pop();
  }

  _buildEnemyDeck() {
    const d = this._difficultyLevel;
    const deck = ['mine', 'boat', 'drone'];

    if (d >= 1) deck.push('boat');
    if (d >= 1) deck.push('rocket');
    if (d >= 2) deck.push('mine');
    if (d >= 3) deck.push('drone');
    if (d >= 4) deck.push('rocket');
    if (d >= 5) deck.push('boat');
    if (d >= 6) deck.push('mine');
    if (d >= 7) deck.push('rocket');
    if (d >= 8) deck.push('drone');

    return Phaser.Utils.Array.Shuffle(deck);
  }

  _canSpawnRocket() {
    const activeRocketCount = this._obstacles.filter(obstacle => obstacle.active && obstacle instanceof Rocket).length;

    if (this.timeAlive < this._rocketUnlockTime) return false;
    if (this._difficultyLevel < this._rocketUnlockDifficulty) return false;
    if (this._rocketCooldownTimer > 0) return false;

    return activeRocketCount === 0;
  }

  _getFallbackObstacleType() {
    const fallbackDeck = ['mine', 'boat'];

    if (this._difficultyLevel >= 4) {
      fallbackDeck.push('boat');
    }

    return Phaser.Utils.Array.GetRandom(fallbackDeck);
  }

  _canSpawnDrone() {
    const activeDroneCount = this._drones.filter(drone => drone.active && drone.state !== DroneState.DONE).length;

    if (this.timeAlive < this._droneUnlockTime) return false;
    if (this._droneCooldownTimer > 0) return false;

    return activeDroneCount === 0;
  }

  _getNearestLaneIndex(x) {
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    this._laneXs.forEach((laneX, index) => {
      const distance = Math.abs(laneX - x);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }

  _getLaneX(index, jitter = 0) {
    const clampedIndex = Phaser.Math.Clamp(index, 0, this._laneXs.length - 1);
    return this._laneXs[clampedIndex] + Phaser.Math.Between(-jitter, jitter);
  }

  _spawnMine(W, speed) {
    const playerLane = this._getNearestLaneIndex(this._player ? this._player.x : W / 2);
    const laneOffset = Phaser.Math.RND.pick([-1, 0, 1]);
    const laneIndex = Phaser.Math.Clamp(playerLane + laneOffset, 0, this._laneXs.length - 1);
    const x = this._getLaneX(laneIndex, 6);
    const mine = new Mine(this, x, 74, speed * 0.82, this._player, {
      laneX: this._laneXs[laneIndex],
      swayAmplitude: 18,
      swaySpeed: Phaser.Math.FloatBetween(0.0012, 0.0018),
    });
    mine.setDepth(5);
    this._obstacleGroup.add(mine);
    this._obstacles.push(mine);
  }

  _spawnRocket(W, speed) {
    const difficulty = this._difficultyLevel;
    const playerLane = this._getNearestLaneIndex(this._player ? this._player.x : W / 2);
    const laneChoices = difficulty === 0 ? [Math.max(0, playerLane - 2), Math.min(this._laneXs.length - 1, playerLane + 2)] : [0, 1, 2, 3, 4];
    const laneIndex = Phaser.Math.RND.pick(laneChoices);
    const x = this._getLaneX(laneIndex, 4);
    const rocket = new Rocket(this, x, -70, speed * Phaser.Math.Clamp(0.8 + difficulty * 0.05, 0.8, 1.05), this._player, {
      trackTimer: Phaser.Math.Clamp(1180 - difficulty * 55, 780, 1180),
      trackingGain: Phaser.Math.Clamp(1.05 + difficulty * 0.14, 1.05, 2.7),
      maxTrackSpeed: Phaser.Math.Clamp(90 + difficulty * 16, 90, 210),
      approachSpeed: Phaser.Math.Clamp(speed * 0.1, 16, 36),
      launchDelay: Phaser.Math.Clamp(260 - difficulty * 12, 170, 260),
    });
    rocket.setDepth(5);
    this._obstacleGroup.add(rocket);
    this._obstacles.push(rocket);
    this._rocketCooldownTimer = this._rocketSpawnCooldown;
  }

  _spawnSpeedboat(W, speed) {
    const x = Phaser.Math.Between(90, 390);
    const boat = new Speedboat(this, x, -20, speed, this._player);
    boat.setDepth(5);
    this._obstacleGroup.add(boat);
    this._obstacles.push(boat);
  }

  _spawnDrone(W) {
    const x = Phaser.Math.Clamp(
      this._player.x + Phaser.Math.Between(-56, 56),
      90, 390
    );
    const y = Phaser.Math.Clamp(
      this._player.y + Phaser.Math.Between(-24, 24),
      120, this.scale.height - 90
    );
    const drone = new Drone(this, x, y, this._player, {
      warningDuration: 1750,
      trackingDuration: 1180,
      blastRadius: 54,
      dangerDuration: 170,
    });
    drone.setDepth(12);
    this._drones.push(drone);
    this._droneCooldownTimer = this._droneSpawnCooldown;

    // Repeating beep during the warning phase
    const beepCount = Math.floor(1750 / 420);
    this.time.addEvent({
      delay: 420,
      repeat: beepCount,
      callback: () => {
        if (drone.active && drone.state !== DroneState.DONE) soundManager.playDroneBeep();
      },
    });
  }

  _spawnCollectible() {
    const laneIndex = Phaser.Math.Between(0, this._laneXs.length - 1);
    const x = this._getLaneX(laneIndex, 4);
    const rand = Math.random();
    let type;
    if (rand < 0.55)      type = CollectibleType.BARREL;
    else if (rand < 0.82) type = CollectibleType.INSURANCE;
    else                  type = CollectibleType.NAVBONUS;

    const c = new Collectible(this, x, 74, type);
    c.setDepth(6);
    this._collectibleGroup.add(c);
    this._collectibles.push(c);
  }

  // ── Collision handlers ──────────────────────────────────────────────────
  _handleHit(player, obstacle) {
    if (player.isInvincible || this.isGameOver) return;
    this._triggerExplosion(obstacle.x, obstacle.y);
    obstacle.destroy();
    const idx = this._obstacles.indexOf(obstacle);
    if (idx !== -1) this._obstacles.splice(idx, 1);
    this._damagePlayer();
  }

  _handleCollect(player, collectible) {
    if (this.isGameOver) return;
    const value = collectible.getValue();
    const isSlowmo = collectible.isSlowmo();
    this.money += value;

    this._showFloatingText(collectible.x, collectible.y,
      isSlowmo ? 'SLOW-MO!' : `+$${value}`,
      isSlowmo ? '#aaccff' : '#f0c040');

    if (isSlowmo) this._activateSlowmo();
    soundManager.playCollect();

    collectible.destroy();
    const idx = this._collectibles.indexOf(collectible);
    if (idx !== -1) this._collectibles.splice(idx, 1);
  }

  _damagePlayer() {
    this.cameras.main.shake(250, 0.018);
    this.cameras.main.flash(200, 255, 50, 50);
    this._player.makeInvincible(2000);
    this._triggerExplosion(this._player.x, this._player.y);

    // End game after brief pause
    this.time.delayedCall(500, () => {
      this._endGame();
    });
  }

  _endGame() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this._wakeEmitter.stop();
    soundManager.stopEngine();

    // Final explosion on player
    this._triggerExplosion(this._player.x, this._player.y, 2.5);
    this._player.setVisible(false);

    const highScore = parseInt(localStorage.getItem('hormuz_highscore') || '0');
    const newHigh = Math.max(highScore, Math.floor(this.timeAlive / 1000));
    localStorage.setItem('hormuz_highscore', newHigh.toString());

    const highMoney = parseInt(localStorage.getItem('hormuz_highmoney') || '0');
    const newHighMoney = Math.max(highMoney, this.money);
    localStorage.setItem('hormuz_highmoney', newHighMoney.toString());

    this.time.delayedCall(900, () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', {
        timeAlive: this.timeAlive,
        money: this.money,
        highScore: newHigh,
        highMoney: newHighMoney
      });
    });
  }

  // ── Visual effects ──────────────────────────────────────────────────────
  _triggerExplosion(x, y, scale = 1) {
    soundManager.playExplosion(scale > 1);
    const expl = this.add.image(x, y, 'explosion').setDepth(15).setScale(scale * 0.3);
    this.tweens.add({
      targets: expl,
      scale: scale * 2,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => expl.destroy()
    });

    // Particle burst
    const burst = this.add.particles(x, y, 'particle', {
      speed: { min: 60, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      quantity: 18,
      tint: [0xff6600, 0xffcc00, 0xff2200],
    });
    burst.setDepth(15);
    this.time.delayedCall(300, () => burst.destroy());
  }

  _showFloatingText(x, y, text, color = '#ffffff') {
    const t = this.add.text(x, y, text, {
      fontSize: '16px',
      fill: color,
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: t,
      y: y - 55,
      alpha: 0,
      duration: 1100,
      ease: 'Power2',
      onComplete: () => t.destroy()
    });
  }

  _showQuip() {
    const W = this.scale.width;
    const quip = Phaser.Utils.Array.GetRandom(QUIPS);
    const box = this.add.graphics().setDepth(18);
    box.fillStyle(0x0a1628, 0.88);
    box.fillRoundedRect(60, 70, 360, 36, 8);
    box.lineStyle(1.5, 0xf0c040);
    box.strokeRoundedRect(60, 70, 360, 36, 8);

    const txt = this.add.text(W / 2, 88, quip, {
      fontSize: '13px',
      fill: '#f0c040',
      fontFamily: 'Courier New'
    }).setOrigin(0.5).setDepth(19);

    this.tweens.add({
      targets: [box, txt],
      alpha: 0,
      delay: 2800,
      duration: 600,
      onComplete: () => { box.destroy(); txt.destroy(); }
    });
  }

  _activateSlowmo() {
    if (this._slowmoActive) return;
    this._slowmoActive = true;
    this._slowmoDuration = 4000;
    this.physics.world.timeScale = 0.4;
    this.time.timeScale = 0.4;
    soundManager.playSlowmo();
    this._showFloatingText(this.scale.width / 2, 300, '⏱ SLOW MOTION ⏱', '#aaccff');
  }

  // ── Difficulty ──────────────────────────────────────────────────────────
  _increaseDifficulty() {
    this._difficultyLevel++;
    this._spawnInterval = Math.max(400, this._spawnInterval - 100);
    this._collectibleInterval = Math.max(1200, this._collectibleInterval - 80);
    this._showQuip();

    if (this._difficultyLevel >= 8) {
      this._showFloatingText(this.scale.width / 2, 360, '🔥 CHAOS MODE 🔥', '#ff3333');
    }
  }

  // ── Update loop ─────────────────────────────────────────────────────────
  update(time, delta) {
    if (this.isGameOver) return;

    const realDelta = delta;
    this.timeAlive += realDelta;

    // ── Mute toggle ──
    if (Phaser.Input.Keyboard.JustDown(this._muteKey)) {
      soundManager.toggle();
      this._showFloatingText(this.scale.width / 2, 200,
        soundManager.isMuted() ? '🔇 MUTED' : '🔊 SOUND ON', '#aaccff');
    }

    // ── Player update ──
    this._player.update(this._cursors, this._wasd, realDelta);

    // ── Water parallax ──
    this._waterY = (this._waterY + realDelta * 0.12) % 80;
    this._waterStrips.forEach((strip, i) => {
      strip.y = ((i * 80) + this._waterY) % (80 * 10) - 40;
    });

    // ── Spawn obstacles ──
    this._spawnTimer += realDelta;
    if (this._spawnTimer >= this._spawnInterval) {
      this._spawnTimer = 0;
      // In chaos mode spawn multiple
      const count = this._difficultyLevel >= 8 ? Phaser.Math.Between(2, 4) : 1;
      for (let i = 0; i < count; i++) this._spawnObstacle();
    }

    // ── Spawn collectibles ──
    this._collectibleTimer += realDelta;
    if (this._collectibleTimer >= this._collectibleInterval) {
      this._collectibleTimer = 0;
      this._spawnCollectible();
    }

    // ── Difficulty ramp every 20 seconds ──
    this._difficultyTimer += realDelta;
    if (this._difficultyTimer >= 20000) {
      this._difficultyTimer = 0;
      this._increaseDifficulty();
    }

    // ── Random quips ──
    this._quipTimer += realDelta;
    if (this._quipTimer >= this._quipInterval) {
      this._quipTimer = 0;
      this._quipInterval = Phaser.Math.Between(7000, 14000);
      this._showQuip();
    }

    // ── Slowmo cooldown ──
    if (this._slowmoActive) {
      this._slowmoDuration -= realDelta;
      if (this._slowmoDuration <= 0) {
        this._slowmoActive = false;
        this.physics.world.timeScale = 1;
        this.time.timeScale = 1;
      }
    }

    if (this._rocketCooldownTimer > 0) {
      this._rocketCooldownTimer = Math.max(0, this._rocketCooldownTimer - realDelta);
    }

    if (this._droneCooldownTimer > 0) {
      this._droneCooldownTimer = Math.max(0, this._droneCooldownTimer - realDelta);
    }

    // ── Update obstacles ──
    this._obstacles = this._obstacles.filter(o => {
      if (!o.active) return false;
      if (o.update) o.update(realDelta);
      if (o.y > this.scale.height + 60) {
        o.destroy();
        return false;
      }
      return true;
    });

    // ── Update collectibles ──
    this._collectibles = this._collectibles.filter(c => {
      if (!c.active) return false;
      if (c.update) c.update(realDelta);
      if (c.y > this.scale.height + 60) {
        c.destroy();
        return false;
      }
      return true;
    });

    // ── Update drones ──
    this._drones = this._drones.filter(d => {
      if (!d.active) return false;
      d.update(realDelta);

      // Check drone explosion contact with player
      if (d.isDangerous && !this._player.isInvincible) {
        const dist = Phaser.Math.Distance.Between(d.x, d.y, this._player.x, this._player.y);
        if (dist < d.getBlastRadius()) {
          this._damagePlayer();
        }
      }

      if (d.state === DroneState.DONE) {
        d.destroy();
        return false;
      }
      return true;
    });
  }

  getMoney() { return this.money; }
  getTimeAlive() { return this.timeAlive; }
  getDifficultyLevel() { return this._difficultyLevel; }
}
