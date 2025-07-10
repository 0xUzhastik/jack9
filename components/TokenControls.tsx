'use client';

import '../styles/slider.css';
import { useState, useCallback, memo, useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TokenRow,
  percentageToTokenCount,
  formatTokenAmountSmart,
  formatUSDValueSmart
} from '@/lib/tokenUtils';
import {
  handleTokenAmountInput,
  handleUSDAmountInput,
  handlePercentageButtonClick,
  handleSliderChange,
  createFocusHandlers,
  getRawTokenCount,
  getRawUSDValue
} from '@/lib/inputHandlers';
import { useUIStore } from '@/stores/uiStore';
import { Dispatch, SetStateAction } from 'react';

interface TokenControlsProps {
  totalColumns: number;
  stackValues: number[];
  filteredTokens?: TokenRow[];
  sliderValues: number[]; // Now represents percentages (0-100)
  onSliderChange: (index: number, percentage: number) => void; // Now takes percentage
  getTokenSymbol: (index: number) => string;
  getColumnForToken: (tokenIndex: number, totalTokens: number) => number;
  getDisplayValues: (index: number) => { selectedValue: number; remainingValue: number };
  tokenPricesInSol: Record<string, number | null>;
  solPrice: number | null;
  shouldCenter: boolean;
  scaleFactor?: number; // Optional scale factor for responsive sizing
}

