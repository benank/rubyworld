import React from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useKeyPress } from "../hooks/useKeyPress";

const Joycon: React.FC = () => {
  const simulateKeyEvent = useKeyPress();

  const handleButtonEvent = (
    direction: string,
    eventType: "keydown" | "keyup"
  ) => {
    simulateKeyEvent(direction, eventType);
  };

  const buttonConfig = [
    {
      direction: "ArrowUp",
      icon: ChevronUp,
      position: "top-0 left-1/2 transform -translate-x-1/2",
    },
    {
      direction: "ArrowDown",
      icon: ChevronDown,
      position: "bottom-0 left-1/2 transform -translate-x-1/2",
    },
    {
      direction: "ArrowLeft",
      icon: ChevronLeft,
      position: "left-0 top-1/2 transform -translate-y-1/2",
    },
    {
      direction: "ArrowRight",
      icon: ChevronRight,
      position: "right-0 top-1/2 transform -translate-y-1/2",
    },
  ];

  return (
    <div className="absolute bottom-4 right-4 w-40 h-40 bg-black/25 bg-opacity-50 rounded-full shadow-lg z-20 p-2 select-none">
      <div className="relative w-full h-full">
        {buttonConfig.map(({ direction, icon: Icon, position }) => (
          <button
            key={direction}
            className={`absolute w-12 h-12 bg-white bg-opacity-50 hover:bg-opacity-75 active:bg-opacity-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors duration-200 flex items-center justify-center ${position}`}
            onMouseDown={() => handleButtonEvent(direction, "keydown")}
            onMouseUp={() => handleButtonEvent(direction, "keyup")}
            onMouseLeave={() => handleButtonEvent(direction, "keyup")}
            onTouchStart={(e) => {
              e.preventDefault();
              handleButtonEvent(direction, "keydown");
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleButtonEvent(direction, "keyup");
            }}
            aria-label={`Move ${direction.replace("Arrow", "").toLowerCase()}`}
          >
            <Icon className="w-8 h-8 text-black" />
            <span className="sr-only">{direction.replace("Arrow", "")}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Joycon;
