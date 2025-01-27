import { useCallback } from "react";

export const useKeyPress = () => {
  const simulateKeyEvent = useCallback(
    (key: string, eventType: "keydown" | "keyup") => {
      const event = new KeyboardEvent(eventType, { key, bubbles: true });
      document.dispatchEvent(event);
    },
    []
  );

  return simulateKeyEvent;
};
