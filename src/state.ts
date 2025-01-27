import { atom, getDefaultStore, useAtom } from "jotai";
import { getRandomTrainerName } from "./names";

export const store = getDefaultStore();

export const backgroundImageLoadProgress = atom(0);
export const collisionLoadProgress = atom(0);
export const totalLoadingProgress = atom(
  (get) => (get(backgroundImageLoadProgress) + get(collisionLoadProgress)) / 2
);
export const firstFrameRendered = atom(false);
export const gameLoaded = atom(
  (get) =>
    get(backgroundImageLoadProgress) === 100 &&
    get(collisionLoadProgress) === 100 &&
    get(firstFrameRendered)
);
export const teleportPosition = atom({ x: 0, y: 0 }); 
export const playerName = atom(getRandomTrainerName());
export const isInGame = atom(false);
export const spriteIndex = atom(1);
export const musicVolume = atom(0.5);
export const chatOpen = atom(false);
export const localChatMessage = atom("");