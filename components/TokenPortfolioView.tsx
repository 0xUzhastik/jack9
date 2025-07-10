'use client';

import ChipStack from './ChipStack';
import TokenControls from './TokenControls';
import { useEffect, useRef, useState, memo, useMemo, useCallback } from 'react';
import { 
  TokenRow, 
  percentageToTokenCount, 
} from '@/lib/tokenUtils';
import { 
  getTokenDisplayValues,
  formatCurrencyValue as formatCurrency
} from '@/lib/priceCalculations';
import { useViewportHeight } from '@/hooks/useViewportHeight'; // 🔥 NEW: Import viewport height hook
import { useUIStore } from '@/stores/uiStore';

interface TokenPortfolioViewProps {
  stackValues: number[];
  sliderValues: number[];
  onSliderChange: (index: number, percentage: number) => void;
  filteredTokens?: TokenRow[];
  totalColumns: number;
  getTokenImage: (index: number) => string;
  getTokenSymbol: (index: number) => string;
  getRawTokenAmount: (index: number) => string;
  getColumnForToken: (tokenIndex: number, totalTokens: number) => number;
  tokenPricesInSol: Record<string, number | null>;
  solPrice: number | null;
}

// 🔥 MEMOIZED: Component to prevent unnecessary re-renders
const TokenPortfolioView = memo(function TokenPortfolioView({
  stackValues,
  sliderValues,
  onSliderChange,
  filteredTokens,
  totalColumns,
  getTokenImage,
  getTokenSymbol,
  getRawTokenAmount,
  getColumnForToken,
  tokenPricesInSol,
  solPrice,
}: TokenPortfolioViewProps) {

  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldCenter, setShouldCenter] = useState(false);

  // 🔥 NEW: Get viewport height for responsive scaling (same logic as ChipStack)
  const viewportHeight = useViewportHeight();
  
  // 🔥 NEW: Calculate scale factor based on viewport height (same as ChipStack)
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

  // Check if we should center the grid
  useEffect(() => {
    const checkCentering = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth;
      const scaledColumnWidth = 140 * scaleFactor; // 🔥 NEW: Apply scale factor to column width
      const totalGridWidth = totalColumns * scaledColumnWidth; // 🔥 NEW: Use scaled width
      const paddingWidth = 0; // px-12 = 48px on each side
      const availableWidth = containerWidth - paddingWidth;
      
      // Center only if there's at least 40px extra space
      setShouldCenter(availableWidth > totalGridWidth + 40);
    };

    checkCentering();
    window.addEventListener('resize', checkCentering);
    return () => window.removeEventListener('resize', checkCentering);
  }, [totalColumns, scaleFactor]); // 🔥 NEW: Added scaleFactor dependency

  // 🔥 UNIFIED: Calculate display values using shared utility
  const getDisplayValues = useCallback((index: number) => {
    const token = filteredTokens?.[index];
    if (!token) return { selectedValue: 0, remainingValue: 0 };
    
    const percentage = sliderValues[index] ?? 50;
    return getTokenDisplayValues(token, percentage, tokenPricesInSol, solPrice);
  }, [filteredTokens, tokenPricesInSol, solPrice, sliderValues]);

  // 🔥 MEMOIZED: Calculate two-row layout for selected tokens with bottom row always having more
  // ONLY include tokens that have actually been selected (percentage > 0)
  const selectedTokenLayout = useMemo(() => {
    const selectedTokens = stackValues
      .map((value, index) => ({ value, index }))
      .filter((token, index) => {
        const percentage = sliderValues[index] ?? 0;
        return percentage > 0; // Only include tokens with positive percentages
      });
    
    if (selectedTokens.length === 0) {
      return {
        bottomRow: [],
        topRow: []
      };
    }
    
    if (selectedTokens.length <= 5) {
      // Single row for 5 or fewer tokens
      return {
        bottomRow: selectedTokens,
        topRow: []
      };
    }
    
    // Split into two rows ensuring bottom row always has at least 1 more token
    // Fixed calculation: add 1 to total before dividing to ensure bottom row always has more
    const bottomRowSize = Math.ceil((selectedTokens.length + 1) / 2);
    const topRowSize = selectedTokens.length - bottomRowSize;
    
    const bottomRow = selectedTokens.slice(0, bottomRowSize);
    const topRow = selectedTokens.slice(bottomRowSize);
    
    return { bottomRow, topRow };
  }, [stackValues, sliderValues]);

  const { bottomRow, topRow } = selectedTokenLayout;
  const hasTopRow = topRow.length > 0;
  const hasAnySelected = bottomRow.length > 0;

  return (
    <div className="w-full h-full relative" ref={containerRef}>
      {/* Selected tokens area absolutely positioned above controls, with a 20px gap and max height */}
      <div 
        className="absolute left-0 right-0"
        style={{ 
          // Removed backgroundColor and border for production
          borderRadius: '8px',
          paddingTop: `${32 * scaleFactor}px`,
          bottom: '140px', // 120px controls + 20px gap
          maxHeight: '45%', // Make green area about 45% of parent height
          overflow: 'visible'
        }}
      >
        {/* Only show selected stacks if there are any */}
        {hasAnySelected && (
          <>
            {/* Bottom Row */}
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-center z-20" style={{ minWidth: 'fit-content' }}>
              {bottomRow.map(({ value, index: tokenIndex }, displayIndex) => {
                const { selectedValue } = getDisplayValues(tokenIndex);
                
                return (
                  <div 
                    key={`selected-bottom-${tokenIndex}`} 
                    className="animate-in fade-in duration-300 group relative"
                    style={{
                      // Create extremely tight spacing with heavy overlap
                      marginLeft: displayIndex === 0 ? '0' : `${-60 * scaleFactor}px`, // 🔥 FIXED: Scale overlap
                      zIndex: 100 + bottomRow.length - displayIndex // Higher z-index for bottom row (appears in front)
                    }}
                  >
                    {/* Value card */}
                    <div 
                      className="absolute left-1/2 z-50"
                      style={{ 
                        transform: 'translateX(-50%) scale(1)',
                        bottom: `${32 * scaleFactor}px` // 🔥 FIXED: Scale bottom position
                      }}
                    > 
                      <div 
                        className="rounded-xl border border-[#FFD700]/60 shadow-sm backdrop-blur-sm"
                        style={{
                          background: 'rgba(74, 14, 78, 0.4)',
                          boxShadow: `
                            0 0 4px rgba(255, 215, 0, 0.3),
                            inset 0 0.5px 0 rgba(255, 215, 0, 0.2),
                            inset 0 -0.5px 0 rgba(0, 0, 0, 0.2)
                          `,
                          padding: `${6 * scaleFactor}px ${12 * scaleFactor}px` // 🔥 FIXED: Scale padding
                        }}
                      >
                        <div className="text-center">
                          <div 
                            className="font-bold text-[#FFD700] leading-none"
                            style={{ 
                              fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                              textShadow: "0.5px 0.5px 0 #000000",
                              fontSize: `${10 * scaleFactor}px` // 🔥 FIXED: Scale font size
                            }}
                          >
                            {formatCurrency(selectedValue)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        transform: `scale(0.5)`,
                        transformOrigin: 'center bottom'
                      }}
                    >
                      <ChipStack
                        value={value}
                        showType="selected"
                        sliderValue={selectedValue}
                        tokenImage={getTokenImage(tokenIndex)}
                        tokenSymbol={getTokenSymbol(tokenIndex)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top Row - Much closer and overlapping, behind bottom row */}
            {hasTopRow && (
              <div 
                className="absolute inset-x-0 flex items-end justify-center z-10" 
                style={{ 
                  minWidth: 'fit-content',
                  bottom: `${45 * scaleFactor}px` // 🔥 FIXED: Scale bottom position
                }}
              >
                {/* Offset container by 72px (1/2 chip stack width) to the right */}
                <div 
                  className="flex items-end justify-center"
                  style={{ 
                    marginLeft: `${72 * scaleFactor}px` // 🔥 FIXED: Scale margin
                  }}
                >
                  {topRow.map(({ value, index: tokenIndex }, displayIndex) => {
                    const { selectedValue } = getDisplayValues(tokenIndex);
                    
                    return (
                      <div 
                        key={`selected-top-${tokenIndex}`} 
                        className="animate-in fade-in duration-300 group relative"
                        style={{
                          marginLeft: displayIndex === 0 ? '0' : `${-60 * scaleFactor}px`, // 🔥 FIXED: Scale overlap
                          zIndex: topRow.length - displayIndex // Lower z-index to appear behind bottom row
                        }}
                      >
                        {/* Value card */}
                        <div 
                          className="absolute left-1/2 z-50"
                          style={{ 
                            transform: 'translateX(-50%) scale(1)',
                            bottom: `${32 * scaleFactor}px` // 🔥 FIXED: Scale bottom position
                          }}
                        > 
                          <div 
                            className="rounded-xl border border-[#FFD700]/60 shadow-sm backdrop-blur-sm"
                            style={{
                              background: 'rgba(74, 14, 78, 0.4)',
                              boxShadow: `
                                0 0 4px rgba(255, 215, 0, 0.3),
                                inset 0 0.5px 0 rgba(255, 215, 0, 0.2),
                                inset 0 -0.5px 0 rgba(0, 0, 0, 0.2)
                              `,
                              padding: `${6 * scaleFactor}px ${12 * scaleFactor}px` // 🔥 FIXED: Scale padding
                            }}
                          >
                            <div className="text-center">
                              <div 
                                className="font-bold text-[#FFD700] leading-none"
                                style={{ 
                                  fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                                  textShadow: "0.5px 0.5px 0 #000000",
                                  fontSize: `${10 * scaleFactor}px` // 🔥 FIXED: Scale font size
                                }}
                              >
                                {formatCurrency(selectedValue)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            transform: `scale(0.5)`,
                            transformOrigin: 'center bottom'
                          }}
                        >
                          <ChipStack
                            value={value}
                            showType="selected"
                            sliderValue={selectedValue}
                            tokenImage={getTokenImage(tokenIndex)}
                            tokenSymbol={getTokenSymbol(tokenIndex)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Show message when no tokens are selected */}
        {!hasAnySelected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center"
              style={{ marginTop: '-25px' }}
            >
              <div 
                className="font-bold text-[#FFD700] mb-2"
                style={{ 
                  fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                  textShadow: "0.5px 0.5px 0 #000000",
                  fontSize: `${18 * scaleFactor}px` // 🔥 FIXED: Scale font size
                }}
              >
                No Tokens Selected
              </div>
              <div 
                className="text-[#FFFF00]"
                style={{ 
                  fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                  textShadow: "0.5px 0.5px 0 #000000",
                  fontSize: `${14 * scaleFactor}px` // 🔥 FIXED: Scale font size
                }}
              >
                Use the sliders below to select token amounts
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls pinned to bottom, fixed collapsed height, absolutely positioned */}
      <div className="absolute bottom-0 left-0 w-full" style={{ height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', zIndex: 1000 }}>
        <div className="rounded-lg">
          <div 
            className="col-span-full"
            style={{
              // Removed backgroundColor and border for production
              borderRadius: '8px',
              padding: `${8 * scaleFactor}px 0`,
              height: '100%',
              boxSizing: 'border-box'
            }}
          >
            <TokenControls
              totalColumns={totalColumns}
              stackValues={stackValues}
              filteredTokens={filteredTokens}
              sliderValues={sliderValues} // Now percentages
              onSliderChange={onSliderChange}
              getTokenSymbol={getTokenSymbol}
              getColumnForToken={getColumnForToken}
              getDisplayValues={getDisplayValues}
              tokenPricesInSol={tokenPricesInSol}
              solPrice={solPrice}
              shouldCenter={shouldCenter}
              scaleFactor={scaleFactor} // 🔥 NEW: Pass scale factor to controls
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default TokenPortfolioView;