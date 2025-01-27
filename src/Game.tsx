import type React from "react";
import { useRef, useEffect } from "react";
import { GameEngine } from "./GameEngine";

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let gameEngine: GameEngine | null = null;

    if (canvasRef.current) {
      gameEngine = new GameEngine(canvasRef.current);
      gameEngineRef.current = gameEngine;
    }

    const handleKeyDown = (e: KeyboardEvent) =>
      gameEngine?.handleInput(e, true);
    const handleKeyUp = (e: KeyboardEvent) => gameEngine?.handleInput(e, false);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let lastTime = performance.now();

    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      gameEngine?.update(deltaTime);
      gameEngine?.render();

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (gameEngine) {
        gameEngine.destroy();
      }
    };
  }, []);

  return (
    <div className="h-full w-screen flex overflow-hidden items-center justify-center bg-gray-900 select-none relative isolate">
      <canvas ref={canvasRef} className="z-10" />
      <div className="absolute inset-0 w-full h-full overflow-hidden select-none"></div>
    </div>
  );
};
export default Game;
