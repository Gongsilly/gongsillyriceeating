export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;

    // 노란 사각형 캐릭터
    this.sprite = scene.add.rectangle(x, y, 32, 32, 0xffdd00);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCollideWorldBounds(false);

    this.speed = 220;
    this.targetX = x;
    this.targetY = y;
    this.moving = false;
  }

  moveTo(x, y) {
    this.targetX = x;
    this.targetY = y;
    this.moving = true;
  }

  update() {
    if (!this.moving) return;

    const dx = this.targetX - this.sprite.x;
    const dy = this.targetY - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 4) {
      this.sprite.body.setVelocity(0, 0);
      this.sprite.x = this.targetX;
      this.sprite.y = this.targetY;
      this.moving = false;
    } else {
      const vx = (dx / dist) * this.speed;
      const vy = (dy / dist) * this.speed;
      this.sprite.body.setVelocity(vx, vy);
    }
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
