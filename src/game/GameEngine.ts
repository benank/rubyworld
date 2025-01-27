import { Player } from "./Player";
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, LOCALPLAYER_ID } from "./config";
import {
  backgroundImageLoadProgress,
  firstFrameRendered,
  isInGame,
  localChatMessage,
  store,
} from "../state";
import { LocalPlayer } from "./LocalPlayer";
import socket from "./socket";
import {
  ServerPacket,
  ServerPacketType,
  ServerPlayerMovePacket,
} from "./packets";

const CHUNK_SIZE = 192;
const VISIBLE_CHUNKS = 5; // 5x5 square around the camera

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public static readonly tileSize = TILE_SIZE;
  public static readonly scale = 3;
  public static readonly mapWidth: number = MAP_WIDTH / this.tileSize;
  public static readonly mapHeight: number = MAP_HEIGHT / this.tileSize;
  private localPlayer?: LocalPlayer;
  private players: Player[] = [];
  private cameraX = 55;
  private cameraY = 250;
  private chunks: Map<string, HTMLImageElement> = new Map();
  private loadingChunks: Set<string> = new Set();
  private firstFrameRendered = false;

  private fixedDeltaTime: number = 1 / 60; // 60 updates per second
  private accumulator = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.setupCanvas();
    socket.recv(this.onServerPacket.bind(this));

    store.sub(isInGame, () => {
      if (store.get(isInGame) && !this.localPlayer) {
        this.createLocalPlayer();
      }
    });

    store.sub(localChatMessage, () => {
      const msg = store.get(localChatMessage);
      if (!msg) return;
      this.addChatMessage(LOCALPLAYER_ID, msg);
    });
  }

  private onServerPacket(packet: ServerPacket) {
    switch (packet.type) {
      case ServerPacketType.PlayerMove:
        this.movePlayer(packet);
        break;
      case ServerPacketType.Init:
        this.players = packet.players.map((p) => new Player(p));
        break;
      case ServerPacketType.PlayerRemove:
        this.removePlayer(packet.id);
        break;
      case ServerPacketType.PlayerSpawn:
        this.addPlayer(new Player(packet.player));
        break;
      case ServerPacketType.PlayerChat:
        this.addChatMessage(packet.id, packet.message);
        break;
    }
  }

  private addChatMessage(id: string, message: string) {
    if (id === LOCALPLAYER_ID) {
      this.localPlayer?.addChatMessage(message);
    } else {
      this.players.find((p) => p.id === id)?.addChatMessage(message);
    }
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
    const centerX = Math.floor(this.cameraX / (CHUNK_SIZE * GameEngine.scale));
    const centerY = Math.floor(this.cameraY / (CHUNK_SIZE * GameEngine.scale));

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
    if (store.get(backgroundImageLoadProgress) < 100) {
      const totalChunks = VISIBLE_CHUNKS * VISIBLE_CHUNKS;
      const loadedChunks = [...visibleChunkKeys].filter((key) =>
        this.chunks.has(key)
      ).length;
      const progress = Math.round((loadedChunks / totalChunks) * 100);
      store.set(backgroundImageLoadProgress, progress);
    }
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
    this.localPlayer?.update(dt);
    this.players.forEach((entity) => entity.update(dt));
  }

  private updateCamera() {
    const playerPos = this.localPlayer?.getPosition() ?? { x: 60, y: 250 };
    this.cameraX =
      playerPos.x * GameEngine.tileSize * GameEngine.scale -
      this.canvas.width / 2;
    this.cameraY =
      playerPos.y * GameEngine.tileSize * GameEngine.scale -
      this.canvas.height / 2;
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
    const startX = Math.floor(this.cameraX / (CHUNK_SIZE * GameEngine.scale));
    const startY = Math.floor(this.cameraY / (CHUNK_SIZE * GameEngine.scale));
    const endX =
      startX +
      Math.ceil(this.canvas.width / (CHUNK_SIZE * GameEngine.scale)) +
      1;
    const endY =
      startY +
      Math.ceil(this.canvas.height / (CHUNK_SIZE * GameEngine.scale)) +
      1;

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const chunkX = x * CHUNK_SIZE;
        const chunkY = y * CHUNK_SIZE;
        const chunkKey = this.getChunkKey(chunkX, chunkY);
        const chunk = this.chunks.get(chunkKey);
        if (chunk) {
          this.ctx.drawImage(
            chunk,
            chunkX * GameEngine.scale,
            chunkY * GameEngine.scale,
            CHUNK_SIZE * GameEngine.scale,
            CHUNK_SIZE * GameEngine.scale
          );
        }
      }
    }

    // Render players
    this.players.forEach((player) => {
      player.render(this.ctx, GameEngine.tileSize * GameEngine.scale);
    });

    // Render local player
    this.localPlayer?.render(this.ctx, GameEngine.tileSize * GameEngine.scale);

    this.ctx.restore();

    if (!this.firstFrameRendered) {
      store.set(firstFrameRendered, true);
      this.firstFrameRendered = true;
    }
  }

  public handleInput(e: KeyboardEvent, isKeyDown: boolean) {
    this.localPlayer?.handleInput(e, isKeyDown);
  }

  public addPlayer(player: Player) {
    this.players.push(player);
  }

  public removePlayer(id: string) {
    this.players = this.players.filter((p) => p.id !== id);
  }

  public movePlayer(packet: ServerPlayerMovePacket) {
    const player = this.players.find((p) => p.id === packet.id);
    player?.moveTo(packet.x, packet.y);
  }

  public isSpaceFree(x: number, y: number) {
    return !this.players.some((p) => p.x === x && p.y === y);
  }

  public getMapSize() {
    return { width: GameEngine.mapWidth, height: GameEngine.mapHeight };
  }

  public createLocalPlayer() {
    this.localPlayer = new LocalPlayer(
      Math.floor(Math.random() * 12) + 55,
      Math.floor(Math.random() * 3) + 249,
      this
    );
  }

  public destroy() {
    socket.removeAllListeners();
  }
}
