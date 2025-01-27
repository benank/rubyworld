"use client";

import React, { useEffect, useRef } from "react";

export const PreventPullToRefresh: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].pageY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].pageY;
      const scrollTop = container.scrollTop;
      const direction = y - startY;

      // Prevent overscroll on top
      if (scrollTop === 0 && direction > 0) {
        e.preventDefault();
      }

      // Prevent overscroll on bottom
      if (
        scrollTop + container.offsetHeight === container.scrollHeight &&
        direction < 0
      ) {
        e.preventDefault();
      }
    };

    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        overscrollBehavior: "none",
        height: "100svh",
        overflow: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {children}
    </div>
  );
};
