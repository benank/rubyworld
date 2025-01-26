import * as React from "react";
import Game from "./Game";
import { Button } from "./components/ui/button";
import { MapIcon } from "lucide-react";
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
import { teleportPosition } from "./state";

const App: React.FC = () => {
  const [_, setTpPos] = useAtom(teleportPosition);

  const handleMapClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    const trimPixels = {top: 32, left: 8, bottom: 24, right: 30};
    const rect = (e.target as HTMLButtonElement).getBoundingClientRect();
    const clickX = (e.clientX - rect.left - trimPixels.left) / (rect.width - trimPixels.left - trimPixels.right);
    const clickY = (e.clientY - rect.top - trimPixels.top) / (rect.height - trimPixels.top - trimPixels.bottom);

    setTpPos({ x: clickX, y: clickY });
  };

  return (
    <div className="App overflow-hidden relative bg-black">
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
    </div>
  );
};

export default App;
