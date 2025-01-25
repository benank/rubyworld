import { playerCanMoveTo } from "./collision";

export class Player {
  public x: number;
  public y: number;
  private targetX: number;
  private targetY: number;
  private moveSpeed = 3; // Tiles per second
  private isMoving = false;
  private movementProgress = 0;
  private currentDirection: string | null = null;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
  }

  update(dt: number) {
    if (this.isMoving) {
      this.movementProgress += this.moveSpeed * dt;
      if (this.movementProgress >= 1) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.isMoving = false;
        this.movementProgress = 0;

        if (this.currentDirection) {
          this.startMove(this.currentDirection);
        }
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, tileSize: number) {
    const drawX = this.isMoving
      ? (this.x * (1 - this.movementProgress) +
          this.targetX * this.movementProgress) *
        tileSize
      : this.x * tileSize;
    const drawY = this.isMoving
      ? (this.y * (1 - this.movementProgress) +
          this.targetY * this.movementProgress) *
        tileSize
      : this.y * tileSize;

    ctx.fillStyle = "red";
    ctx.fillRect(drawX, drawY, tileSize, tileSize);
  }

  handleInput(key: string, isKeyDown: boolean) {
    if (isKeyDown) {
      this.currentDirection = key;
      if (!this.isMoving) {
        this.startMove(key);
      }
    } else if (key === this.currentDirection) {
      this.currentDirection = null;
    }
  }

  private startMove(direction: string) {
    if (this.isMoving) return;

    let dx = 0;
    let dy = 0;

    switch (direction) {
      case "ArrowUp":
      case "w":
      case "W":
        dy = -1;
        break;
      case "ArrowDown":
      case "s":
      case "S":
        dy = 1;
        break;
      case "ArrowLeft":
      case "a":
      case "A":
        dx = -1;
        break;
      case "ArrowRight":
      case "d":
      case "D":
        dx = 1;
        break;
    }

    if (dx !== 0 || dy !== 0) {
      const newX = this.x + dx;
      const newY = this.y + dy;
      if (playerCanMoveTo(newX, newY)) {
        this.targetX = newX;
        this.targetY = newY;
        this.isMoving = true;
        this.movementProgress = 0;
      }
    }
  }

  getPosition() {
    const x = this.isMoving
      ? this.x * (1 - this.movementProgress) +
        this.targetX * this.movementProgress
      : this.x;
    const y = this.isMoving
      ? this.y * (1 - this.movementProgress) +
        this.targetY * this.movementProgress
      : this.y;
    return { x, y };
  }
}
