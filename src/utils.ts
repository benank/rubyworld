import { MAP_WIDTH, TILE_SIZE, MAP_HEIGHT } from "./config";
import collision from "/assets/collision.txt";

const MAX_X = MAP_WIDTH / TILE_SIZE;
const MAX_Y = MAP_HEIGHT / TILE_SIZE;
let collisionMap: string[][] = [];

const loadCollisionMap = async () => {
  const collisionFile: string | undefined = await (
    await fetch(collision)
  ).text();
  collisionMap = collisionFile.split("\n").map((line) => line.split(""));
};

export const playerCanMoveTo = (x: number, y: number) => {
  if (
    x < 0 ||
    x >= MAX_X ||
    y < 0 ||
    y >= MAX_Y ||
    y >= collisionMap.length ||
    x >= collisionMap[y].length
  ) {
    return false;
  }

  return collisionMap[y][x] === "1";
};

loadCollisionMap();