// MEMOIZED: Component to prevent unnecessary re-renders
const TokenControls = memo(function TokenControls({
  totalColumns,
  stackValues,
  filteredTokens,
  sliderValues, // Now percentages 0-100
  onSliderChange, // Now takes percentage
  getTokenSymbol,
  getColumnForToken,
  getDisplayValues,
  tokenPricesInSol,
  solPrice,
  shouldCenter,
  scaleFactor = 1 // Default to 1 (no scaling)
}: TokenControlsProps) {

  // State to track which tokens are expanded
  const [expandedTokens, setExpandedTokens] = useState<Set<number>>(new Set());
  
  // UI store for focus management
  const { setInputFocus, focusedInputs } = useUIStore();

  // Create focus handlers using shared utility
  const { handleInputFocus, handleInputBlur, isInputFocused } = createFocusHandlers(
    setInputFocus,
    focusedInputs
  );

  // Toggle expansion for a specific token
  const toggleExpansion = useCallback((tokenIndex: number) => {
    setExpandedTokens(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tokenIndex)) {
        newSet.delete(tokenIndex);
      } else {
        newSet.add(tokenIndex);
      }
      return newSet;
    });
  }, []);

  // Token amount input handler
  const handleTokenInput = useCallback((tokenIndex: number, inputValue: string) => {
    const token = filteredTokens?.[tokenIndex];
    if (!token) return;
    
    handleTokenAmountInput(tokenIndex, inputValue, token, onSliderChange);
  }, [filteredTokens, onSliderChange]);

  // USD amount input handler
  const handleUSDInput = useCallback((tokenIndex: number, inputValue: string) => {
    const token = filteredTokens?.[tokenIndex];
    if (!token) return;
    
    handleUSDAmountInput(tokenIndex, inputValue, token, tokenPricesInSol, solPrice, onSliderChange);
  }, [filteredTokens, tokenPricesInSol, solPrice, onSliderChange]);

  // Percentage button handler
  const handlePercentageClick = useCallback((tokenIndex: number, percentage: number) => {
    handlePercentageButtonClick(tokenIndex, percentage, onSliderChange);
  }, [onSliderChange]);

  // Slider handler with snapping
  const handleSliderPercentageChange = useCallback((tokenIndex: number, percentage: number) => {
    handleSliderChange(tokenIndex, percentage, onSliderChange, true);
  }, [onSliderChange]);

  // Get formatted token count for overlay display
  const getFormattedTokenCount = useCallback((tokenIndex: number) => {
    const tokenCount = getRawTokenCount(tokenIndex, sliderValues, filteredTokens || []);
    return formatTokenAmountSmart(tokenCount);
  }, [sliderValues, filteredTokens]);

  // Get formatted USD value for overlay display
  const getFormattedUSDValue = useCallback((tokenIndex: number) => {
    const usdValue = getRawUSDValue(tokenIndex, getDisplayValues);
    return formatUSDValueSmart(usdValue);
  }, [getDisplayValues]);

  // Generate grid columns for all tokens
  const gridColumns = useMemo(() => {
    return Array.from({ length: totalColumns }, (_, columnIndex) => {
      const columnNumber = columnIndex + 1;

      // Find token that should be in this column
      const tokenIndex = stackValues.findIndex((_, index) =>
        getColumnForToken(index, stackValues.length) === columnNumber
      );

      const hasToken = tokenIndex !== -1;
      const token = hasToken ? filteredTokens?.[tokenIndex] : null;
      const percentage = hasToken ? (sliderValues[tokenIndex] ?? 50) : 0; // Default to 50%
      const isExpanded = hasToken ? expandedTokens.has(tokenIndex) : false;

      return {
        columnNumber,
        tokenIndex,
        hasToken,
        token,
        percentage,
        isExpanded
      };
    });
  }, [
    totalColumns,
    stackValues,
    filteredTokens,
    sliderValues,
    expandedTokens,
    getColumnForToken
  ]);

  return (
    <div
      className="rounded-lg h-full relative flex items-end"
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: shouldCenter ? 'center' : 'start',
        minWidth: shouldCenter ? 'auto' : `${totalColumns * 140 * scaleFactor}px`,
        gap: '0',
        width: '100%',
        height: '100%'
      }}
    >
      {/* Controls Row */}
      {gridColumns.map((cardProps) => (
        <TokenControlCard
          key={`control-col-${cardProps.columnNumber}`}
          {...cardProps}
          token={cardProps.token ?? null}
          scaleFactor={scaleFactor}
          sliderValues={sliderValues}
          filteredTokens={filteredTokens}
          handleTokenInput={handleTokenInput}
          handleUSDInput={handleUSDInput}
          handleInputFocus={handleInputFocus}
          handleInputBlur={handleInputBlur}
          isInputFocused={isInputFocused}
          getRawTokenCount={getRawTokenCount}
          getFormattedTokenCount={getFormattedTokenCount}
          getRawUSDValue={getRawUSDValue}
          getFormattedUSDValue={getFormattedUSDValue}
          getDisplayValues={getDisplayValues}
          getTokenSymbol={getTokenSymbol}
          solPrice={solPrice}
          tokenPricesInSol={tokenPricesInSol}
          handleSliderPercentageChange={handleSliderPercentageChange}
          handlePercentageClick={handlePercentageClick}
          toggleExpansion={toggleExpansion}
        />
      ))}
      
      {/* Enhanced Slider Custom Styles - Compact Version */}
      <style jsx>{`
        :global(.casino-themed-slider-compact [data-radix-slider-track]) {
          background: transparent !important;
          height: ${16 * scaleFactor}px;
          position: relative;
        }
        
        :global(.casino-themed-slider-compact [data-radix-slider-range]) {
          background: transparent !important;
          height: ${16 * scaleFactor}px;
        }
        
        :global(.casino-themed-slider-compact [data-radix-slider-thumb]) {
          width: ${14 * scaleFactor}px;
          height: ${14 * scaleFactor}px;
          background: linear-gradient(45deg, #fbbf24, #f59e0b);
          border: 2px solid #ffffff;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 
            0 0 0 1px #000000,
            0 2px 4px rgba(0, 0, 0, 0.3), 
            0 0 8px rgba(255, 215, 0, 0.6);
          transition: all 0.15s ease;
        }
        
        :global(.casino-themed-slider-compact [data-radix-slider-thumb]:hover) {
          background: linear-gradient(45deg, #f59e0b, #fbbf24);
          transform: scale(1.1);
          box-shadow: 
            0 0 0 1px #000000,
            0 3px 6px rgba(0, 0, 0, 0.4), 
            0 0 12px rgba(255, 215, 0, 0.8);
        }
        
        :global(.casino-themed-slider-compact [data-radix-slider-thumb]:active) {
          transform: scale(1.05);
          box-shadow: 
            0 0 0 1px #000000,
            0 2px 4px rgba(0, 0, 0, 0.3), 
            0 0 8px rgba(255, 215, 0, 0.6);
        }
        
        :global(.casino-themed-slider-compact [data-radix-slider-thumb]:focus) {
          outline: none;
          box-shadow: 
            0 0 0 1px #000000,
            0 2px 4px rgba(0, 0, 0, 0.3), 
            0 0 8px rgba(255, 215, 0, 0.6),
            0 0 0 3px rgba(255, 215, 0, 0.3);
        }
        
        :global(.casino-themed-slider-compact) {
          width: 100%;
          height: ${16 * scaleFactor}px;
          display: flex;
          align-items: center;
          position: relative;
        }
      `}</style>
    </div>
  );
});

