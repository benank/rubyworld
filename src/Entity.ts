export class Entity {
    constructor(
      public x: number,
      public y: number,
      private spriteIndex: number,
    ) {}
  
    update(dt: number) {
      // Add any entity-specific update logic here
    }
  
    render(ctx: CanvasRenderingContext2D, tileSize: number, sprites: { [key: number]: Sprite }) {
      const sprite = sprites[this.spriteIndex]
      if (sprite) {
        sprite.draw(ctx, this.x * tileSize, this.y * tileSize, tileSize, tileSize)
      }
    }
  }
  
  