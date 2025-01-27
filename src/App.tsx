import * as React from "react";
import Game from "./Game";
import { Button } from "./components/ui/button";
import { MapIcon, RefreshCwIcon, Volume2Icon, VolumeIcon } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import minimap from "/assets/minimap.png";
import "./App.css";
import { useAtom } from "jotai";
import {
  isInGame,
  musicVolume,
  playerName,
  spriteIndex,
  teleportPosition,
} from "./state";
import MusicPlayer from "./components/MusicPlayer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "./components/ui/input";
import { getRandomTrainerName } from "./names";
import { useState } from "react";
import { Slider } from "./components/ui/slider";
import Joycon from "./components/Joycon";
import { PreventPullToRefresh } from "./components/PreventPullToRefresh";

const App: React.FC = () => {
  const [_, setTpPos] = useAtom(teleportPosition);
  const [name, setName] = useAtom(playerName);
  const [inGame, setIsInGame] = useAtom(isInGame);
  const [sprite, setSprite] = useAtom(spriteIndex);
  const [volume, setVolume] = useAtom(musicVolume);
  const [volumeOpen, setVolumeOpen] = useState(false);

  const handleMapClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    const trimPixels = { top: 32, left: 8, bottom: 24, right: 30 };
    const rect = (e.target as HTMLButtonElement).getBoundingClientRect();
    const clickX =
      (e.clientX - rect.left - trimPixels.left) /
      (rect.width - trimPixels.left - trimPixels.right);
    const clickY =
      (e.clientY - rect.top - trimPixels.top) /
      (rect.height - trimPixels.top - trimPixels.bottom);

    setTpPos({ x: clickX, y: clickY });
  };

  return (
    <PreventPullToRefresh>
      <div className="fixed inset-0 h-[100svh] overflow-hidden bg-black">
        <MusicPlayer />
        <Game />
        {navigator.maxTouchPoints >= 2 && <Joycon />}
        <div className="absolute top-0 right-0 z-10 m-2 flex flex-row gap-2">
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setVolumeOpen(!volumeOpen)}
            >
              <Volume2Icon />
            </Button>
            {volumeOpen && (
              <Slider
                defaultValue={[volume]}
                min={0}
                max={1}
                step={0.05}
                orientation="vertical"
                className="h-20 w-1.5"
                onValueChange={(value) => setVolume(value[0])}
              />
            )}
          </div>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="secondary" size="icon">
                <MapIcon />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-lg">
                <DrawerHeader>
                  <DrawerTitle>World Map</DrawerTitle>
                  <DrawerDescription>
                    Tap anywhere to teleport.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="p-4 pb-10">
                  <div className="flex items-center justify-center space-x-2">
                    <DrawerClose asChild>
                      <button className="w-full" onClick={handleMapClick}>
                        <img
                          src={minimap}
                          alt="minimap"
                          className="w-full pixelPerfect rounded-lg"
                        />
                      </button>
                    </DrawerClose>
                  </div>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
        <Dialog open={!inGame}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Welcome to Ruby World!</DialogTitle>
              <DialogDescription>
                This is an online realtime game world where you can explore the
                Hoenn region from Pokémon Ruby. Use arrow keys or WASD to move
                around. Hold space to go fast. Use the map in the top right to
                teleport to a location - it might take a few tries to get the
                location just right.
              </DialogDescription>
              <div className="flex flex-row gap-2 items-center relative mt-8 mb-6">
                <Input value={name} disabled />
                <Button
                  variant="ghost"
                  size="icon"
                  className="aspect-square"
                  onClick={() => setName(getRandomTrainerName())}
                >
                  <RefreshCwIcon />
                </Button>
                <span className="text-xs text-nowrap absolute -top-5 left-0 p-1 rounded-lg select-none pointer-events-none text-muted-foreground">
                  Player name
                </span>
              </div>
              <div className="flex flex-col gap-2 mb-6">
                <span className="text-lg font-semibold">Character</span>
                <div className="flex flex-row justify-center items-center gap-4">
                  <Button
                    onClick={() => setSprite(1)}
                    className={`w-20 h-24 relative border-2 ${
                      sprite === 1
                        ? `bg-blue-200 border-blue-400 hover:bg-blue-100`
                        : `bg-slate-200 border-slate-300 hover:bg-slate-100`
                    } `}
                  >
                    <img
                      src={`/assets/sprites/player1/down.png`}
                      alt="player"
                      className="absolute -top-4 w-12 pixelPerfect"
                    />
                  </Button>
                  <Button
                    onClick={() => setSprite(2)}
                    className={`w-20 h-24 relative border-2 ${
                      sprite === 2
                        ? `bg-pink-200 border-pink-400 hover:bg-pink-100`
                        : `bg-slate-200 border-slate-300 hover:bg-slate-100`
                    } `}
                  >
                    <img
                      src={`/assets/sprites/player2/down.png`}
                      alt="player"
                      className="absolute -top-4 w-12 pixelPerfect"
                    />
                  </Button>
                </div>
              </div>
              <Button onClick={() => setIsInGame(true)}>Play!</Button>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </PreventPullToRefresh>
  );
};

export default App;
