import { MAP_WIDTH, TILE_SIZE, MAP_HEIGHT } from "@/game/config";
import { collisionLoadProgress, gameLoaded, store } from "@/state";
import { downloadWithProgress } from "@/utils";
import collisionPath from "/assets/collision.txt";

const MAX_X = MAP_WIDTH / TILE_SIZE;
const MAX_Y = MAP_HEIGHT / TILE_SIZE;
let collisionMap: string[][] = [];

const loadCollisionMap = async () => {
  const collisionFile = await downloadWithProgress(
    collisionPath,
    (progress) => {
      store.set(collisionLoadProgress, progress);
    }
  );
  collisionMap = (await collisionFile.text())
    .split("\n")
    .map((line) => line.split(""));
  store.set(collisionLoadProgress, 100);
};

export const playerCanMoveTo = (x: number, y: number) => {
  if (
    x < 0 ||
    x >= MAX_X ||
    y < 0 ||
    y >= MAX_Y ||
    y >= (collisionMap.length ?? 0) ||
    x >= (collisionMap[y]?.length ?? 0)
  ) {
    return false;
  }

  return collisionMap[y][x] === "1";
};

loadCollisionMap();
