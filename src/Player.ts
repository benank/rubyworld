import { ServerPlayer } from "./packets";

export class Player {
  public readonly id: string;
  public readonly name: string;
  public readonly spriteIndex: number;
  public x: number;
  public y: number;
  protected targetX: number;
  protected targetY: number;
  protected _moveSpeed = 3; // Tiles per second
  protected isMoving = false;
  protected isLocalPlayer = false;
  protected movementProgress = 0;
  protected facingDirection: "left" | "right" | "up" | "down" = "down";
  protected speedUp = false;

  protected sprites: {
    [key: string]: HTMLImageElement[];
  } = {
    left: [],
    right: [],
    up: [],
    down: [],
  };

  protected loadedSprites = false;

  constructor({ id, x, y, name, spriteIndex }: ServerPlayer) {
    this.id = id;
    this.name = name;
    this.spriteIndex = spriteIndex;
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.preloadSprites();
  }

  protected preloadSprites() {
    const directions = ["left", "up", "down", "right"];
    const types = ["", "_1", "_2"];
    let loadedCount = 0;
    const totalImages = directions.length * types.length;

    directions.forEach((dir) => {
      this.sprites[dir] = [];
      types.forEach((type) => {
        const img = new Image();
        img.src =
          dir === "right"
            ? `/assets/sprites/player1/left${type}.png`
            : `/assets/sprites/player1/${dir}${type}.png`;
        img.onload = () => {
          loadedCount++;
          if (dir === "right") {
            // Flip the image horizontally for right-facing sprites
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d")!;
            ctx.scale(-1, 1);
            ctx.drawImage(img, -img.width, 0);
            const flippedImg = new Image();
            flippedImg.src = canvas.toDataURL();
            this.sprites[dir][types.indexOf(type)] = flippedImg;
          }
          if (loadedCount === totalImages) {
            this.loadedSprites = true;
          }
        };
        if (dir !== "right") {
          this.sprites[dir].push(img);
        }
      });
    });
  }

  protected get moveSpeed() {
    return this.speedUp ? this._moveSpeed * 5 : this._moveSpeed;
  }

  update(dt: number) {
    if (this.isMoving) {
      this.movementProgress += this.moveSpeed * dt;
      if (this.movementProgress >= 1) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.isMoving = false;
        this.movementProgress = 0;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, tileSize: number) {
    if (!this.loadedSprites) {
      // Render a placeholder if sprites are not loaded
      ctx.fillStyle = "gray";
      ctx.fillRect(
        this.x * tileSize,
        this.y * tileSize,
        tileSize,
        tileSize * 2
      );
      return;
    }

    const drawX =
      this.x * tileSize +
      (this.targetX - this.x) * this.movementProgress * tileSize;
    const drawY =
      (this.y - 1) * tileSize +
      (this.targetY - this.y) * this.movementProgress * tileSize;

    // Determine which frame to use based on movement progress
    let frameIndex;
    if (this.isMoving) {
      if (this.movementProgress < 0.25 || this.movementProgress > 0.75) {
        frameIndex = 0; // Show non-alternating image briefly at start and end of movement
      } else {
        frameIndex = ((this.x + this.y) % 2) + 1; // Alternate between 1 and 2 for walking
      }
    } else {
      frameIndex = 0; // Use 0 for standing still
    }

    const sprite = this.sprites[this.facingDirection][frameIndex];
    ctx.drawImage(sprite, drawX, drawY, tileSize, tileSize * 2);
  }

  moveTo(newX: number, newY: number) {
    if (!this.isLocalPlayer) {
      // Make remote players fast if they move fast
      this.speedUp = this.isMoving || this.movementProgress > 0;
    }

    const dx = newX - this.x;
    const dy = newY - this.y;

    if (dx !== 0 || dy !== 0) {
      this.targetX = newX;
      this.targetY = newY;
      this.isMoving = true;
      this.movementProgress = 0;

      // Determine facing direction
      if (Math.abs(dx) > Math.abs(dy)) {
        this.facingDirection = dx > 0 ? "right" : "left";
      } else {
        this.facingDirection = dy > 0 ? "down" : "up";
      }
    }
  }

  getPosition() {
    const x = this.isMoving
      ? this.x + (this.targetX - this.x) * this.movementProgress
      : this.x;
    const y = this.isMoving
      ? this.y + (this.targetY - this.y) * this.movementProgress
      : this.y;
    return { x, y };
  }
}
