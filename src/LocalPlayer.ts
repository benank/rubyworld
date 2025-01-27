import { playerCanMoveTo } from "./collision";
import { playerName, spriteIndex, store, teleportPosition } from "./state";
import { GameEngine } from "./GameEngine";
import socket from "./socket";
import {
  ClientPacketType,
  ClientPlayerMovePacket,
  ClientPlayerSpawnPacket,
} from "./packets";
import { Player } from "./Player";
import { LOCALPLAYER_ID } from "./config";

export class LocalPlayer extends Player {
  private currentDirection: string | null = null;
  private gameEngine: GameEngine;

  constructor(x: number, y: number, gameEngine: GameEngine) {
    super({
      id: LOCALPLAYER_ID,
      x,
      y,
      name: store.get(playerName),
      spriteIndex: store.get(spriteIndex),
    });
    this.isLocalPlayer = true;
    this.gameEngine = gameEngine;
    this.setPosition(x, y);

    socket.send({
      type: ClientPacketType.PlayerSpawn,
      x: this.x,
      y: this.y,
      name: this.name,
      spriteIndex: this.spriteIndex,
    } satisfies ClientPlayerSpawnPacket);

    store.sub(teleportPosition, () => {
      this.teleport(
        store.get(teleportPosition).x * GameEngine.mapWidth,
        store.get(teleportPosition).y * GameEngine.mapHeight
      );
    });
  }

  private setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.syncPositionToServer();
  }

  private syncPositionToServer() {
    socket.send({
      type: ClientPacketType.PlayerMove,
      x: this.targetX,
      y: this.targetY,
    } satisfies ClientPlayerMovePacket);
  }

  update(dt: number) {
    super.update(dt);
    if (!this.isMoving && this.currentDirection) {
      // If not moving but a direction is set, start moving
      this.startMove(this.currentDirection);
    }
  }

  teleport(x: number, y: number) {
    this.isMoving = false;
    this.movementProgress = 0;
    this.targetX = Math.floor(x);
    this.targetY = Math.floor(y);
    this.setPosition(Math.floor(x), Math.floor(y));
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
      if (
        playerCanMoveTo(newX, newY) &&
        this.gameEngine.isSpaceFree(newX, newY)
      ) {
        this.moveTo(newX, newY);
        this.syncPositionToServer();
      } else {
        this.facingDirection =
          dx > 0 ? "right" : dx < 0 ? "left" : dy > 0 ? "down" : "up";
      }
    }
  }
}
