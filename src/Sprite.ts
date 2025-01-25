export class Sprite {
    constructor(
      private image: HTMLImageElement,
      private sourceX: number,
      private sourceY: number,
      private width: number,
      private height: number,
    ) {}
  
    draw(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
      ctx.drawImage(this.image, this.sourceX, this.sourceY, this.width, this.height, x, y, width, height)
    }
  }
  
  