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

    // 십자키용 방향 벡터
    this.padDx = 0;
    this.padDy = 0;

    // 마지막 이동 방향 (스킬 발사용)
    this.facingX = 1;
    this.facingY = 0;
  }

  moveTo(x, y) {
    this.padDx = 0;
    this.padDy = 0;
    this.targetX = x;
    this.targetY = y;
    this.moving = true;
  }

  // 십자키 방향 설정 (0이면 정지)
  setPadDirection(dx, dy) {
    this.padDx = dx;
    this.padDy = dy;
    if (dx !== 0 || dy !== 0) {
      this.moving = false; // 클릭 이동 취소
      const len = Math.sqrt(dx * dx + dy * dy);
      this.facingX = dx / len;
      this.facingY = dy / len;
    }
  }

  update() {
    // 십자키 입력 우선
    if (this.padDx !== 0 || this.padDy !== 0) {
      const len = Math.sqrt(this.padDx * this.padDx + this.padDy * this.padDy);
      this.sprite.body.setVelocity(
        (this.padDx / len) * this.speed,
        (this.padDy / len) * this.speed,
      );
      return;
    }

    if (!this.moving) {
      this.sprite.body.setVelocity(0, 0);
      return;
    }

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
      this.facingX = dx / dist;
      this.facingY = dy / dist;
    }
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
