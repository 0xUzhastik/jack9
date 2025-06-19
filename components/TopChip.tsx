'use client';

import React, { memo, useMemo } from 'react';
import { getChipStyle } from '@/constants/denominations';

interface TopChipProps {
  imageUrl: string;
  text: string;
  chipValue: number;
  position: { top: number; left: number };
  zIndex: number;
  isSelected?: boolean;
  stackHeight: number;
  gapBetweenLayers: number;
  tokenSymbol?: string;
  scaleFactorProp?: number; // 🔥 NEW: Optional scale factor prop
}

// 🔥 MEMOIZED: Component to prevent unnecessary re-renders
const TopChip = memo(function TopChip({
  imageUrl,
  text,
  chipValue,
  position,
  zIndex,
  isSelected = false,
  stackHeight,
  gapBetweenLayers,
  tokenSymbol = "TOKEN",
  scaleFactorProp = 1 // 🔥 NEW: Default to 1 (no scaling)
}: TopChipProps) {
  const chipStyle = getChipStyle(chipValue);
  
  // 🔥 NEW: Apply scale factor to chip dimensions
  const scaledChipSize = 144 * scaleFactorProp; // Base size is 144px (w-36 h-36)
  const scaledImageSize = 80 * scaleFactorProp;  // Base image size is 80px (w-20 h-20)
  const scaledRadius = 54 * scaleFactorProp;     // SVG circle radius
  
  // 🔥 MEMOIZED: Border colors to prevent recalculation
  const borderColors = useMemo(() => ({
    main: isSelected ? 'border-yellow-400' : 'border-black',
    image: isSelected ? 'border-yellow-400' : 'border-black'
  }), [isSelected]);

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

  // 🔥 MEMOIZED: Connecting line height calculation
  const connectingLineHeight = useMemo(() => {
    return stackHeight * gapBetweenLayers;
  }, [stackHeight, gapBetweenLayers]);

  // 🔥 MEMOIZED: Text distribution calculation (expensive operation)
  const textDistribution = useMemo(() => {
    // Clean the symbol and ensure it starts with $
    const cleanSymbol = tokenSymbol.startsWith('$') ? tokenSymbol : `$${tokenSymbol}`;
    
    // Calculate how many times we can fit the symbol around the circle
    const fontSize = 14 * scaleFactorProp; // 🔥 NEW: Scale font size
    const circumference = 2 * Math.PI * scaledRadius; // 🔥 NEW: Use scaled radius
    
    // Estimate character width (using worst-case for consistency)
    const avgCharWidth = fontSize * 0.6; // Conservative estimate
    const symbolWidth = cleanSymbol.length * avgCharWidth;
    const separatorWidth = 1.5 * avgCharWidth; // " • " width (reduced)
    
    // Find optimal number of repetitions
    let bestReps = 3;
    for (let reps = 8; reps >= 3; reps--) {
      const totalContentWidth = reps * (symbolWidth + separatorWidth);
      if (totalContentWidth <= circumference * 0.9) { // Leave 10% margin
        bestReps = reps;
        break;
      }
    }
    
    // Calculate positions for symbols and dots
    const totalElements = bestReps * 2; // symbols + dots
    const elementAngle = 360 / totalElements; // Degrees per element
    
    return {
      repetitions: bestReps,
      elementAngle,
      symbol: cleanSymbol,
      fontSize // 🔥 NEW: Include scaled font size
    };
  }, [tokenSymbol, scaleFactorProp, scaledRadius]);

  // 🔥 MEMOIZED: Unique ID for SVG path
  const uniqueId = useMemo(() => {
    return `circle-${isSelected ? 'selected' : 'original'}-${chipValue}-${position.top}-${tokenSymbol}-${scaleFactorProp}`;
  }, [isSelected, chipValue, position.top, tokenSymbol, scaleFactorProp]);

  // 🔥 MEMOIZED: Style objects to prevent recreation
  const styles = useMemo(() => ({
    topCircle: {
      top: `${position.top}px`,
      left: `${position.left}px`,
      zIndex: zIndex + 200,
      width: `${scaledChipSize}px`, // 🔥 NEW: Scaled width
      height: `${scaledChipSize}px` // 🔥 NEW: Scaled height
    },
    bottomCircle: {
      top: `${position.top + gapBetweenLayers}px`,
      left: `${position.left}px`,
      zIndex: zIndex,
      width: `${scaledChipSize}px`, // 🔥 NEW: Scaled width
      height: `${scaledChipSize}px` // 🔥 NEW: Scaled height
    },
    bottomCircleStroke: {
      top: `${position.top + gapBetweenLayers}px`,
      left: `${position.left}px`,
      zIndex: zIndex + 100,
      clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)',
      width: `${scaledChipSize}px`, // 🔥 NEW: Scaled width
      height: `${scaledChipSize}px` // 🔥 NEW: Scaled height
    },
    leftLine: {
      left: `${position.left}px`,
      top: `${position.top + (72 * scaleFactorProp)}px`, // 🔥 NEW: Scale line position
      height: `${connectingLineHeight}px`,
      zIndex: zIndex + 150
    },
    rightLine: {
      left: `${position.left + (140 * scaleFactorProp)}px`, // 🔥 FIXED: Use scaled 140px instead of scaledChipSize
      top: `${position.top + (72 * scaleFactorProp)}px`, // 🔥 NEW: Scale line position
      height: `${connectingLineHeight}px`,
      zIndex: zIndex + 150
    }
  }), [position.top, position.left, zIndex, gapBetweenLayers, connectingLineHeight, scaledChipSize, scaleFactorProp]);

  // 🔥 MEMOIZED: Generate text elements
  const textElements = useMemo(() => {
    const elements = [];
    
    for (let index = 0; index < textDistribution.repetitions; index++) {
      const symbolPosition = (index * 2) * textDistribution.elementAngle; // Even positions for symbols
      const dotPosition = (index * 2 + 1) * textDistribution.elementAngle; // Odd positions for dots
      
      const symbolOffset = (symbolPosition / 360) * 100; // Convert to percentage
      const dotOffset = (dotPosition / 360) * 100; // Convert to percentage
      
      // Symbol
      elements.push(
        <text 
          key={`symbol-${index}`}
          fontSize={textDistribution.fontSize} // 🔥 NEW: Use scaled font size
          fontWeight="bold" 
          fill={chipStyle.textColor}
          fontFamily="Arial, sans-serif"
          letterSpacing="0px"
        >
          <textPath 
            href={`#${uniqueId}`} 
            startOffset={`${symbolOffset}%`}
          >
            {textDistribution.symbol}
          </textPath>
        </text>
      );
      
      // Dot
      elements.push(
        <text 
          key={`dot-${index}`}
          fontSize={textDistribution.fontSize} // 🔥 NEW: Use scaled font size
          fontWeight="bold" 
          fill={chipStyle.textColor}
          fontFamily="Arial, sans-serif"
        >
          <textPath 
            href={`#${uniqueId}`} 
            startOffset={`${dotOffset}%`}
            textAnchor="middle"
          >
            •
          </textPath>
        </text>
      );
    }
    
    return elements;
  }, [textDistribution, uniqueId, chipStyle.textColor]);

  return (
    <div className="absolute">
      {/* Top circle with image and evenly distributed text */}
      <div 
        className={`absolute border-4 ${borderColors.main} rounded-full flex items-center justify-center ${bgColor} transition-all duration-300`}
        style={styles.topCircle}
      >
        <img 
          src={imageUrl}
          alt="Token"
          className={`border-4 ${borderColors.image} rounded-full object-cover transition-all duration-300`}
          style={{
            width: `${scaledImageSize}px`, // 🔥 NEW: Scaled image size
            height: `${scaledImageSize}px`
          }}
        />
        
        {/* Evenly distributed circular text SVG */}
        <svg 
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${scaledChipSize} ${scaledChipSize}`} // 🔥 NEW: Scaled viewBox
          style={{ overflow: 'visible' }}
        >
          <defs>
            <path 
              id={uniqueId}
              d={`M ${scaledChipSize/2} ${scaledChipSize/2 - scaledRadius} A ${scaledRadius} ${scaledRadius} 0 1 1 ${(scaledChipSize/2) - 0.2} ${scaledChipSize/2 - scaledRadius}`} // 🔥 NEW: Scaled path
              fill="none"
            />
          </defs>
          
          {textElements}
        </svg>
      </div>

      {/* Bottom circle for TopChip's 3D effect - this is part of the same logical chip */}
      <div 
        className={`absolute rounded-full ${bgColor} transition-all duration-300`}
        style={styles.bottomCircle}
      />
      
      {/* Bottom circle stroke for TopChip's 3D effect */}
      <div 
        className={`absolute border-4 ${borderColors.main} rounded-full bg-transparent transition-all duration-300`}
        style={styles.bottomCircleStroke}
      />

      {/* Connecting lines - Always render for 3D cylinder effect */}
      {/* Left connecting line */}
      <div 
        className={`absolute border-l-4 ${borderColors.main} transition-all duration-300`}
        style={styles.leftLine}
      />
      
      {/* Right connecting line */}
      <div 
        className={`absolute border-l-4 ${borderColors.main} transition-all duration-300`}
        style={styles.rightLine}
      />
    </div>
  );
});

export default TopChip;