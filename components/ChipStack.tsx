'use client';

import { useState, useMemo } from 'react';
import TopChip from './TopChip';
import BottomChip from './BottomChip';
import { CHIP_DENOMINATIONS } from '@/constants/denominations';
import { useViewportHeight } from '@/hooks/useViewportHeight';

interface ChipStackProps {
  value: number; // Dollar amount
  tokenImage?: string;
  tokenSymbol?: string; // Add token symbol prop
  showType?: 'remaining' | 'selected' | 'both'; // New prop to control what to show
  sliderValue?: number; // External slider value
  onSliderChange?: (value: number) => void; // External slider change handler
}

export default function ChipStack({ 
  value,
  tokenImage = "https://dd.dexscreener.com/ds-data/tokens/solana/DiZZY2UQ2HSVsFDF6jADc6YYATiTfnQFw4Be1udRZmaY.png?size=lg&key=261208",
  tokenSymbol = "TOKEN", // Default fallback
  showType = 'both',
  sliderValue: externalSliderValue,
  onSliderChange
}: ChipStackProps) {
  const [internalSliderValue, setInternalSliderValue] = useState(0);
  
  // 🔥 NEW: Get viewport height for responsive scaling
  const viewportHeight = useViewportHeight();
  
  // 🔥 NEW: Calculate scale factor based on viewport height
  const scaleFactor = useMemo(() => {
    if (viewportHeight === 0) return 1; // Default scale while loading
    if (viewportHeight < 820) {
      // Scale down progressively for smaller screens
      // At 820px: scale = 1.0
      // At 700px: scale = 0.85
      // At 600px: scale = 0.75
      const minScale = 0.75;
      const maxScale = 1.0;
      const minHeight = 600;
      const maxHeight = 820;
      
      const clampedHeight = Math.max(minHeight, Math.min(maxHeight, viewportHeight));
      const scale = minScale + (maxScale - minScale) * ((clampedHeight - minHeight) / (maxHeight - minHeight));
      
      return Math.round(scale * 100) / 100; // Round to 2 decimal places
    }
    return 1; // No scaling for heights >= 820px
  }, [viewportHeight]);
  
  // Use external slider value if provided, otherwise use internal
  const sliderValue = externalSliderValue !== undefined ? externalSliderValue : internalSliderValue;
  
  const handleSliderChange = (newValue: number) => {
    if (onSliderChange) {
      onSliderChange(newValue);
    } else {
      setInternalSliderValue(newValue);
    }
  };

  // Calculate values based on showType
  let displayValue: number;
  let selectedValue: number;
  let remainingValue: number;

  if (showType === 'selected') {
    // For selected display: sliderValue is the selected amount
    displayValue = sliderValue;
    selectedValue = sliderValue;
    remainingValue = value - sliderValue;
  } else if (showType === 'remaining') {
    // For remaining display: sliderValue is the remaining amount
    displayValue = sliderValue;
    selectedValue = value - sliderValue; // Calculate selected from remaining
    remainingValue = sliderValue;
  } else {
    // For 'both' display: sliderValue is the selected amount
    selectedValue = sliderValue;
    remainingValue = value - sliderValue;
    displayValue = sliderValue; // Default to selected for 'both' mode
  }

  // 🔥 FIXED: Create chip composition based on displayValue instead of total value
  const chipComposition = useMemo(() => {
    const chips: Array<{ value: number; color: string; textColor: string; name: string; id: string }> = [];
    
    // Use displayValue for chip calculation, not the total value
    let remaining = Math.round(displayValue * 100) / 100; // Round to avoid floating point errors
    let chipId = 0;

    // If no value to display, return empty array
    if (remaining <= 0) {
      return chips;
    }

    // Process whole dollar denominations first
    CHIP_DENOMINATIONS.forEach(denom => {
      const count = Math.floor(remaining / denom.value);
      for (let i = 0; i < count; i++) {
        chips.push({ 
          ...denom, 
          id: `${showType}-${denom.value}-${chipId++}`
        });
      }
      remaining = Math.round((remaining - count * denom.value) * 100) / 100;
    });

    // Add single penny chip for any remaining fractional amount
    if (remaining > 0.001) { // Use small epsilon to avoid floating point issues
      chips.push({
        value: remaining,
        color: 'bg-gray-300',
        textColor: 'black',
        name: `${Math.round(remaining * 100)}¢`,
        id: `${showType}-penny-${chipId++}`
      });
    }

    return chips.reverse(); // Highest value chips at bottom
  }, [displayValue, showType]); // 🔥 FIXED: Depend on displayValue and showType instead of value

  const gapBetweenLayers = 30 * scaleFactor; // 🔥 NEW: Scale gap between layers
  // Fixed container height to prevent bouncing
  const CONTAINER_HEIGHT = 300 * scaleFactor; // 🔥 NEW: Scale container height

  // 🔥 MEMOIZED: Render chip stack to prevent unnecessary recalculations
  const renderChipStack = useMemo(() => {
    return (stackChips: typeof chipComposition, isSelected = false, stackValue: number) => {
      if (stackChips.length === 0) {
        // Show placeholder for empty stacks
        const placeholderText = isSelected ? "" : "All chips moved";
        
        return (
          <div className="flex flex-col items-center">
           
            <div 
              className="relative"
              style={{ 
                height: `${CONTAINER_HEIGHT}px`,
                width: `${120 * scaleFactor}px`, // 🔥 NEW: Scale width
                transform: `scale(${scaleFactor})`, // 🔥 NEW: Apply overall scale
                transformOrigin: 'center bottom'
              }}
            >
              <div 
                className="absolute bottom-0 left-0 border-4 border-dashed border-gray-500 rounded-full flex items-center justify-center text-gray-500 text-sm"
                style={{
                  width: `${144 * scaleFactor}px`, // 🔥 NEW: Scale placeholder size
                  height: `${144 * scaleFactor}px`
                }}
              >
                {placeholderText}
              </div>
            </div>
          </div>
        );
      }

      const stackHeight = stackChips.length;
      
      // Calculate starting position so the bottom chip is always at the same place
      const bottomChipBottom = CONTAINER_HEIGHT - (180 * scaleFactor); // 🔥 NEW: Scale bottom position
      const topChipTop = bottomChipBottom - (stackHeight - 1) * gapBetweenLayers; // Calculate where top chip should start

      return (
        <div className="flex flex-col items-center">
          <div 
            className="relative transition-all duration-500 ease-in-out"
            style={{ 
              transform: `rotateX(60deg) scale(${scaleFactor})`, // 🔥 NEW: Apply scale to entire stack
              transformStyle: 'preserve-3d',
              transformOrigin: 'center bottom',
              width: `${144 * scaleFactor}px`, // 🔥 NEW: Scale width
              height: `${CONTAINER_HEIGHT}px` // Fixed height
            }}
          >
            {stackChips.map((chip, index) => {
              const chipZIndex = stackHeight - index;
              
              if (index === 0) {
                // TopChip: renders top circle at position 0, bottom circle at position 1
                return (
                  <TopChip
                    key={chip.id}
                    imageUrl={tokenImage}
                    text="Dynamic token text" // This will be overridden by tokenSymbol
                    chipValue={chip.value}
                    position={{ top: topChipTop, left: 0 }}
                    zIndex={chipZIndex}
                    isSelected={isSelected}
                    stackHeight={stackHeight}
                    gapBetweenLayers={gapBetweenLayers}
                    tokenSymbol={tokenSymbol} // Pass the token symbol for dynamic text generation
                    scaleFactorProp={scaleFactor} // 🔥 NEW: Pass scale factor to TopChip
                  />
                );
              }
              
              // BottomChip: renders at position (index + 1) to account for TopChip's bottom circle
              const bottomChipPosition = topChipTop + (index + 1) * gapBetweenLayers;
              
              return (
                <BottomChip
                  key={chip.id}
                  chipValue={chip.value}
                  position={{ 
                    top: bottomChipPosition,
                    left: 0 
                  }}
                  zIndex={chipZIndex}
                  isSelected={isSelected}
                  scaleFactorProp={scaleFactor} // 🔥 NEW: Pass scale factor to BottomChip
                />
              );
            })}
          </div>
        </div>
      );
    };
  }, [tokenImage, tokenSymbol, chipComposition, scaleFactor, CONTAINER_HEIGHT, gapBetweenLayers]); // 🔥 NEW: Added scaleFactor dependencies

  if (showType === 'remaining') {
    return renderChipStack(chipComposition, false, displayValue);
  }
  
  if (showType === 'selected') {
    return renderChipStack(chipComposition, true, displayValue);
  }

  // 'both' mode - show both selected and remaining stacks
  // 🔥 FIXED: Calculate separate chip compositions for both stacks
  const selectedChips = useMemo(() => {
    if (selectedValue <= 0) return [];
    
    const chips: Array<{ value: number; color: string; textColor: string; name: string; id: string }> = [];
    let remaining = Math.round(selectedValue * 100) / 100;
    let chipId = 0;

    CHIP_DENOMINATIONS.forEach(denom => {
      const count = Math.floor(remaining / denom.value);
      for (let i = 0; i < count; i++) {
        chips.push({ 
          ...denom, 
          id: `selected-${denom.value}-${chipId++}`
        });
      }
      remaining = Math.round((remaining - count * denom.value) * 100) / 100;
    });

    if (remaining > 0.001) {
      chips.push({
        value: remaining,
        color: 'bg-gray-300',
        textColor: 'black',
        name: `${Math.round(remaining * 100)}¢`,
        id: `selected-penny-${chipId++}`
      });
    }

    return chips.reverse();
  }, [selectedValue]);

  const remainingChips = useMemo(() => {
    if (remainingValue <= 0) return [];
    
    const chips: Array<{ value: number; color: string; textColor: string; name: string; id: string }> = [];
    let remaining = Math.round(remainingValue * 100) / 100;
    let chipId = 0;

    CHIP_DENOMINATIONS.forEach(denom => {
      const count = Math.floor(remaining / denom.value);
      for (let i = 0; i < count; i++) {
        chips.push({ 
          ...denom, 
          id: `remaining-${denom.value}-${chipId++}`
        });
      }
      remaining = Math.round((remaining - count * denom.value) * 100) / 100;
    });

    if (remaining > 0.001) {
      chips.push({
        value: remaining,
        color: 'bg-gray-300',
        textColor: 'black',
        name: `${Math.round(remaining * 100)}¢`,
        id: `remaining-penny-${chipId++}`
      });
    }

    return chips.reverse();
  }, [remainingValue]);

  // Fixed total height for both stacks
  const maxTotalHeight = CONTAINER_HEIGHT + (10 * scaleFactor); // 🔥 NEW: Scale padding

  // Helper function to get chip breakdown for display
  const getChipBreakdown = (stackChips: typeof chipComposition) => {
    const breakdown: { [key: string]: number } = {};
    
    stackChips.forEach(chip => {
      const key = chip.value < 1 ? 'pennies' : chip.name;
      breakdown[key] = (breakdown[key] || 0) + 1;
    });
    
    return breakdown;
  };

  const remainingBreakdown = getChipBreakdown(remainingChips);
  const selectedBreakdown = getChipBreakdown(selectedChips);

  return (
    <div className="flex flex-col items-center" style={{ minHeight: `${maxTotalHeight + (100 * scaleFactor)}px` }}>
      <div className="flex items-end gap-16 mb-8" style={{ minHeight: `${maxTotalHeight}px` }}>
        <div className="flex flex-col items-center">
          <div className="text-lg font-semibold text-white mb-4 text-center">
            Remaining
          </div>  
          {/* {renderChipStack(remainingChips, false, remainingValue)} */}
        </div>

        <div className="flex flex-col items-center">
          <div className="text-lg font-semibold text-yellow-400 mb-4 text-center">
            Selected
          </div>

        </div>
      </div>

      <div className="flex flex-col items-center bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="flex gap-8 mb-6">
          <div className="text-center">
            <div className="text-sm text-gray-300 mb-1">Remaining</div>
            <div className="text-2xl font-bold text-white">
              ${remainingValue.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">
              {remainingChips.length} chips
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-yellow-300 mb-1">Selected</div>
            <div className="text-2xl font-bold text-yellow-400">
              ${selectedValue.toFixed(2)}
            </div>
            <div className="text-xs text-yellow-300">
              {selectedChips.length} chips
            </div>
          </div>
        </div>

        <div className="flex gap-8 mb-6 text-xs">
          <div className="text-center min-w-[120px]">
            <div className="text-gray-300 mb-2">Remaining Chips</div>
            {remainingChips.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-1">
                {Object.entries(remainingBreakdown).map(([chipType, count]) => (
                  <span key={chipType} className={`px-2 py-1 rounded text-xs ${
                    chipType === 'pennies' ? 'bg-gray-400 text-black' : 'bg-gray-700 text-white'
                  }`}>
                    {count}×{chipType === 'pennies' ? 'Pennies' : chipType}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">No chips</div>
            )}
          </div>

          <div className="text-center min-w-[120px]">
            <div className="text-yellow-300 mb-2">Selected Chips</div>
            {selectedChips.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-1">
                {Object.entries(selectedBreakdown).map(([chipType, count]) => (
                  <span key={chipType} className={`px-2 py-1 rounded text-xs ${
                    chipType === 'pennies' ? 'bg-gray-400 text-black' : 'bg-yellow-600 text-black'
                  }`}>
                    {count}×{chipType === 'pennies' ? 'Pennies' : chipType}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">No chips</div>
            )}
          </div>
        </div>

        <div className="w-80">
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>$0.00</span>
            <span className="font-medium">
              Selected: ${selectedValue.toFixed(2)}
            </span>
            <span>Max: ${value.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={value}
            step="0.01"
            value={sliderValue}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${(selectedValue / value) * 100}%, #374151 ${(selectedValue / value) * 100}%, #374151 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Remaining: {remainingChips.length} chips</span>
            <span>Selected: {selectedChips.length} chips</span>
          </div>
          <style jsx>{`
            .slider::-webkit-slider-thumb {
              appearance: none;
              height: 24px;
              width: 24px;
              border-radius: 50%;
              background: linear-gradient(45deg, #fbbf24, #f59e0b);
              cursor: pointer;
              border: 3px solid #ffffff;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
              transition: all 0.2s ease;
            }
            .slider::-webkit-slider-thumb:hover {
              transform: scale(1.1);
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
            }
            .slider::-moz-range-thumb {
              height: 24px;
              width: 24px;
              border-radius: 50%;
              background: linear-gradient(45deg, #fbbf24, #f59e0b);
              cursor: pointer;
              border: 3px solid #ffffff;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            }
          `}</style>
        </div>

        {/* 🔥 NEW: Scale factor indicator (only in development) */}
        {process.env.NODE_ENV === 'development' && scaleFactor !== 1 && (
          <div className="mt-4 text-xs text-blue-400 bg-black/20 p-2 rounded">
            🔧 Chip scale: {scaleFactor}x (vh: {viewportHeight}px)
          </div>
        )}

        <div className="mt-4 text-xs text-green-400 bg-black/20 p-2 rounded">
          ✓ Dynamic spacing system - perfectly fills chip circumference
        </div>
      </div>
    </div>
  );
}