// Add TokenControlCard component
interface TokenControlCardProps {
  columnNumber: number;
  tokenIndex: number;
  hasToken: boolean;
  token: TokenRow | null;
  percentage: number;
  isExpanded: boolean;
  scaleFactor: number;
  sliderValues: number[];
  filteredTokens?: TokenRow[];
  handleTokenInput: (tokenIndex: number, inputValue: string) => void;
  handleUSDInput: (tokenIndex: number, inputValue: string) => void;
  handleInputFocus: (inputKey: string) => void;
  handleInputBlur: (inputKey: string) => void;
  isInputFocused: (inputKey: string) => boolean;
  getRawTokenCount: (tokenIndex: number, sliderValues: number[], filteredTokens: TokenRow[]) => number;
  getFormattedTokenCount: (tokenIndex: number) => string;
  getRawUSDValue: (tokenIndex: number, getDisplayValues: (index: number) => { selectedValue: number; remainingValue: number }) => number;
  getFormattedUSDValue: (tokenIndex: number) => string;
  getDisplayValues: (index: number) => { selectedValue: number; remainingValue: number };
  getTokenSymbol: (tokenIndex: number) => string;
  solPrice: number | null;
  tokenPricesInSol: Record<string, number | null>;
  handleSliderPercentageChange: (tokenIndex: number, percentage: number) => void;
  handlePercentageClick: (tokenIndex: number, percentage: number) => void;
  toggleExpansion: (tokenIndex: number) => void;
}

