import { Sprite } from "./Sprite";
import { Player } from "./Player";
import type { Entity } from "./Entity";

const TILE_SIZE = 16;
const MAP_WIDTH = 12864;
const MAP_HEIGHT = 6144;
const MAP_IMAGE_URL = "assets/map.png";

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tileSize = TILE_SIZE;
  private scale = 3;
  private mapWidth: number = MAP_WIDTH / this.tileSize;
  private mapHeight: number = MAP_HEIGHT / this.tileSize;
  private sprites: { [key: number]: Sprite };
  private player: Player;
  private entities: Entity[];
  private cameraX = 0;
  private cameraY = 0;
  private backgroundImage!: HTMLImageElement;

  private fixedDeltaTime: number = 1 / 60; // 60 updates per second
  private accumulator = 0;

  constructor(canvas: HTMLCanvasElement, spriteMap: string) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.sprites = {};
    this.loadSprites(spriteMap);
    this.player = new Player(
      Math.floor(this.mapWidth * 0.08),
      Math.floor(this.mapHeight * 0.65)
    );
    this.entities = [];
    this.setupCanvas();
    this.loadBackgroundImage();
  }

  private setupCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx.imageSmoothingEnabled = false;
  }

  private loadSprites(spriteMap: string) {
    const image = new Image();
    image.src = spriteMap;
    image.onload = () => {
      const spriteSize = 16;
      const spritesPerRow = image.width / spriteSize;
      for (let i = 0; i < 256; i++) {
        const x = (i % spritesPerRow) * spriteSize;
        const y = Math.floor(i / spritesPerRow) * spriteSize;
        this.sprites[i] = new Sprite(image, x, y, spriteSize, spriteSize);
      }
    };
  }

  private loadBackgroundImage() {
    this.backgroundImage = new Image();
    this.backgroundImage.src = MAP_IMAGE_URL;
  }

  public update(deltaTime: number) {
    this.accumulator += deltaTime;

    while (this.accumulator >= this.fixedDeltaTime) {
      this.fixedUpdate(this.fixedDeltaTime);
      this.accumulator -= this.fixedDeltaTime;
    }

    this.updateCamera();
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
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(-Math.round(this.cameraX), -Math.round(this.cameraY));

    // Render background
    this.ctx.drawImage(
      this.backgroundImage,
      0,
      0,
      MAP_WIDTH * this.scale,
      MAP_HEIGHT * this.scale
    );

    // Render entities
    this.entities.forEach((entity) => {
      entity.render(this.ctx, this.tileSize * this.scale, this.sprites);
    });

    // Render player
    this.player.render(this.ctx, this.tileSize * this.scale);

    this.ctx.restore();
  }

  public handleInput(key: string, isKeyDown: boolean) {
    this.player.handleInput(key, isKeyDown);
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
