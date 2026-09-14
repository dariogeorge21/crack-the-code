"use client";

import React, { useState, useEffect, useRef } from "react";

interface Level3SplitPaneProps {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
  initialSplitPercent?: number;
  initialVerticalSplitPercent?: number;
}

export function Level3SplitPane({
  leftPane,
  rightPane,
  initialSplitPercent = 46,
  initialVerticalSplitPercent = 45,
}: Level3SplitPaneProps) {
  const [splitPercent, setSplitPercent] = useState<number>(initialSplitPercent);
  const [verticalSplitPercent, setVerticalSplitPercent] = useState<number>(initialVerticalSplitPercent);
  const [isDraggingSplitter, setIsDraggingSplitter] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(true);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSplitterPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingSplitter(true);
  };

  const handleSplitterPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSplitter || !splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();

    if (window.innerWidth >= 768) {
      const x = e.clientX - rect.left;
      const pct = (x / rect.width) * 100;
      setSplitPercent(Math.min(Math.max(pct, 20), 80));
    } else {
      const y = e.clientY - rect.top;
      const pct = (y / rect.height) * 100;
      setVerticalSplitPercent(Math.min(Math.max(pct, 20), 80));
    }
  };

  const handleSplitterPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingSplitter) {
      setIsDraggingSplitter(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  return (
    <div
      ref={splitContainerRef}
      className={`flex-1 flex flex-col md:flex-row overflow-hidden relative ${
        isDraggingSplitter ? "select-none" : ""
      }`}
    >
      {/* Left Pane: Problem Statement & Instructions (Resizable) */}
      <div
        style={{
          width: isDesktop ? `${splitPercent}%` : "100%",
          height: !isDesktop ? `${verticalSplitPercent}%` : "100%",
        }}
        className="overflow-hidden flex flex-col shrink-0 min-w-0"
      >
        {leftPane}
      </div>

      {/* Resizable Splitter Handle between Question Panel and Editor */}
      <div
        onPointerDown={handleSplitterPointerDown}
        onPointerMove={handleSplitterPointerMove}
        onPointerUp={handleSplitterPointerUp}
        className={`select-none transition-colors group relative shrink-0 z-20 ${
          isDesktop
            ? "w-2.5 h-full cursor-col-resize bg-[#0c0c11] hover:bg-[#ff5500] active:bg-[#ff5500] border-x border-neutral-800 flex items-center justify-center"
            : "h-2.5 w-full cursor-row-resize bg-[#0c0c11] hover:bg-[#ff5500] active:bg-[#ff5500] border-y border-neutral-800 flex items-center justify-center"
        } ${isDraggingSplitter ? "bg-[#ff5500]!" : ""}`}
        title={
          isDesktop
            ? "Drag horizontally to resize Question and Editor panels"
            : "Drag vertically to resize Question and Editor panels"
        }
      >
        {/* Splitter Grip indicator */}
        <div
          className={`flex items-center justify-center rounded-full bg-neutral-800 group-hover:bg-white group-active:bg-white transition-all shadow-sm ${
            isDesktop ? "flex-col gap-1 w-1.5 h-7" : "flex-row gap-1 h-1.5 w-7"
          }`}
        >
          <span className="size-1 rounded-full bg-neutral-400 group-hover:bg-black group-active:bg-black" />
          <span className="size-1 rounded-full bg-neutral-400 group-hover:bg-black group-active:bg-black" />
          <span className="size-1 rounded-full bg-neutral-400 group-hover:bg-black group-active:bg-black" />
        </div>
      </div>

      {/* Right Pane: Code Editor */}
      <div className="flex-1 overflow-hidden flex flex-col min-w-0 min-h-0">
        {rightPane}
      </div>
    </div>
  );
}