function TokenControlCard({
  columnNumber,
  tokenIndex,
  hasToken,
  token,
  percentage,
  isExpanded,
  scaleFactor,
  sliderValues,
  filteredTokens,
  handleTokenInput,
  handleUSDInput,
  handleInputFocus,
  handleInputBlur,
  isInputFocused,
  getRawTokenCount,
  getFormattedTokenCount,
  getRawUSDValue,
  getFormattedUSDValue,
  getDisplayValues,
  getTokenSymbol,
  solPrice,
  tokenPricesInSol,
  handleSliderPercentageChange,
  handlePercentageClick,
  toggleExpansion
}: TokenControlCardProps) {
  const [expandedHeight, setExpandedHeight] = useState(0);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const expandedContentRef = useRef<HTMLDivElement>(null);
  const COLLAPSED_HEIGHT = 120;
  useLayoutEffect(() => {
    if (isMeasuring && expandedContentRef.current) {
      setExpandedHeight(expandedContentRef.current.scrollHeight);
      setIsMeasuring(false);
    }
  }, [isMeasuring, token, percentage, sliderValues]);
  useEffect(() => {
    if (isExpanded && expandedHeight === 0) {
      setIsMeasuring(true);
    }
  }, [isExpanded, expandedHeight]);
  return (
    <div
      key={`control-col-${columnNumber}`}
      className="flex flex-col items-center px-2 relative"
      style={{
        minWidth: `${140 * scaleFactor}px`,
        maxWidth: `${140 * scaleFactor}px`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        position: 'relative', // Needed for absolute caret
      }}
    >
      {hasToken && token ? (
        <>
          {/* Hidden measurement node for expanded content, only when measuring */}
          {isMeasuring && (
            <div
              ref={expandedContentRef}
              style={{
                position: 'absolute',
                visibility: 'hidden',
                pointerEvents: 'none',
                height: 'auto',
                width: '100%',
                zIndex: -1,
              }}
            >
              <div className="space-y-3 border-t border-[#FFD700]/40 pt-3 mt-3">
                {/* Token Amount and USD Value inputs, overlays, etc. (copy from expanded content) */}
                {/* Token Count Input Container with Overlay */}
                <div>
                  <div className="text-xs font-bold text-[#FFD700] leading-none text-center mb-1"
                       style={{ 
                         fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                         textShadow: "0.5px 0.5px 0 #000000",
                         fontSize: `${12 * scaleFactor}px` // Scale label font size
                       }}>
                   Token Amount
                  </div>
                  <div 
                    className="w-full px-2 py-2 rounded-lg border border-[#FFD700]/60 shadow-sm backdrop-blur-sm relative"
                    style={{
                      background: 'rgba(74, 14, 78, 0.6)',
                      boxShadow: `
                        0 0 6px rgba(255, 215, 0, 0.4),
                        inset 0 1px 0 rgba(255, 215, 0, 0.2),
                        inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                      `,
                      borderRadius: '8px'
                    }}
                  >
                    {/* ACTUAL INPUT - Always has raw numeric value */}
                    <input
                      type="number"
                      min="0"
                      max={token.amount}
                      step={1 / Math.pow(10, Math.min(token.decimals, 6))}
                      value={getRawTokenCount(tokenIndex, sliderValues, filteredTokens || [])}
                      onChange={(e) => handleTokenInput(tokenIndex, e.target.value)}
                      onFocus={() => handleInputFocus(`token-${tokenIndex}`)}
                      onBlur={() => handleInputBlur(`token-${tokenIndex}`)}
                      className={`w-full bg-transparent border-none outline-none text-center font-bold text-[#FFD700] leading-none ${
                        isInputFocused(`token-${tokenIndex}`) ? 'opacity-100' : 'opacity-0'
                      } transition-opacity duration-150`}
                      style={{ 
                        fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                        textShadow: "0.5px 0.5px 0 #000000",
                        fontSize: `${14 * scaleFactor}px` // Scale input font size
                      }}
                      placeholder="0"
                    />
                    {/* OVERLAY - Shows formatted value when not focused */}
                    {!isInputFocused(`token-${tokenIndex}`) && (
                      <div
                        className="absolute inset-0 flex items-center justify-center text-center font-bold text-[#FFD700] leading-none pointer-events-none"
                        style={{ 
                          fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                          textShadow: "0.5px 0.5px 0 #000000",
                          fontSize: `${14 * scaleFactor}px` // Scale overlay font size
                        }}
                      >
                        {getFormattedTokenCount(tokenIndex)}
                      </div>
                    )}
                  </div>
                </div>
                {/* USD Input Container with Overlay */}
                <div>
                  <div className="text-xs font-bold text-[#00FFFF] leading-none text-center mb-1"
                       style={{ 
                         fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                         textShadow: "0.5px 0.5px 0 #000000",
                         fontSize: `${12 * scaleFactor}px` // Scale label font size
                       }}>
                   USD Value
                  </div>
                  <div 
                    className="w-full px-2 py-2 rounded-lg border border-[#00FFFF]/60 shadow-sm backdrop-blur-sm relative"
                    style={{
                      background: 'rgba(74, 14, 78, 0.6)',
                      boxShadow: `
                        0 0 6px rgba(0, 255, 255, 0.4),
                        inset 0 1px 0 rgba(0, 255, 255, 0.2),
                        inset 0 -2px 0 rgba(0, 0, 0, 0.2)
                      `,
                      borderRadius: '8px'
                    }}
                  >
                    {/* ACTUAL INPUT - Always has raw numeric value */}
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={getRawUSDValue(tokenIndex, getDisplayValues)}
                      onChange={(e) => handleUSDInput(tokenIndex, e.target.value)}
                      onFocus={() => handleInputFocus(`usd-${tokenIndex}`)}
                      onBlur={() => handleInputBlur(`usd-${tokenIndex}`)}
                      className={`w-full bg-transparent border-none outline-none text-center font-bold text-[#00FFFF] leading-none ${
                        isInputFocused(`usd-${tokenIndex}`) ? 'opacity-100' : 'opacity-0'
                      } transition-opacity duration-150`}
                      style={{ 
                        fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                        textShadow: "0.5px 0.5px 0 #000000",
                        fontSize: `${14 * scaleFactor}px` // Scale input font size
                      }}
                      placeholder="0"
                    />
                    {/* OVERLAY - Shows formatted value when not focused */}
                    {!isInputFocused(`usd-${tokenIndex}`) && (
                      <div
                        className="absolute inset-0 flex items-center justify-center text-center font-bold text-[#00FFFF] leading-none pointer-events-none"
                        style={{ 
                          fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                          textShadow: "0.5px 0.5px 0 #000000",
                          fontSize: `${14 * scaleFactor}px` // Scale overlay font size
                        }}
                      >
                        {getFormattedUSDValue(tokenIndex)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <motion.div 
            className="w-full"
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              overflow: 'hidden',
            }}
            animate={{
              height: isExpanded && expandedHeight ? Math.max(expandedHeight, 280) + 'px' : COLLAPSED_HEIGHT + 'px',
            }}
            initial={false}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.3
            }}
            layout={false}
          >
            <div 
              className="w-full rounded-xl border border-[#FFD700]/60 shadow-sm backdrop-blur-sm relative overflow-hidden"
              style={{
                background: 'rgba(74, 14, 78, 0.4)',
                boxShadow: isExpanded 
                  ? `
                    0 8px 32px rgba(0, 0, 0, 0.6),
                    0 0 20px rgba(255, 215, 0, 0.8),
                    inset 0 1px 0 rgba(255, 215, 0, 0.3)
                  `
                  : `
                    0 0 4px rgba(255, 215, 0, 0.3),
                    inset 0 0.5px 0 rgba(255, 215, 0, 0.2),
                    inset 0 -0.5px 0 rgba(0, 0, 0, 0.2)
                  `,
                borderWidth: isExpanded ? '2px' : '1px',
                borderColor: isExpanded ? '#FFD700' : 'rgba(255, 215, 0, 0.6)',
              }}
            >
              <div className="px-3 py-1 flex flex-col">
                {/* BASIC CONTROLS: Always visible at top */}
                
                {/* Token symbol */}
                <div 
                  className="text-sm font-bold text-[#FFD700] mb-1 text-center leading-none"
                  style={{ 
                    fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                    textShadow: "0.5px 0.5px 0 #000000",
                    fontSize: `${14 * scaleFactor}px` // Scale font size
                  }}
                >
                  {getTokenSymbol(tokenIndex)}
                </div>

                {/* FIXED: Added Token Amount and USD Value in main view */}
                <div className="flex justify-between items-center mb-1">
                  {/* Token Amount */}
                  <div
                    className="relative flex-1 min-w-0 text-center"
                    style={{ 
                      fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                      textShadow: "0.5px 0.5px 0 #000000",
                      fontSize: `${12 * scaleFactor}px` 
                    }}
                  >
                    <div
                      className="cursor-pointer casino-text-gold font-bold"
                      onClick={() => handleInputFocus(`token-${tokenIndex}`)}
                    >
                      {getFormattedTokenCount(tokenIndex)}
                    </div>
                  </div>
                  
                  {/* USD Value */}
                  {solPrice && tokenPricesInSol && tokenPricesInSol[token.mint] && (
                    <div
                      className="relative flex-1 min-w-0 text-center"
                      style={{ 
                        fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                        textShadow: "0.5px 0.5px 0 #000000",
                        fontSize: `${12 * scaleFactor}px` 
                      }}
                    >
                      <div
                        className="cursor-pointer casino-text-green-400 font-bold"
                        onClick={() => handleInputFocus(`usd-${tokenIndex}`)}
                      >
                        {getFormattedUSDValue(tokenIndex)}
                      </div>
                    </div>
                  )}
                </div>

                {/* FIXED: Slider with proper interaction and closer labels */}
                <div className="relative w-full px-1 py-1 mb-1"> {/* Reduced mb-2 to mb-1 */}
                  {/* FIXED: Custom visible track background - pointer-events-none to allow slider interaction */}
                  <div 
                    className="absolute top-1/2 left-1 right-1 transform -translate-y-1/2 border border-black pointer-events-none"
                    style={{
                      height: `${8 * scaleFactor}px`, // Scale track height
                      background: 'linear-gradient(90deg, #374151, #4B5563)',
                      borderRadius: `${6 * scaleFactor}px`, // Scale border radius
                      boxShadow: `
                        inset 0 1px 2px rgba(0, 0, 0, 0.3),
                        0 0 4px rgba(255, 215, 0, 0.2)
                      `
                    }}
                  />
                  
                  {/* FIXED: Progress fill - pointer-events-none to allow slider interaction */}
                  <div 
                    className="absolute top-1/2 left-1 transform -translate-y-1/2 pointer-events-none"
                    style={{
                      width: `calc((100% - 8px) * ${percentage / 100})`, // Fixed calculation
                      height: `${8 * scaleFactor}px`, // Scale fill height
                      background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
                      borderRadius: `${6 * scaleFactor}px`, // Scale border radius
                      boxShadow: `
                        inset 0 1px 1px rgba(0, 0, 0, 0.2),
                        0 0 6px rgba(255, 215, 0, 0.4)
                      `
                    }}
                  />
                  
                  <Slider
                    value={[percentage]}
                    max={100}
                    min={0}
                    step={1}
                    onValueChange={([value]) => handleSliderPercentageChange(tokenIndex, value)}
                    className="casino-themed-slider-compact rounded-lg relative z-10"
                  />
                </div>

                {/* FIXED: Labels closer to slider */}
                <div className="flex justify-between text-xs casino-text-yellow font-bold px-1">
                  <span 
                    className="cursor-pointer hover:text-[#FFFF00] transition-colors"
                    onClick={() => handlePercentageClick(tokenIndex, 0)}
                    style={{ fontSize: `${10 * scaleFactor}px` }}
                  >
                    0%
                  </span>
                  <span 
                    className="cursor-pointer hover:text-[#FFFF00] transition-colors"
                    onClick={() => handlePercentageClick(tokenIndex, 50)}
                    style={{ fontSize: `${10 * scaleFactor}px` }}
                  >
                    50%
                  </span>
                  <span 
                    className="cursor-pointer hover:text-[#FFFF00] transition-colors"
                    onClick={() => handlePercentageClick(tokenIndex, 100)}
                    style={{ fontSize: `${10 * scaleFactor}px` }}
                  >
                    100%
                  </span>
                </div>

                {/* EXPANDED INPUT FIELDS: Show below basic controls when expanded */}
                <AnimatePresence mode="wait">
                  {isExpanded && !isMeasuring && (
                    <motion.div
                      initial={{ 
                        opacity: 0, 
                        scale: 0.9
                      }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1
                      }}
                      exit={{ 
                        opacity: 0, 
                        scale: 0.9
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        duration: 0.3
                      }}
                      className="space-y-3 border-t border-[#FFD700]/40 pt-3 mt-3"
                    >
                      {/* Token Count Input Container with Overlay */}
                      <div>
                        <div className="text-xs font-bold text-[#FFD700] leading-none text-center mb-1"
                             style={{ 
                               fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                               textShadow: "0.5px 0.5px 0 #000000",
                               fontSize: `${12 * scaleFactor}px` // Scale label font size
                             }}>
                         Token Amount
                        </div>
                        <div 
                          className="w-full px-2 py-2 rounded-lg border border-[#FFD700]/60 shadow-sm backdrop-blur-sm relative"
                          style={{
                            background: 'rgba(74, 14, 78, 0.6)',
                            boxShadow: `
                              0 0 6px rgba(255, 215, 0, 0.4),
                              inset 0 1px 0 rgba(255, 215, 0, 0.2),
                              inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                            `,
                            borderRadius: '8px'
                          }}
                        >
                          {/* ACTUAL INPUT - Always has raw numeric value */}
                          <input
                            type="number"
                            min="0"
                            max={token.amount}
                            step={1 / Math.pow(10, Math.min(token.decimals, 6))}
                            value={getRawTokenCount(tokenIndex, sliderValues, filteredTokens || [])}
                            onChange={(e) => handleTokenInput(tokenIndex, e.target.value)}
                            onFocus={() => handleInputFocus(`token-${tokenIndex}`)}
                            onBlur={() => handleInputBlur(`token-${tokenIndex}`)}
                            className={`w-full bg-transparent border-none outline-none text-center font-bold text-[#FFD700] leading-none ${
                              isInputFocused(`token-${tokenIndex}`) ? 'opacity-100' : 'opacity-0'
                            } transition-opacity duration-150`}
                            style={{ 
                              fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                              textShadow: "0.5px 0.5px 0 #000000",
                              fontSize: `${14 * scaleFactor}px` // Scale input font size
                            }}
                            placeholder="0"
                          />
                          {/* OVERLAY - Shows formatted value when not focused */}
                          {!isInputFocused(`token-${tokenIndex}`) && (
                            <div
                              className="absolute inset-0 flex items-center justify-center text-center font-bold text-[#FFD700] leading-none pointer-events-none"
                              style={{ 
                                fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                                textShadow: "0.5px 0.5px 0 #000000",
                                fontSize: `${14 * scaleFactor}px` // Scale overlay font size
                              }}
                            >
                              {getFormattedTokenCount(tokenIndex)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* USD Input Container with Overlay */}
                      <div>
                        <div className="text-xs font-bold text-[#00FFFF] leading-none text-center mb-1"
                             style={{ 
                               fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                               textShadow: "0.5px 0.5px 0 #000000",
                               fontSize: `${12 * scaleFactor}px` // Scale label font size
                             }}>
                         USD Value
                        </div>
                        <div 
                          className="w-full px-2 py-2 rounded-lg border border-[#00FFFF]/60 shadow-sm backdrop-blur-sm relative"
                          style={{
                            background: 'rgba(74, 14, 78, 0.6)',
                            boxShadow: `
                              0 0 6px rgba(0, 255, 255, 0.4),
                              inset 0 1px 0 rgba(0, 255, 255, 0.2),
                              inset 0 -2px 0 rgba(0, 0, 0, 0.2)
                            `,
                            borderRadius: '8px'
                          }}
                        >
                          {/* ACTUAL INPUT - Always has raw numeric value */}
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={getRawUSDValue(tokenIndex, getDisplayValues)}
                            onChange={(e) => handleUSDInput(tokenIndex, e.target.value)}
                            onFocus={() => handleInputFocus(`usd-${tokenIndex}`)}
                            onBlur={() => handleInputBlur(`usd-${tokenIndex}`)}
                            className={`w-full bg-transparent border-none outline-none text-center font-bold text-[#00FFFF] leading-none ${
                              isInputFocused(`usd-${tokenIndex}`) ? 'opacity-100' : 'opacity-0'
                            } transition-opacity duration-150`}
                            style={{ 
                              fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                              textShadow: "0.5px 0.5px 0 #000000",
                              fontSize: `${14 * scaleFactor}px` // Scale input font size
                            }}
                            placeholder="0"
                          />
                          {/* OVERLAY - Shows formatted value when not focused */}
                          {!isInputFocused(`usd-${tokenIndex}`) && (
                            <div
                              className="absolute inset-0 flex items-center justify-center text-center font-bold text-[#00FFFF] leading-none pointer-events-none"
                              style={{ 
                                fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                                textShadow: "0.5px 0.5px 0 #000000",
                                fontSize: `${14 * scaleFactor}px` // Scale overlay font size
                              }}
                            >
                              {getFormattedUSDValue(tokenIndex)}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Chevron Button - always visible, at bottom, with spacing */}
              <div className="flex justify-center mt-2 mb-1">
                <button
                  onClick={() => toggleExpansion(tokenIndex)}
                  className="rounded-full hover:bg-[#FFD70020] transition-colors"
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                >
                  <motion.div
                    animate={{ rotate: isExpanded ? 0 : 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="text-[#FFD700]" style={{ width: `${16 * scaleFactor}px`, height: `${16 * scaleFactor}px` }} />
                  </motion.div>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </div>
  );
}

export default TokenControls;