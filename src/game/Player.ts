import { CHAT_MESSAGE_TIMEOUT_MS } from "./config";
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
  protected chatMessage: string | null = null;
  protected chatMessageTimeout: number | null = null;

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
            ? `/assets/sprites/player${this.spriteIndex}/left${type}.png`
            : `/assets/sprites/player${this.spriteIndex}/${dir}${type}.png`;
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

    // Render player name
    ctx.font = "14px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.imageSmoothingEnabled = false;

    // Measure text width
    const maxWidth = 400;
    let displayName = this.name;
    let textWidth = ctx.measureText(displayName).width;

    // Truncate name if it exceeds maxWidth
    if (textWidth > maxWidth) {
      while (textWidth > maxWidth && displayName.length > 0) {
        displayName = displayName.slice(0, -1);
        textWidth = ctx.measureText(displayName + "...").width;
      }
      displayName += "...";
    }

    const textX = Math.round(drawX + tileSize / 2);
    const textY = Math.round(drawY + 30);

    // Draw text stroke
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.strokeText(displayName, textX, textY);

    // Draw text fill
    ctx.fillStyle = "white";
    ctx.fillText(displayName, textX, textY);

    // Render chat bubble if there's a message
    if (this.chatMessage) {
      const maxBubbleWidth = 300;
      const lineHeight = 20;
      const maxLines = 3;
      const padding = 8;

      // Measure and wrap text
      ctx.font = "12px 'Press Start 2P'";
      const words = this.chatMessage.split(" ");
      let lines = [];
      let currentLine = "";

      for (let word of words) {
        const testLine = currentLine + (currentLine ? " " : "") + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxBubbleWidth - padding * 2) {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            lines.push(testLine);
            currentLine = "";
          }
          if (lines.length === maxLines) break;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine && lines.length < maxLines) {
        lines.push(currentLine);
      }

      // Truncate if necessary
      if (lines.length > maxLines) {
        lines = lines.slice(0, maxLines);
        lines[maxLines - 1] = lines[maxLines - 1].slice(0, -3) + "...";
      }

      // Calculate bubble dimensions
      const bubbleWidth =
        Math.max(...lines.map((line) => ctx.measureText(line).width)) +
        padding * 2;
      const bubbleHeight = lines.length * lineHeight + padding * 2;

      const bubbleX = Math.round(drawX + tileSize / 2 - bubbleWidth / 2);
      const bubbleY = Math.round(drawY - bubbleHeight - 10);

      // Draw bubble background
      ctx.fillStyle = "white";
      ctx.strokeStyle = "#a0a0a0";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 8);
      ctx.fill();
      ctx.stroke();

      // Draw chat message
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = "black";

      lines.forEach((line, index) => {
        ctx.fillText(
          line,
          bubbleX + padding,
          bubbleY + padding + index * lineHeight
        );
      });

      // Draw tail of the bubble
      ctx.beginPath();
      ctx.fillStyle = "white";
      ctx.moveTo(bubbleX + bubbleWidth / 2 - 8, bubbleY + bubbleHeight);
      ctx.lineTo(bubbleX + bubbleWidth / 2, bubbleY + bubbleHeight + 8);
      ctx.lineTo(bubbleX + bubbleWidth / 2 + 8, bubbleY + bubbleHeight);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
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

  addChatMessage(message: string) {
    this.chatMessage = message;

    if (this.chatMessageTimeout) {
      window.clearTimeout(this.chatMessageTimeout);
    }

    this.chatMessageTimeout = window.setTimeout(() => {
      this.chatMessage = null;
    }, CHAT_MESSAGE_TIMEOUT_MS);
  }
}
