"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Edit, Plus, Minus, Coins, ArrowLeftRight } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { TokenRow } from "@/lib/tokenUtils";
import { formatAmount } from "@/lib/tokenUtils";
import { calculateMaxUSDValueSafe, formatTokenAmountForDisplay, formatUSDValueForDisplay } from "@/lib/tokenSelectorUtils";
import { 
  handleTokenAmountChange, 
  handleUSDAmountChange, 
  handleSliderChange, 
  updateTokenAmountFromUSD, 
  updateUSDAmountFromToken,
  handleQuickPercentageSelect
} from "@/lib/tokenSelectorHandlers";
import { useUIStore } from "@/stores/uiStore";
import { createFocusHandlers } from "@/lib/inputHandlers";

interface MobileTokenRowProps {
  token: TokenRow;
  isSelected: boolean;
  isExpanded?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  onAmountChange?: (amount: number) => void;
  onToggleExpand?: () => void;
  selectedAmount?: number;
  usdValue?: number | null;
  solPrice?: number | null;
  tokenPriceInSol?: number | null;
}

export function MobileTokenRow({
  token,
  isSelected,
  isExpanded = false,
  onSelect,
  onRemove,
  onAmountChange,
  onToggleExpand,
  selectedAmount,
  usdValue,
  solPrice,
  tokenPriceInSol,
}: MobileTokenRowProps) {
  const [tempAmount, setTempAmount] = useState(
    selectedAmount ?? (isSelected ? token.amount * 0.5 : token.amount)
  );
  const [tempUSDAmount, setTempUSDAmount] = useState(0);
  const [lastModified, setLastModified] = useState<'token' | 'usd'>('token');

  // Focus tracking for inputs
  const { setInputFocus, focusedInputs } = useUIStore();
  const { handleInputFocus, handleInputBlur, isInputFocused } = createFocusHandlers(
    setInputFocus,
    focusedInputs
  );

  // Calculate max USD value
  const maxUSDValue = useMemo(() => {
    return calculateMaxUSDValueSafe(token, tokenPriceInSol, solPrice);
  }, [token, tokenPriceInSol, solPrice]);

  useEffect(() => {
    if (selectedAmount !== undefined) setTempAmount(selectedAmount);
  }, [selectedAmount]);

  // Update USD when token amount changes
  useEffect(() => {
    if (lastModified === 'token') {
      updateUSDAmountFromToken(token, tempAmount, tokenPriceInSol, solPrice, setTempUSDAmount);
    }
  }, [tempAmount, solPrice, tokenPriceInSol, token, lastModified]);

  // Update token amount when USD changes
  useEffect(() => {
    if (lastModified === 'usd') {
      updateTokenAmountFromUSD(token, tempUSDAmount, tokenPriceInSol, solPrice, setTempAmount);
    }
  }, [tempUSDAmount, solPrice, tokenPriceInSol, token, lastModified]);

  const confirm = () => {
    if (tempAmount === 0) {
      onRemove?.();
    } else {
      onAmountChange?.(tempAmount);
    }
    onToggleExpand?.();
  };

  // Calculate display amount and USD value
  const displayAmount = isSelected ? (selectedAmount ?? token.amount) : token.amount;
  const displayUSDValue = usdValue !== null && usdValue !== undefined ? 
    Math.floor((displayAmount / token.amount) * usdValue * 100) / 100 : null;

  return (
    <motion.div
      layoutId={token.mint}
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        backgroundColor: isSelected ? "rgba(255, 215, 0, 0.1)" : "rgba(74, 14, 78, 0.3)"
      }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 25,
        duration: 0.3
      }}
      className={`relative overflow-hidden transition-all duration-300 mb-2 ${
        isSelected
          ? "bg-[#FFD700]/10 border-2 border-[#FFD700]"
          : "border-2 border-transparent hover:border-[#FFD700]/50 hover:bg-[#FFD700]/5"
      }`}
      style={{
        borderRadius: "12px"
      }}
    >
      {/* Main Row Content */}
      <div className="p-3">
        {/* Token Info Row */}
        <div className="flex items-center gap-3">
          {/* Token Image & Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image
                src={token.image}
                alt={token.symbol}
                fill
                className="rounded-full object-cover"
                onError={(e) =>
                  ((e.target as HTMLImageElement).src = "/jackpotlogo.png")
                }
              />
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-[#FFD700] rounded-full flex items-center justify-center border-2 border-[#2D0A30]"
                >
                  <Check className="h-2.5 w-2.5 text-black" />
                </motion.div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div
                className="text-base font-black casino-text-gold truncate"
                style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}
              >
                {token.symbol}
              </div>
              
              {/* Token Amount */}
              <div className="text-sm casino-text-yellow font-bold truncate">
                {isSelected 
                  ? `Selected: ${formatAmount(selectedAmount ?? token.amount, token.decimals)}`
                  : `Balance: ${formatAmount(token.amount, token.decimals)}`
                }
              </div>
              
              {/* USD Value */}
              {displayUSDValue !== null && displayUSDValue > 0 && (
                <div className="text-xs casino-text-gold font-semibold truncate opacity-80">
                  {formatUSDValueForDisplay(displayUSDValue)}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isSelected && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={onToggleExpand}
                  className={`px-3 py-2 transition-all duration-200 font-black text-xs border-2 ${
                    isExpanded 
                      ? "bg-[#FFFF00] hover:bg-[#FFD700] text-black border-[#FFD700]" 
                      : "casino-button border-[#FFD700]"
                  }`}
                  style={{ 
                    fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                    boxShadow: "0 0 8px rgba(255, 215, 0, 0.6)",
                    borderRadius: "12px"
                  }}
                >
                  <Edit className={`h-4 w-4 ${isExpanded ? 'rotate-180' : ''} transition-transform duration-200`} />
                </Button>
              </motion.div>
            )}
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={isSelected ? onRemove : onSelect}
                className={`px-3 py-2 font-black text-xs border-2 transition-all duration-200 ${
                  isSelected 
                    ? "bg-[#FF1493] hover:bg-[#DC143C] text-white border-[#FF1493]" 
                    : "casino-button border-[#FFD700]"
                }`}
                style={{ 
                  fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                  boxShadow: isSelected 
                    ? "0 0 8px rgba(255, 20, 147, 0.6)" 
                    : "0 0 8px rgba(255, 215, 0, 0.6)",
                  borderRadius: "12px"
                }}
              >
                {isSelected ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Collapsible Edit Area */}
        <AnimatePresence>
          {isSelected && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 25,
                duration: 0.3 
              }}
              className="overflow-hidden"
            >
              <div className="border-t border-[#FFD700]/30 pt-4 mt-3 space-y-4">
                
                {/* Input areas */}
                <div>
                  <div className="text-xs casino-text-yellow font-bold mb-3 text-center">
                    Select Amount
                  </div>
                  
                  {/* Side-by-side inputs */}
                  <div className="flex gap-3">
                    {/* Token Count Input */}
                    <div className="flex-[0.7]">
                      <div className="text-xs casino-text-yellow font-bold mb-2 flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        Token Amount
                      </div>
                      <div className="space-y-2">
                        <div 
                          className="relative casino-input text-center font-black text-sm"
                          style={{ 
                            background: 'var(--casino-dark-purple)',
                            border: '2px solid var(--casino-gold)',
                            borderRadius: '6px',
                            color: 'var(--casino-gold)',
                            fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                            fontWeight: 600,
                            fontSize: "13px",
                            minHeight: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Input
                            type="number"
                            value={tempAmount.toString()}
                            onChange={(e) => handleTokenAmountChange(token, e.target.value, setTempAmount, setLastModified)}
                            onFocus={() => handleInputFocus(`token-${token.mint}`)}
                            onBlur={() => handleInputBlur(`token-${token.mint}`)}
                            min={0}
                            max={token.amount}
                            step={1 / 10 ** Math.min(token.decimals, 6)}
                            className={`absolute inset-0 w-full h-full text-center font-black bg-transparent border-none outline-none ${
                              isInputFocused(`token-${token.mint}`) ? 'opacity-100 text-[#FFD700]' : 'opacity-0'
                            } transition-opacity duration-150`}
                            style={{ 
                              fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                              fontSize: '13px',
                              color: 'var(--casino-gold)'
                            }}
                            placeholder="0"
                          />
                          
                          {!isInputFocused(`token-${token.mint}`) && (
                            <div
                              className="absolute inset-0 flex items-center justify-center text-center font-black leading-none pointer-events-none"
                              style={{ 
                                fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                                textShadow: "0.5px 0.5px 0 #000000",
                                fontSize: '13px',
                                color: 'var(--casino-gold)'
                              }}
                            >
                              {formatTokenAmountForDisplay(tempAmount, token.decimals)}
                            </div>
                          )}
                        </div>
                        <div className="text-xs casino-text-gold font-bold text-center">
                          {((tempAmount / token.amount) * 100).toFixed(0)}% of balance
                        </div>
                      </div>
                    </div>

                    {/* USD Value Input */}
                    <div className="flex-[0.3]">
                      <div className="text-xs casino-text-yellow font-bold mb-2 flex items-center gap-1">
                        <span className="text-green-400">$</span>
                        USD Value
                      </div>
                      <div className="space-y-2">
                        <div 
                          className="relative casino-input text-center font-black text-sm"
                          style={{ 
                            background: 'var(--casino-dark-purple)',
                            border: '2px solid var(--casino-gold)',
                            borderRadius: '6px',
                            color: 'var(--casino-gold)',
                            fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                            fontWeight: 600,
                            fontSize: "13px",
                            minHeight: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: (!solPrice || !tokenPriceInSol) ? 0.5 : 1
                          }}
                        >
                          <Input
                            type="number"
                            value={tempUSDAmount.toString()}
                            onChange={(e) => handleUSDAmountChange(token, e.target.value, maxUSDValue, setTempUSDAmount, setLastModified)}
                            onFocus={() => handleInputFocus(`usd-${token.mint}`)}
                            onBlur={() => handleInputBlur(`usd-${token.mint}`)}
                            min={0}
                            max={maxUSDValue}
                            step={0.01}
                            className={`absolute inset-0 w-full h-full text-center font-black bg-transparent border-none outline-none ${
                              isInputFocused(`usd-${token.mint}`) ? 'opacity-100 text-[#FFD700]' : 'opacity-0'
                            } transition-opacity duration-150`}
                            style={{ 
                              fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                              fontSize: '13px',
                              color: 'var(--casino-gold)'
                            }}
                            placeholder="0"
                            disabled={!solPrice || !tokenPriceInSol}
                          />
                          
                          {!isInputFocused(`usd-${token.mint}`) && (
                            <div
                              className="absolute inset-0 flex items-center justify-center text-center font-black leading-none pointer-events-none"
                              style={{ 
                                fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                                textShadow: "0.5px 0.5px 0 #000000",
                                fontSize: '13px',
                                color: 'var(--casino-gold)'
                              }}
                            >
                              {formatUSDValueForDisplay(tempUSDAmount)}
                            </div>
                          )}
                        </div>
                        {(!solPrice || !tokenPriceInSol) ? (
                          <div className="text-xs text-red-400 text-center leading-tight">
                            Price unavailable
                          </div>
                        ) : (
                          <div className="text-xs casino-text-green-400 font-bold text-center">
                            Max: {formatUSDValueForDisplay(maxUSDValue)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Slider */}
                <div>
                  <div className="text-xs casino-text-yellow font-bold mb-2">Quick Select</div>
                  <div className="px-2 py-2">
                    <div className="relative">
                      <div 
                        className="absolute top-1/2 left-0 right-0 h-3 bg-gradient-to-r from-[#FFD700] to-[#FFFF00] rounded-full border-2 border-[#000000] transform -translate-y-1/2"
                        style={{
                          boxShadow: `
                            inset 0 2px 4px rgba(0, 0, 0, 0.5),
                            0 0 8px rgba(255, 215, 0, 0.6)
                          `
                        }}
                      />
                      
                      <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between px-1">
                        {[0, 25, 50, 75, 100].map((percent) => (
                          <div
                            key={percent}
                            className="w-2 h-2 bg-[#000000] border border-[#FFD700] rounded-full cursor-pointer"
                            style={{
                              boxShadow: '0 0 4px rgba(255, 215, 0, 0.8)'
                            }}
                            onClick={() => handleQuickPercentageSelect(token, percent, setTempAmount, setLastModified)}
                          />
                        ))}
                      </div>
                      
                      <Slider
                        value={[tempAmount]}
                        min={0}
                        max={token.amount}
                        step={1 / 10 ** Math.min(token.decimals, 6)}
                        onValueChange={([v]) => handleSliderChange(token, v, setTempAmount, setLastModified)}
                        className="mobile-custom-slider relative z-10"
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs casino-text-yellow font-bold mt-2 px-1">
                      <span>0</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                {/* Selected Amount Summary & Action Buttons */}
                <div 
                  className="flex items-center justify-between p-3 border border-[#FFD700]/40"
                  style={{
                    background: 'rgba(74, 14, 78, 0.3)',
                    borderRadius: '16px',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <div>
                    <div className="text-base font-black casino-text-gold" 
                         style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                      {formatAmount(tempAmount, token.decimals)} {token.symbol}
                    </div>
                    <div className="text-xs casino-text-yellow font-bold">Selected Amount</div>
                    {tempUSDAmount > 0 && (
                      <div className="text-xs casino-text-green-400 font-semibold">
                        ≈ {formatUSDValueForDisplay(tempUSDAmount)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={onToggleExpand}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-black border-2 border-gray-500 transition-all duration-200"
                        style={{ 
                          fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                          boxShadow: "0 0 8px rgba(100, 100, 100, 0.6)",
                          borderRadius: "12px"
                        }}
                      >
                        Cancel
                      </Button>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={confirm}
                        className={`px-4 py-2 font-black uppercase text-xs border-2 transition-all duration-200 ${
                          tempAmount === 0
                            ? "bg-[#FF1493] hover:bg-[#DC143C] text-white border-[#FF1493]"
                            : "casino-button border-[#FFD700]"
                        }`}
                        style={{ 
                          fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                          boxShadow: tempAmount === 0
                            ? "0 0 12px rgba(255, 20, 147, 0.8)"
                            : "0 0 12px rgba(255, 215, 0, 0.8)",
                          borderRadius: "12px"
                        }}
                      >
                        {tempAmount === 0 ? (
                          <>
                            <X className="h-3 w-3 mr-1" />
                            Remove
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Update
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Enhanced slider styles */}
      <style jsx>{`
        :global(.mobile-custom-slider [data-radix-slider-track]) {
          background: transparent !important;
          height: 16px !important;
          position: relative;
        }
        
        :global(.mobile-custom-slider [data-radix-slider-range]) {
          background: linear-gradient(90deg, #FFD700, #FFFF00) !important;
          height: 16px !important;
          border-radius: 8px !important;
          box-shadow: 
            0 0 12px rgba(255, 215, 0, 0.9),
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            inset 0 -1px 0 rgba(0, 0, 0, 0.3) !important;
          border: 2px solid #000000 !important;
          position: relative;
        }
        
        :global(.mobile-custom-slider [data-radix-slider-thumb]) {
          width: 28px !important;
          height: 28px !important;
          background: linear-gradient(145deg, #FFD700, #DAA520) !important;
          border: 4px solid #FFFF00 !important;
          border-radius: 50% !important;
          box-shadow: 
            0 0 0 3px #000000,
            0 0 20px rgba(255, 215, 0, 1),
            0 6px 12px rgba(0, 0, 0, 0.4) !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          position: relative !important;
          z-index: 20 !important;
        }
        
        :global(.mobile-custom-slider [data-radix-slider-thumb]:hover) {
          background: linear-gradient(145deg, #FFFF00, #FFD700) !important;
          transform: scale(1.2) !important;
          box-shadow: 
            0 0 0 3px #000000,
            0 0 25px rgba(255, 215, 0, 1),
            0 8px 16px rgba(0, 0, 0, 0.5) !important;
        }
        
        :global(.mobile-custom-slider [data-radix-slider-thumb]:focus) {
          outline: none !important;
          background: linear-gradient(145deg, #FFFF00, #FFD700) !important;
          transform: scale(1.2) !important;
        }
        
        :global(.mobile-custom-slider) {
          width: 100% !important;
          height: 28px !important;
          display: flex !important;
          align-items: center !important;
          position: relative !important;
        }
      `}</style>
    </motion.div>
  );
}
