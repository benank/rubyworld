import * as React from "react";
import Game from "./Game";
import { Button } from "./components/ui/button";
import { MapIcon, RefreshCwIcon } from "lucide-react";
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
import { isInGame, playerName, teleportPosition } from "./state";
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

const App: React.FC = () => {
  const [_, setTpPos] = useAtom(teleportPosition);
  const [name, setName] = useAtom(playerName);
  const [inGame, setIsInGame] = useAtom(isInGame);

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
    <div className="App overflow-hidden relative bg-black">
      <MusicPlayer />
      <Game />
      <div className="absolute top-0 right-0 z-10 m-4">
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
                <DrawerDescription>Tap anywhere to teleport.</DrawerDescription>
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
            <Button onClick={() => setIsInGame(true)}>Play!</Button>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default App;
