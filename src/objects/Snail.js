export default class Snail {
  constructor(scene, x, y) {
    this.scene = scene;
    this.hp = 30;
    this.maxHp = 30;
    this.alive = true;
    this.speed = 40;

    // 파란 달팽이 몸통
    this.sprite = scene.add.ellipse(x, y, 28, 20, 0x4488ff);
    // 달팽이 껍질
    this.shell = scene.add.ellipse(x - 4, y - 4, 16, 16, 0x2255cc);

    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(false);

    // 체력바 배경
    this.hpBarBg = scene.add.rectangle(x, y - 20, 30, 4, 0x333333);
    this.hpBar   = scene.add.rectangle(x - 0, y - 20, 30, 4, 0x00ff44);

    // AI 랜덤 이동 타이머
    this.moveTimer = scene.time.addEvent({
      delay: Phaser.Math.Between(1500, 3000),
      callback: this.pickNewTarget,
      callbackScope: this,
      loop: true,
    });

    this.targetX = x;
    this.targetY = y;
  }

  pickNewTarget() {
    if (!this.alive) return;
    this.targetX = this.sprite.x + Phaser.Math.Between(-120, 120);
    this.targetY = this.sprite.y + Phaser.Math.Between(-120, 120);
  }

  takeDamage(amount, damageTexts) {
    if (!this.alive) return;
    this.hp -= amount;

    // 빨간 데미지 텍스트
    const txt = this.scene.add.text(this.sprite.x, this.sprite.y - 10, `-${amount}`, {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ff3333',
      stroke: '#000',
      strokeThickness: 3,
    }).setDepth(10);

    this.scene.tweens.add({
      targets: txt,
      y: txt.y - 40,
      alpha: 0,
      duration: 900,
      onComplete: () => txt.destroy(),
    });

    if (this.hp <= 0) this.die(damageTexts);
  }

  die(damageTexts) {
    this.alive = false;
    this.sprite.destroy();
    this.shell.destroy();
    this.hpBar.destroy();
    this.hpBarBg.destroy();
    this.moveTimer.remove();

    // 드롭 여부 (20% 확률)
    if (Math.random() < 0.20) {
      this.scene.spawnItem(this.sprite.x, this.sprite.y);
    }
  }

  update() {
    if (!this.alive) return;

    const dx = this.targetX - this.sprite.x;
    const dy = this.targetY - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      this.sprite.body.setVelocity((dx / dist) * this.speed, (dy / dist) * this.speed);
    } else {
      this.sprite.body.setVelocity(0, 0);
    }

    // 껍질 따라오기
    this.shell.x = this.sprite.x - 4;
    this.shell.y = this.sprite.y - 5;

    // 체력바 업데이트
    const ratio = Math.max(0, this.hp / this.maxHp);
    this.hpBarBg.x = this.sprite.x;
    this.hpBarBg.y = this.sprite.y - 20;
    this.hpBar.x   = this.sprite.x - 15 + (30 * ratio) / 2;
    this.hpBar.y   = this.sprite.y - 20;
    this.hpBar.width = 30 * ratio;
  }
}
