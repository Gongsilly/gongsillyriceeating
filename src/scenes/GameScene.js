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

    // ── 마우스 왼쪽 클릭 → 이동 ──
    this.input.on('pointerdown', (ptr) => {
      if (ptr.leftButtonDown()) {
        const wx = ptr.worldX;
        const wy = ptr.worldY;
        // 아이템 위가 아닐 때만 이동
        this.player.moveTo(wx, wy);
      }
    });

    // ── 마우스 우클릭 → 매직클로 ──
    this.input.on('pointerdown', (ptr) => {
      if (ptr.rightButtonDown()) {
        const wx = ptr.worldX;
        const wy = ptr.worldY;
        const claw = new MagicClaw(this, this.player.x, this.player.y, wx, wy);
        this.claws.push(claw);
        this.hitSnails = new Set();
      }
    });

    // 우클릭 기본 컨텍스트 메뉴 막기
    this.game.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // ── UI 텍스트 (카메라 고정) ──
    this.uiText = this.add.text(12, 12, '', {
      fontSize: '13px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 6, y: 4 },
    }).setScrollFactor(0).setDepth(50);
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
      `좌클릭: 이동  |  우클릭: 매직클로`
    );
  }
}
