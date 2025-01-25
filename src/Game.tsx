import type React from "react"
import { useRef, useEffect } from "react"
import { GameEngine } from "./GameEngine"
import { RandomPlayer } from "./RandomPlayer"

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameEngineRef = useRef<GameEngine | null>(null)

  useEffect(() => {
    if (canvasRef.current) {
      const spriteMapUrl = "/placeholder.svg?height=64&width=64" // Replace with your actual sprite map URL
      gameEngineRef.current = new GameEngine(canvasRef.current, spriteMapUrl)

      const { width, height } = gameEngineRef.current.getMapSize()
      const randomPlayer = new RandomPlayer(
        Math.floor(Math.random() * width),
        Math.floor(Math.random() * height),
        width,
        height,
      )
      gameEngineRef.current.addEntity(randomPlayer)

      const handleKeyDown = (e: KeyboardEvent) => gameEngineRef.current?.handleInput(e.key, true)
      const handleKeyUp = (e: KeyboardEvent) => gameEngineRef.current?.handleInput(e.key, false)

      window.addEventListener("keydown", handleKeyDown)
      window.addEventListener("keyup", handleKeyUp)

      let lastTime = performance.now()

      const gameLoop = (currentTime: number) => {
        const deltaTime = (currentTime - lastTime) / 1000
        lastTime = currentTime

        gameEngineRef.current?.update(deltaTime)
        gameEngineRef.current?.render()

        requestAnimationFrame(gameLoop)
      }

      requestAnimationFrame(gameLoop)

      return () => {
        window.removeEventListener("keydown", handleKeyDown)
        window.removeEventListener("keyup", handleKeyUp)
      }
    }
  }, [])

  return (
    <div className="h-screen w-screen flex overflow-hidden items-center justify-center bg-gray-900">
      <canvas ref={canvasRef} className="border border-gray-700" />
    </div>
  )
}

export default Game

