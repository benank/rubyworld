import { getDefaultStore } from "jotai";
import { playerCanMoveTo } from "./collision";
import { teleportPosition } from "./state";
import { GameEngine } from "./GameEngine";
import socket from "./socket";
import { ClientPacketType, ClientPlayerMovePacket } from "./packets";

export class Player {
  public x: number;
  public y: number;
  private targetX: number;
  private targetY: number;
  private _moveSpeed = 3; // Tiles per second
  private isMoving = false;
  private movementProgress = 0;
  private currentDirection: string | null = null;
  private facingDirection: "left" | "right" | "up" | "down" = "down";
  private speedUp = false;
  private store = getDefaultStore();

  private sprites: {
    [key: string]: HTMLImageElement[];
  } = {
    left: [],
    right: [],
    up: [],
    down: [],
  };

  private loadedSprites = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.preloadSprites();
    this.setPosition(x, y);

    this.store.sub(teleportPosition, () => {
      this.teleport(
        this.store.get(teleportPosition).x * GameEngine.mapWidth,
        this.store.get(teleportPosition).y * GameEngine.mapHeight
      );
    });
  }

  private setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    socket.send(
      JSON.stringify({
        type: ClientPacketType.PlayerMove,
        x,
        y,
      } satisfies ClientPlayerMovePacket)
    );
  }

  private preloadSprites() {
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

  private get moveSpeed() {
    return this.speedUp ? this._moveSpeed * 5 : this._moveSpeed;
  }

  update(dt: number) {
    if (this.isMoving) {
      this.movementProgress += this.moveSpeed * dt;
      if (this.movementProgress >= 1) {
        this.setPosition(this.targetX, this.targetY);
        this.isMoving = false;
        this.movementProgress = 0;

        if (this.currentDirection) {
          this.startMove(this.currentDirection);
        }
      }
    } else if (this.currentDirection) {
      // If not moving but a direction is set, start moving
      this.startMove(this.currentDirection);
    }
  }

  teleport(x: number, y: number) {
    this.setPosition(Math.floor(x), Math.floor(y));

    this.isMoving = false;
    this.movementProgress = 0;
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

  handleInput(e: KeyboardEvent, isKeyDown: boolean) {
    const key = e.key;
    const moveKeys = [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "w",
      "a",
      "s",
      "d",
      "W",
      "A",
      "S",
      "D",
    ];

    if (moveKeys.includes(key)) {
      if (isKeyDown) {
        this.currentDirection = key;
      } else if (key === this.currentDirection) {
        this.currentDirection = null;
      }
    } else if (key === " ") {
      this.speedUp = isKeyDown;
      e.preventDefault();
      e.stopPropagation();
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
        this.facingDirection = "up";
        break;
      case "ArrowDown":
      case "s":
      case "S":
        dy = 1;
        this.facingDirection = "down";
        break;
      case "ArrowLeft":
      case "a":
      case "A":
        dx = -1;
        this.facingDirection = "left";
        break;
      case "ArrowRight":
      case "d":
      case "D":
        dx = 1;
        this.facingDirection = "right";
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
      ? this.x + (this.targetX - this.x) * this.movementProgress
      : this.x;
    const y = this.isMoving
      ? this.y + (this.targetY - this.y) * this.movementProgress
      : this.y;
    return { x, y };
  }
}
