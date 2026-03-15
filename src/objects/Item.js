export default class Item {
  constructor(scene, x, y) {
    this.scene = scene;
    this.picked = false;

    this.data = {
      name: '나무 스태프',
      type: '무기',
      attackPower: Phaser.Math.Between(8, 15),
      magicPower: Phaser.Math.Between(12, 22),
      description: '마법사가 쓰는 기본 스태프',
    };

    // 스태프 아이콘 (갈색 막대기)
    this.sprite = scene.add.rectangle(x, y, 8, 22, 0x8B4513).setDepth(2);
    this.gem    = scene.add.circle(x, y - 13, 5, 0x9933ff).setDepth(3);

    // 반짝이는 효과
    scene.tweens.add({
      targets: [this.sprite, this.gem],
      alpha: 0.4,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    // 툴팁 (기본 숨김)
    this.tooltip = scene.add.container(x + 16, y - 60).setDepth(20).setVisible(false);
    const bg = scene.add.rectangle(0, 0, 160, 80, 0x111122, 0.92).setStrokeStyle(1, 0xaa66ff);
    const title = scene.add.text(-72, -32, `⚔ ${this.data.name}`, { fontSize: '13px', color: '#ffcc44', fontStyle: 'bold' });
    const line1 = scene.add.text(-72, -12, `공격력: ${this.data.attackPower}`, { fontSize: '11px', color: '#cccccc' });
    const line2 = scene.add.text(-72,   4, `마법력: ${this.data.magicPower}`,  { fontSize: '11px', color: '#aaddff' });
    const line3 = scene.add.text(-72,  20, this.data.description,              { fontSize: '10px', color: '#888888' });
    const hint  = scene.add.text(-72,  34, '[ 클릭하여 줍기 ]',                { fontSize: '10px', color: '#55ff55' });
    this.tooltip.add([bg, title, line1, line2, line3, hint]);

    // 인터랙티브
    this.sprite.setInteractive();
    this.sprite.on('pointerover',  () => this.tooltip.setVisible(true));
    this.sprite.on('pointerout',   () => this.tooltip.setVisible(false));
    this.sprite.on('pointerdown',  (ptr) => {
      if (ptr.leftButtonDown()) this.pickup();
    });
  }

  pickup() {
    if (this.picked) return;
    this.picked = true;
    this.tooltip.setVisible(false);

    console.log('[인벤토리 추가]', this.data);
    this.scene.inventory.push({ ...this.data });
    console.log('[현재 인벤토리]', this.scene.inventory);

    // 줍기 이펙트
    this.scene.tweens.add({
      targets: [this.sprite, this.gem],
      y: '-=30',
      alpha: 0,
      duration: 400,
      onComplete: () => {
        this.sprite.destroy();
        this.gem.destroy();
        this.tooltip.destroy();
      },
    });
  }

  updateTooltipPos() {
    this.tooltip.x = this.sprite.x + 16;
    this.tooltip.y = this.sprite.y - 60;
  }
}
