"use client";

export function SunburstBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Grid background */}
      <div className="absolute inset-0 grid-background"></div>
      
      {/* Neon glow overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-blue-900/30 pointer-events-none"></div>
    </div>
  );
}