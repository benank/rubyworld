import { Entity } from "./Entity"

export class RandomPlayer extends Entity {
  private moveInterval = 1000 // Move every 1 second
  private lastMoveTime = 0

  constructor(
    x: number,
    y: number,
    private mapWidth: number,
    private mapHeight: number,
  ) {
    super(x, y, 0) // We'll override the render method, so spriteIndex doesn't matter
  }

  update(dt: number) {
    this.lastMoveTime += dt * 200
    if (this.lastMoveTime >= this.moveInterval) {
      this.move()
      this.lastMoveTime = 0
    }
  }

  private move() {
    const direction = Math.floor(Math.random() * 4)
    let newX = this.x
    let newY = this.y

    switch (direction) {
      case 0:
        newY--
        break // Up
      case 1:
        newY++
        break // Down
      case 2:
        newX--
        break // Left
      case 3:
        newX++
        break // Right
    }

    // Ensure the new position is within the map bounds
    if (newX >= 0 && newX < this.mapWidth && newY >= 0 && newY < this.mapHeight) {
      this.x = newX
      this.y = newY
    }
  }

  render(ctx: CanvasRenderingContext2D, tileSize: number) {
    ctx.fillStyle = "blue"
    ctx.fillRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize)
  }
}

