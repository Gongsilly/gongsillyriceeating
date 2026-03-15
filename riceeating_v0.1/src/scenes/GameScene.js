import Player     from '../objects/Player.js';
import Snail      from '../objects/Snail.js';
import MagicClaw  from '../objects/MagicClaw.js';
import Item       from '../objects/Item.js';

const MAP_W = 3200;
const MAP_H = 2400;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.snails    = [];
    this.claws     = [];
    this.items     = [];
    this.inventory = [];
    this.hitSnails = new Set(); // 클로 한 번에 중복 히트 방지
  }

  create() {
    // ── 맵 배경 타일 그리기 ──
    const mapGfx = this.add.graphics();
    mapGfx.fillStyle(0x0d1b2a, 1);
    mapGfx.fillRect(0, 0, MAP_W, MAP_H);

    // 그리드 패턴
    mapGfx.lineStyle(1, 0x1a2a3a, 0.6);
    for (let x = 0; x < MAP_W; x += 64) {
      mapGfx.lineBetween(x, 0, x, MAP_H);
    }
    for (let y = 0; y < MAP_H; y += 64) {
      mapGfx.lineBetween(0, y, MAP_W, y);
    }

    // ── 물리 월드 경계 ──
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);

    // ── 플레이어 ──
    this.player = new Player(this, MAP_W / 2, MAP_H / 2);
    this.player.sprite.setDepth(5);

    // ── 카메라 ──
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);

    // ── 달팽이 30마리 스폰 ──
    for (let i = 0; i < 30; i++) {
      const sx = Phaser.Math.Between(200, MAP_W - 200);
      const sy = Phaser.Math.Between(200, MAP_H - 200);
      this.snails.push(new Snail(this, sx, sy));
    }

    // 우클릭 기본 컨텍스트 메뉴 막기
    this.game.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // ── 입력 처리 (PC + 모바일 통합) ──
    this._holdTimer = null;
    this._holdFired = false;

    this.input.on('pointerdown', (ptr) => {
      this._holdFired = false;

      // 꾹 누르기 타이머 → 매직클로
      this._holdTimer = this.time.delayedCall(400, () => {
        this._holdFired = true;
        const wx = ptr.worldX;
        const wy = ptr.worldY;
        const claw = new MagicClaw(this, this.player.x, this.player.y, wx, wy);
        this.claws.push(claw);
        this.hitSnails = new Set();
        // 진동 피드백 (모바일)
        if (navigator.vibrate) navigator.vibrate(40);
      });
    });

    this.input.on('pointerup', (ptr) => {
      // 타이머 취소
      if (this._holdTimer) {
        this._holdTimer.remove();
        this._holdTimer = null;
      }
      // 짧게 탭 → 이동 (PC 좌클릭 포함)
      if (!this._holdFired && !ptr.rightButtonReleased()) {
        this.player.moveTo(ptr.worldX, ptr.worldY);
      }
    });

    // PC 우클릭 → 매직클로 (별도 유지)
    this.input.on('pointerdown', (ptr) => {
      if (ptr.rightButtonDown()) {
        if (this._holdTimer) { this._holdTimer.remove(); this._holdTimer = null; }
        this._holdFired = true;
        const claw = new MagicClaw(this, this.player.x, this.player.y, ptr.worldX, ptr.worldY);
        this.claws.push(claw);
        this.hitSnails = new Set();
      }
    });

    // ── UI 텍스트 (카메라 고정) ──
    this.uiText = this.add.text(12, 12, '', {
      fontSize: '13px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 6, y: 4 },
    }).setScrollFactor(0).setDepth(50);

    // ── 모바일 가상 버튼 ──
    this._buildMobileButtons();
  }

  _buildMobileButtons() {
    const W = this.scale.width;
    const H = this.scale.height;
    const btnSize = 56;
    const pad = 20;

    // ── 왼쪽 십자키 ──
    const dpadCx = pad + btnSize * 1.5;
    const dpadCy = H - pad - btnSize * 1.5;

    const dirs = [
      { label: '▲', dx:  0, dy: -1, ox:  0,       oy: -btnSize },
      { label: '▼', dx:  0, dy:  1, ox:  0,       oy:  btnSize },
      { label: '◀', dx: -1, dy:  0, ox: -btnSize, oy:  0 },
      { label: '▶', dx:  1, dy:  0, ox:  btnSize, oy:  0 },
    ];

    dirs.forEach(({ label, dx, dy, ox, oy }) => {
      const bx = dpadCx + ox;
      const by = dpadCy + oy;

      const bg = this.add.rectangle(bx, by, btnSize - 4, btnSize - 4, 0xffffff, 0.15)
        .setScrollFactor(0).setDepth(60).setInteractive();
      const txt = this.add.text(bx, by, label, {
        fontSize: '20px', color: '#ffffff',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(61);

      const press = () => {
        bg.setFillStyle(0xffffff, 0.35);
        this.player.setPadDirection(dx, dy);
      };
      const release = () => {
        bg.setFillStyle(0xffffff, 0.15);
        this.player.setPadDirection(0, 0);
      };

      bg.on('pointerdown',  press);
      bg.on('pointerup',    release);
      bg.on('pointerout',   release);
    });

    // 십자키 중앙 장식
    this.add.rectangle(dpadCx, dpadCy, btnSize - 4, btnSize - 4, 0xffffff, 0.08)
      .setScrollFactor(0).setDepth(60);

    // ── 오른쪽 공격 버튼 (매직클로) ──
    const atkX = W - pad - btnSize;
    const atkY = H - pad - btnSize;

    const atkBg = this.add.circle(atkX, atkY, btnSize * 0.6, 0x9933ff, 0.7)
      .setScrollFactor(0).setDepth(60).setInteractive();
    const atkTxt = this.add.text(atkX, atkY, '✦\n매직클로', {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(61);

    atkBg.on('pointerdown', () => {
      atkBg.setFillStyle(0xcc44ff, 0.9);
      if (navigator.vibrate) navigator.vibrate(30);

      // 이동 방향 또는 오른쪽으로 클로 발사
      const tx = this.player.x + this.player.facingX * 300;
      const ty = this.player.y + this.player.facingY * 300;
      const claw = new MagicClaw(this, this.player.x, this.player.y, tx, ty);
      this.claws.push(claw);
      this.hitSnails = new Set();
    });
    atkBg.on('pointerup',  () => atkBg.setFillStyle(0x9933ff, 0.7));
    atkBg.on('pointerout', () => atkBg.setFillStyle(0x9933ff, 0.7));
  }

  spawnItem(x, y) {
    this.items.push(new Item(this, x, y));
  }

  update(time, delta) {
    this.player.update();

    // 달팽이 업데이트
    this.snails = this.snails.filter(s => s.alive);
    this.snails.forEach(s => s.update());

    // 매직클로 업데이트 & 히트 체크
    this.claws = this.claws.filter(c => c.alive);
    this.claws.forEach(claw => {
      claw.update(delta);
      this.snails.forEach(snail => {
        const key = `${claw}:${snail}`;
        if (!this.hitSnails.has(key) && claw.checkHit(snail)) {
          this.hitSnails.add(key);
          const dmg = Phaser.Math.Between(12, 25);
          snail.takeDamage(dmg);
        }
      });
    });

    // 아이템 툴팁 위치 갱신
    this.items = this.items.filter(i => !i.picked);
    this.items.forEach(i => i.updateTooltipPos());

    // UI 업데이트
    const alive = this.snails.filter(s => s.alive).length;
    this.uiText.setText(
      `[RiceEating RPG v0.1]\n` +
      `🐌 달팽이: ${alive}마리  🎒 인벤토리: ${this.inventory.length}칸\n` +
      `탭: 이동  |  꾹 누르기 / 우클릭: 매직클로`
    );
  }
}
