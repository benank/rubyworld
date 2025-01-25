import type { Sprite } from "./Sprite";
import { Player } from "./Player";
import type { Entity } from "./Entity";
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from "./config";
import { getDefaultStore } from "jotai";
import { backgroundImageLoadProgress, firstFrameRendered } from "./state";

const CHUNK_SIZE = 192;
const VISIBLE_CHUNKS = 5; // 5x5 square around the camera

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tileSize = TILE_SIZE;
  private scale = 4;
  private mapWidth: number = MAP_WIDTH / this.tileSize;
  private mapHeight: number = MAP_HEIGHT / this.tileSize;
  private sprites: { [key: number]: Sprite };
  private player: Player;
  private entities: Entity[];
  private cameraX = 0;
  private cameraY = 0;
  private chunks: Map<string, HTMLImageElement> = new Map();
  private loadingChunks: Set<string> = new Set();
  private store = getDefaultStore();
  private firstFrameRendered = false;

  private fixedDeltaTime: number = 1 / 60; // 60 updates per second
  private accumulator = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.sprites = {};
    this.player = new Player(
      Math.floor(this.mapWidth * 0.08),
      Math.floor(this.mapHeight * 0.65)
    );
    this.entities = [];
    this.setupCanvas();
  }

  private setupCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx.imageSmoothingEnabled = false;
  }

  private getChunkKey(x: number, y: number): string {
    return `${Math.floor(x / CHUNK_SIZE)}_${Math.floor(y / CHUNK_SIZE)}`;
  }

  private async loadChunk(x: number, y: number): Promise<void> {
    const chunkKey = this.getChunkKey(x, y);
    if (this.chunks.has(chunkKey) || this.loadingChunks.has(chunkKey)) return;

    this.loadingChunks.add(chunkKey);

    try {
      const img = new Image();
      img.src = `/assets/tiles/map_${x}_${y}.png`;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      this.chunks.set(chunkKey, img);
    } catch (error) {
      console.error(`Failed to load chunk ${chunkKey}:`, error);
    } finally {
      this.loadingChunks.delete(chunkKey);
    }
  }

  private async loadVisibleChunks() {
    const centerX = Math.floor(this.cameraX / (CHUNK_SIZE * this.scale));
    const centerY = Math.floor(this.cameraY / (CHUNK_SIZE * this.scale));

    const visibleChunkKeys = new Set<string>();

    for (
      let y = Math.max(0, centerY - Math.floor(VISIBLE_CHUNKS / 2));
      y <= centerY + Math.floor(VISIBLE_CHUNKS / 2);
      y++
    ) {
      for (
        let x = Math.max(0, centerX - Math.floor(VISIBLE_CHUNKS / 2));
        x <= centerX + Math.floor(VISIBLE_CHUNKS / 2);
        x++
      ) {
        const chunkX = x * CHUNK_SIZE;
        const chunkY = y * CHUNK_SIZE;
        const chunkKey = this.getChunkKey(chunkX, chunkY);
        visibleChunkKeys.add(chunkKey);

        if (
          !this.chunks.has(chunkKey) &&
          !this.loadingChunks.has(chunkKey) &&
          chunkX <= MAP_WIDTH - CHUNK_SIZE &&
          chunkY <= MAP_HEIGHT - CHUNK_SIZE
        ) {
          this.loadChunk(chunkX, chunkY);
        }
      }
    }

    // Unload chunks that are no longer visible
    for (const chunkKey of this.chunks.keys()) {
      if (!visibleChunkKeys.has(chunkKey)) {
        this.chunks.delete(chunkKey);
      }
    }

    // Update loading progress
    const totalChunks = VISIBLE_CHUNKS * VISIBLE_CHUNKS;
    const loadedChunks = [...visibleChunkKeys].filter((key) =>
      this.chunks.has(key)
    ).length;
    const progress = Math.round((loadedChunks / totalChunks) * 100);
    this.store.set(backgroundImageLoadProgress, progress);
  }

  public update(deltaTime: number) {
    this.accumulator += deltaTime;

    while (this.accumulator >= this.fixedDeltaTime) {
      this.fixedUpdate(this.fixedDeltaTime);
      this.accumulator -= this.fixedDeltaTime;
    }

    this.updateCamera();
    this.loadVisibleChunks();
  }

  private fixedUpdate(dt: number) {
    this.player.update(dt);
    this.entities.forEach((entity) => entity.update(dt));
  }

  private updateCamera() {
    const playerPos = this.player.getPosition();
    this.cameraX =
      playerPos.x * this.tileSize * this.scale - this.canvas.width / 2;
    this.cameraY =
      playerPos.y * this.tileSize * this.scale - this.canvas.height / 2;
  }

  public render() {
    if (
      this.canvas.width !== window.innerWidth ||
      this.canvas.height !== window.innerHeight
    ) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.ctx.imageSmoothingEnabled = false;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(-Math.round(this.cameraX), -Math.round(this.cameraY));

    // Render visible chunks
    const startX = Math.floor(this.cameraX / (CHUNK_SIZE * this.scale));
    const startY = Math.floor(this.cameraY / (CHUNK_SIZE * this.scale));
    const endX =
      startX + Math.ceil(this.canvas.width / (CHUNK_SIZE * this.scale)) + 1;
    const endY =
      startY + Math.ceil(this.canvas.height / (CHUNK_SIZE * this.scale)) + 1;

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const chunkX = x * CHUNK_SIZE;
        const chunkY = y * CHUNK_SIZE;
        const chunkKey = this.getChunkKey(chunkX, chunkY);
        const chunk = this.chunks.get(chunkKey);
        if (chunk) {
          this.ctx.drawImage(
            chunk,
            chunkX * this.scale,
            chunkY * this.scale,
            CHUNK_SIZE * this.scale,
            CHUNK_SIZE * this.scale
          );
        }
      }
    }

    // Render entities
    this.entities.forEach((entity) => {
      entity.render(this.ctx, this.tileSize * this.scale, this.sprites);
    });

    // Render player
    this.player.render(this.ctx, this.tileSize * this.scale);

    this.ctx.restore();

    if (!this.firstFrameRendered) {
      this.store.set(firstFrameRendered, true);
      this.firstFrameRendered = true;
    }
  }

  public handleInput(e: KeyboardEvent, isKeyDown: boolean) {
    this.player.handleInput(e, isKeyDown);
  }

  public addEntity(entity: Entity) {
    this.entities.push(entity);
  }

  public moveEntity(index: number, newX: number, newY: number) {
    if (index >= 0 && index < this.entities.length) {
      this.entities[index].x = newX;
      this.entities[index].y = newY;
    }
  }

  public getMapSize() {
    return { width: this.mapWidth, height: this.mapHeight };
  }
}
