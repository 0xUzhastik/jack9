'use client';

import { memo, useMemo } from 'react';
import { getChipStyle } from '@/constants/denominations';

interface BottomChipProps {
  chipValue: number;
  position: { top: number; left: number };
  zIndex: number;
  isSelected?: boolean;
  scaleFactorProp?: number; // 🔥 NEW: Optional scale factor prop
}

// 🔥 MEMOIZED: Component to prevent unnecessary re-renders
const BottomChip = memo(function BottomChip({
  chipValue,
  position,
  zIndex,
  isSelected = false,
  scaleFactorProp = 1 // 🔥 NEW: Default to 1 (no scaling)
}: BottomChipProps) {
  // 🔥 NEW: Apply scale factor to chip dimensions
  const scaledChipSize = 144 * scaleFactorProp; // Base size is 144px (w-36 h-36)
  
  // 🔥 MEMOIZED: Border color calculation
  const borderColor = useMemo(() => 
    isSelected ? 'border-yellow-400' : 'border-black'
  , [isSelected]);

  // 🔥 MEMOIZED: Background color calculation
  const bgColor = useMemo(() => {
    if (chipValue < 1) return 'bg-gray-300'; // Light grey for penny chips
    if (chipValue >= 1000000) return 'bg-amber-500'; // Golden $1M chips
    if (chipValue >= 500000) return 'bg-violet-600'; // Royal purple $500K chips
    if (chipValue >= 100000) return 'bg-rose-600'; // Rich red $100K chips
    if (chipValue >= 50000) return 'bg-emerald-600'; // Rich green $50K chips
    if (chipValue >= 10000) return 'bg-orange-600'; // Rich orange $10K chips
    if (chipValue >= 5000) return 'bg-yellow-500'; // Golden $5K chips
    if (chipValue >= 1000) return 'bg-gray-900';
    if (chipValue >= 500) return 'bg-purple-600';
    if (chipValue >= 100) return 'bg-red-500';
    if (chipValue >= 50) return 'bg-orange-500';
    if (chipValue >= 20) return 'bg-green-500';
    if (chipValue >= 10) return 'bg-blue-500';
    if (chipValue >= 5) return 'bg-yellow-400';
    if (chipValue >= 1) return 'bg-cyan-400';
    return 'bg-gray-300'; // Fallback to light grey
  }, [chipValue]);

  // 🔥 MEMOIZED: Style objects to prevent recreation
  const styles = useMemo(() => ({
    fillStyle: {
      top: `${position.top}px`,
      left: `${position.left}px`,
      zIndex: zIndex,
      width: `${scaledChipSize}px`, // 🔥 NEW: Scaled width
      height: `${scaledChipSize}px` // 🔥 NEW: Scaled height
    },
    strokeStyle: {
      top: `${position.top}px`,
      left: `${position.left}px`,
      zIndex: zIndex + 100,
      clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)',
      width: `${scaledChipSize}px`, // 🔥 NEW: Scaled width
      height: `${scaledChipSize}px` // 🔥 NEW: Scaled height
    }
  }), [position.top, position.left, zIndex, scaledChipSize]);

  return (
    <div className="absolute">
      {/* Bottom circle fill */}
      <div 
        className={`absolute rounded-full ${bgColor} transition-all duration-300`}
        style={styles.fillStyle}
      />
      
      {/* Bottom circle stroke */}
      <div 
        className={`absolute border-4 ${borderColor} rounded-full bg-transparent transition-all duration-300`}
        style={styles.strokeStyle}
      />
    </div>
  );
});

export default BottomChip;