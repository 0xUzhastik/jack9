"use client";

import { LeftColumn } from "../LeftColumn";
import { CenterColumn } from "../CenterColumn";
import { RightColumn } from "../RightColumn";

export function DesktopLayout() {
  return (
    <div className="w-full h-full grid grid-rows-[1fr] gap-1 p-2">
      {/* Main Content Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 w-full h-full min-h-0">
        {/* Left Column - Total Deposits, Current Round, Past Winners */}
        <div className="md:col-span-1 h-full">
          <LeftColumn />
        </div>

        {/* Center Column - Donut Chart + Token Portfolio (Desktop) */}
        <div className="md:col-span-2 w-full max-w-full min-w-0 h-full min-h-0 z-1">
          <CenterColumn />
        </div>

        {/* Right Column - Largest Win + Chat + Logo */}
        <div className="md:col-span-1 w-full max-w-full min-w-0 overflow-hidden h-full flex flex-col">
          <RightColumn />
        </div>
      </div>
    </div>
  );
}