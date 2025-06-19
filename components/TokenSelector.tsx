/* components/TokenSelector.tsx - Mobile List-based Token Selector */
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  motion,
  AnimatePresence,
  LayoutGroup,
} from "framer-motion";
import {
  Wallet,
  Check,
  Coins,
  X,
  Star,
  ChevronDown,
  Plus,
  Minus,
  Edit
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { usePrivy } from "@privy-io/react-auth";
import { useSolPriceUSD } from "@/hooks/useSolPriceUSD";
import { useTokenPricesSol } from "@/hooks/useTokenPriceSol";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { useTokenData } from "@/hooks/useTokenData"; // 🔥 NEW: Add DexScreener data
import { useTokenStore } from "@/stores/tokenStore";
import { useUIStore } from "@/stores/uiStore";
import { useDebugStore } from "@/stores/debugStore"; // 🔥 NEW: Import debug store

// 🔥 UNIFIED: Import shared utilities
import { 
  TokenRow,
  formatAmount,
  formatAmountAbbreviated,
  formatUSDValue,
  formatUSDValueSmart
} from '@/lib/tokenUtils';
import {
  calculateMaxUSDValue,
  calculateTokenUSDValue
} from '@/lib/priceCalculations';
import {
  handleTokenAmountInput,
  handleUSDAmountInput,
  createFocusHandlers,
  getRawTokenCount,
  getRawUSDValue
} from '@/lib/inputHandlers';

interface TokenSelectorProps {
  selectedTokens: TokenRow[]; // Still used for reading current selection
  onSelectedTokensChange: (tokens: TokenRow[]) => void; // Deprecated but kept for compatibility
  delayedExpandToken?: string | null;
  onClearDelayedExpand?: () => void;
  isMobile?: boolean;
}

/* ---------- Mobile List Row Component ---------- */
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

function MobileTokenRow({
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

  // 🔥 UNIFIED: State for USD input and last modified input tracking
  const [tempUSDAmount, setTempUSDAmount] = useState(0);
  const [lastModified, setLastModified] = useState<'token' | 'usd'>('token');

  // 🔥 UNIFIED: Focus tracking for inputs using shared utility
  const { setInputFocus, focusedInputs } = useUIStore();
  const { handleInputFocus, handleInputBlur, isInputFocused } = createFocusHandlers(
    setInputFocus,
    focusedInputs
  );

  // 🔥 UNIFIED: Calculate max USD value using shared utility
  const maxUSDValue = useMemo(() => {
    return calculateMaxUSDValue(token, tokenPriceInSol, solPrice);
  }, [token, tokenPriceInSol, solPrice]);

  useEffect(() => {
    if (selectedAmount !== undefined) setTempAmount(selectedAmount);
  }, [selectedAmount]);

  // 🔥 UNIFIED: Calculate USD value when token amount changes or prices change
  useEffect(() => {
    if (lastModified === 'token' && solPrice && tokenPriceInSol) {
      const usdFromToken = calculateTokenUSDValue(token, tempAmount, tokenPriceInSol, solPrice);
      if (usdFromToken !== null) {
        // 🔥 TRUNCATE to 2 decimal places
        setTempUSDAmount(Math.floor(usdFromToken * 100) / 100);
      }
    }
  }, [tempAmount, solPrice, tokenPriceInSol, token, lastModified]);

  // 🔥 UNIFIED: Calculate token amount when USD amount changes
  useEffect(() => {
    if (lastModified === 'usd' && solPrice && tokenPriceInSol && tempUSDAmount > 0) {
      let tokenFromUSD = 0;
      if (token.mint === 'So11111111111111111111111111111111111111112') {
        // SOL: direct calculation
        tokenFromUSD = tempUSDAmount / solPrice;
      } else {
        // Other tokens: convert through SOL
        const valueInSol = tempUSDAmount / solPrice;
        tokenFromUSD = valueInSol / tokenPriceInSol;
      }
      setTempAmount(Math.min(tokenFromUSD, token.amount)); // Clamp to max available
    }
  }, [tempUSDAmount, solPrice, tokenPriceInSol, token.mint, token.amount, lastModified]);

  const sliderChange = (v: number) => {
    const pct = v / token.amount;
    const snap = [0, 0.25, 0.5, 0.75, 1].find(
      (p) => Math.abs(pct - p) <= 0.01
    );
    const newAmount = (snap ?? pct) * token.amount;
    setTempAmount(newAmount);
    setLastModified('token'); // Slider change should update USD
  };

  // 🔥 UNIFIED: Handle token amount input changes using shared utility
  const handleTokenAmountChange = (value: string) => {
    const dummySliderValues = [0]; // Not used in this context
    const dummyOnChange = () => {}; // We handle the change directly
    
    // We'll manually handle the logic since we need to update local state
    if (value === '' || value === '.') {
      setTempAmount(0);
      setLastModified('token');
      return;
    }

    if (value.endsWith('.') && !isNaN(parseFloat(value.slice(0, -1)))) {
      const numValue = parseFloat(value.slice(0, -1));
      const clampedValue = Math.min(Math.max(0, numValue), token.amount);
      setTempAmount(clampedValue);
      setLastModified('token');
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) && value !== '') return;

    const finalValue = isNaN(numValue) ? 0 : numValue;
    const clampedValue = Math.min(Math.max(0, finalValue), token.amount);
    setTempAmount(clampedValue);
    setLastModified('token');
  };

  // 🔥 UNIFIED: Handle USD amount input changes with shared max USD calculation
  const handleUSDAmountChange = (value: string) => {
    // Handle empty string or strings that start with decimal point
    if (value === '' || value === '.') {
      setTempUSDAmount(0);
      setLastModified('usd');
      return;
    }

    // Handle partial decimal inputs like "5." or "0."
    if (value.endsWith('.') && !isNaN(parseFloat(value.slice(0, -1)))) {
      const usdValue = parseFloat(value.slice(0, -1));
      // 🔥 UNIFIED: Clamp to max USD value and TRUNCATE to 2 decimal places
      const clampedValue = Math.min(Math.max(0, usdValue), maxUSDValue);
      setTempUSDAmount(Math.floor(clampedValue * 100) / 100);
      setLastModified('usd');
      return;
    }

    const usdValue = parseFloat(value);
    if (isNaN(usdValue) && value !== '') return;

    const finalUsdValue = isNaN(usdValue) ? 0 : usdValue;
    // 🔥 UNIFIED: Clamp to max USD value and TRUNCATE to 2 decimal places
    const clampedValue = Math.min(Math.max(0, finalUsdValue), maxUSDValue);
    setTempUSDAmount(Math.floor(clampedValue * 100) / 100);
    setLastModified('usd');
  };

  // 🔥 UNIFIED: Get raw values for inputs (always numeric)
  const getRawTokenAmount = () => {
    return tempAmount;
  };

  const getRawUSDAmount = () => {
    return tempUSDAmount;
  };

  // 🔥 UNIFIED: Get formatted values for overlay display using shared utilities
  const getFormattedTokenAmount = () => {
    return formatAmount(tempAmount, token.decimals);
  };

  // 🔥 UNIFIED: USD formatting with shared utility
  const getFormattedUSDAmount = () => {
    return formatUSDValueSmart(tempUSDAmount);
  };

  const confirm = () => {
    if (tempAmount === 0) {
      onRemove?.();
    } else {
      onAmountChange?.(tempAmount);
    }
    onToggleExpand?.(); // Close after confirming
  };

  // 🔥 UNIFIED: Calculate USD value for the current amount using shared utility
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
        borderRadius: "12px" // 🔥 FIXED: Fully rounded corners on all sides
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
                  ? `Selected: ${formatAmountAbbreviated(selectedAmount ?? token.amount, token.decimals)}`
                  : `Balance: ${formatAmountAbbreviated(token.amount, token.decimals)}`
                }
              </div>
              
              {/* USD Value - Using truncated display value */}
              {displayUSDValue !== null && displayUSDValue > 0 && (
                <div className="text-xs casino-text-gold font-semibold truncate opacity-80">
                  {formatUSDValue(displayUSDValue)}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - 🔥 ENHANCED: Better rounded corners with style override */}
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
                    borderRadius: "12px" // 🔥 EXPLICIT: Force rounded corners
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
                  borderRadius: "12px" // 🔥 EXPLICIT: Force rounded corners
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
                
                {/* 🔥 UNIFIED: Input areas with shared styling */}
                <div>
                  <div className="text-xs casino-text-yellow font-bold mb-3 text-center">
                    Select Amount
                  </div>
                  
                  {/* Side-by-side inputs with 70/30 split */}
                  <div className="flex gap-3">
                    {/* Token Count Input - 70% width */}
                    <div className="flex-[0.7]">
                      <div className="text-xs casino-text-yellow font-bold mb-2 flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        Token Amount
                      </div>
                      <div className="space-y-2">
                        {/* 🔥 UNIFIED: Container styling */}
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
                          {/* ACTUAL INPUT - Always present but visibility controlled */}
                          <Input
                            type="number"
                            value={getRawTokenAmount().toString()}
                            onChange={(e) => handleTokenAmountChange(e.target.value)}
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
                          
                          {/* OVERLAY - Shows formatted value when not focused */}
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
                              {getFormattedTokenAmount()}
                            </div>
                          )}
                        </div>
                        <div className="text-xs casino-text-gold font-bold text-center">
                          {((tempAmount / token.amount) * 100).toFixed(0)}% of balance
                        </div>
                      </div>
                    </div>

                    {/* USD Value Input - 30% width */}
                    <div className="flex-[0.3]">
                      <div className="text-xs casino-text-yellow font-bold mb-2 flex items-center gap-1">
                        <span className="text-green-400">$</span>
                        USD Value
                      </div>
                      <div className="space-y-2">
                        {/* 🔥 UNIFIED: Container styling */}
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
                          {/* 🔥 UNIFIED: ACTUAL INPUT - Raw numeric value without forced formatting */}
                          <Input
                            type="number"
                            value={getRawUSDAmount().toString()}
                            onChange={(e) => handleUSDAmountChange(e.target.value)}
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
                          
                          {/* 🔥 UNIFIED: OVERLAY - Shows formatted value when not focused */}
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
                              {getFormattedUSDAmount()}
                            </div>
                          )}
                        </div>
                        {(!solPrice || !tokenPriceInSol) ? (
                          <div className="text-xs text-red-400 text-center leading-tight">
                            Price unavailable
                          </div>
                        ) : (
                          <div className="text-xs casino-text-green-400 font-bold text-center">
                            Max: {formatUSDValue(maxUSDValue)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 🔥 Enhanced Slider with Visible Track */}
                <div>
                  <div className="text-xs casino-text-yellow font-bold mb-2">Quick Select</div>
                  <div className="px-2 py-2">
                    <div className="relative">
                      {/* 🎯 Custom visible track background - always visible */}
                      <div 
                        className="absolute top-1/2 left-0 right-0 h-3 bg-gradient-to-r from-[#FFD700] to-[#FFFF00] rounded-full border-2 border-[#000000] transform -translate-y-1/2"
                        style={{
                          boxShadow: `
                            inset 0 2px 4px rgba(0, 0, 0, 0.5),
                            0 0 8px rgba(255, 215, 0, 0.6)
                          `
                        }}
                      />
                      
                      {/* Snap point indicators */}
                      <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between px-1">
                        {[0, 25, 50, 75, 100].map((percent) => (
                          <div
                            key={percent}
                            className="w-2 h-2 bg-[#000000] border border-[#FFD700] rounded-full"
                            style={{
                              boxShadow: '0 0 4px rgba(255, 215, 0, 0.8)'
                            }}
                          />
                        ))}
                      </div>
                      
                      {/* Actual slider on top - now invisible track */}
                      <Slider
                        value={[tempAmount]}
                        min={0}
                        max={token.amount}
                        step={1 / 10 ** Math.min(token.decimals, 6)}
                        onValueChange={([v]) => sliderChange(v)}
                        className="mobile-custom-slider relative z-10"
                      />
                    </div>
                    
                    {/* Percentage markers instead of range indicators */}
                    <div className="flex justify-between text-xs casino-text-yellow font-bold mt-2 px-1">
                      <span>0</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                {/* Selected Amount Summary & Action Buttons - 🔥 UNIFIED: Better rounded corners */}
                <div 
                  className="flex items-center justify-between p-3 border border-[#FFD700]/40"
                  style={{
                    background: 'rgba(74, 14, 78, 0.3)',
                    borderRadius: '16px', // 🔥 UNIFIED: More explicit and consistent rounding
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <div>
                    <div className="text-base font-black casino-text-gold" 
                         style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                      {formatAmountAbbreviated(tempAmount, token.decimals)} {token.symbol}
                    </div>
                    <div className="text-xs casino-text-yellow font-bold">Selected Amount</div>
                    {/* USD value for temp amount - 🔥 UNIFIED display */}
                    {tempUSDAmount > 0 && (
                      <div className="text-xs casino-text-green-400 font-semibold">
                        ≈ {formatUSDValue(tempUSDAmount)}
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
                          borderRadius: "12px" // 🔥 EXPLICIT: Force rounded corners
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
                          borderRadius: "12px" // 🔥 EXPLICIT: Force rounded corners
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
    </motion.div>
  );
}

/* ---------- Mobile List-based TokenSelector ---------- */
export function TokenSelector({
  selectedTokens, // Still used for reading current selection
  onSelectedTokensChange, // Deprecated but kept for compatibility
  delayedExpandToken,
  onClearDelayedExpand,
  isMobile = false,
}: TokenSelectorProps) {
  const { authenticated, user } = usePrivy();
  const publicKey = user?.wallet?.address;
  
  // 🔥 NEW: Get debug wallet address
  const { debugWalletAddress } = useDebugStore();
  
  // 🔥 NEW: Use debug address if available, otherwise use connected wallet
  const effectiveWalletAddress = debugWalletAddress || publicKey;
  const isUsingDebugWallet = !!debugWalletAddress;
  
  const { tokens, loading, error } = useTokenBalances(effectiveWalletAddress); // 🔥 Get all tokens
  
  // 🔥 NEW: Get all mint addresses for DexScreener filtering
  const mintAddresses = useMemo(() => tokens?.map(token => token.mint) || [], [tokens]);
  const { data: dexScreenerData, error: dexScreenerError, isLoading: dexScreenerLoading } = useTokenData({
    chainId: "solana",
    tokenAddresses: mintAddresses,
    enabled: mintAddresses.length > 0
  });

  // 🔥 NEW: Filter tokens to only include those with DexScreener trading data (same as portfolio view)
  const filteredTokens = useMemo(() => {
    if (!tokens || !dexScreenerData) return [];
    
    const dexScreenerTokens = new Set(
      dexScreenerData.map(pair => pair.baseToken.address)
    );

    const filtered = tokens.filter(token => dexScreenerTokens.has(token.mint));
    
    // Only log in development and when data actually changes
    if (process.env.NODE_ENV === 'development' && filtered.length > 0) {
      console.log("TokenSelector: Filtered tokens with trading data:", filtered.length, "from wallet:", isUsingDebugWallet ? "DEBUG" : "CONNECTED");
    }
    
    return filtered;
  }, [tokens, dexScreenerData, isUsingDebugWallet]);

  const { prices: tokenPricesInSol } = useTokenPricesSol(mintAddresses);

  // 🔥 UNIFIED: Use Zustand store for token operations instead of props
  const { 
    selectedTokens: zustandSelectedTokens,
    expandedToken,
    setExpandedToken,
    addToken,
    removeToken,
    updateTokenAmount
  } = useTokenStore();

  // 🔥 UNIFIED: Add price hooks for USD values
  const { price: solPrice } = useSolPriceUSD();

  // 🔥 UNIFIED: Calculate USD values for each token using shared utility
  const tokenUSDValues = useMemo(() => {
    const valuesMap: Record<string, number | null> = {};

    filteredTokens.forEach(token => {
      const usdValue = calculateTokenUSDValue(token, token.amount, tokenPricesInSol[token.mint], solPrice);
      valuesMap[token.mint] = usdValue;
    });

    return valuesMap;
  }, [filteredTokens, tokenPricesInSol, solPrice]);

  useEffect(() => {
    if (delayedExpandToken) {
      setExpandedToken(delayedExpandToken);
      onClearDelayedExpand?.();
    }
  }, [delayedExpandToken, onClearDelayedExpand, setExpandedToken]);

  // 🔥 UNIFIED: Use Zustand selected tokens instead of props
  const selectedMints = new Set(zustandSelectedTokens.map(t => t.mint));
  const availableTokens = filteredTokens.filter(t => !selectedMints.has(t.mint)); // 🔥 Use filteredTokens instead of tokens
  
  // Combine lists: selected first, then available
  const allTokens = [
    ...zustandSelectedTokens.map(st => ({
      ...st,
      // Make sure we have the latest balance data
      amount: filteredTokens.find(t => t.mint === st.mint)?.amount ?? st.amount, // 🔥 Use filteredTokens
      selected: true
    })),
    ...availableTokens.map(at => ({ ...at, selected: false }))
  ];

  // 🔥 UNIFIED: Use Zustand actions instead of prop-based callbacks
  const select = (token: TokenRow) => {
    addToken(token);
    // Auto-expand the newly selected token for editing
    setExpandedToken(token.mint);
  };

  const remove = (mint: string) => {
    removeToken(mint);
  };

  const update = (mint: string, amt: number) => {
    updateTokenAmount(mint, amt);
  };

  const toggleExpand = (mint: string) => {
    setExpandedToken(expandedToken === mint ? null : mint);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 mb-3">
        <h3
          className="text-lg font-black uppercase casino-text-gold text-center"
          style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}
        >
          {zustandSelectedTokens.length > 0 
            ? `AVAILABLE TOKENS (${allTokens.length})`
            : `AVAILABLE TOKENS (${allTokens.length})`
          }
          {/* 🔥 REMOVED: Debug mode indicator - too intrusive */}
        </h3>
        {/* 🔥 REMOVED: Show loading status for DexScreener filtering - too intrusive */}
      </div>

      {/* 🔥 UNIFIED: Fill ALL available space with proper flex layout */}
      <div 
        className="flex-1 min-h-0 scrollable-list-container"
        style={{ 
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch', // iOS smooth scrolling
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Coins className="h-8 w-8 casino-text-gold" />
            </motion.div>
            <span className="text-sm casino-text-gold font-bold mt-2">
              Loading tokens{isUsingDebugWallet ? " (Debug)" : ""}...
            </span>
            {/* 🔥 REMOVED: Debug address display - too intrusive */}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <span className="text-sm text-red-400 font-bold">
              Error: {error}
            </span>
            {/* 🔥 REMOVED: Debug address display - too intrusive */}
          </div>
        ) : !allTokens.length ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Wallet className="h-8 w-8 casino-text-gold mb-2" />
            <span className="text-sm casino-text-gold font-bold">
              {/* 🔥 NEW: Updated message for DexScreener filtering */}
              {dexScreenerLoading ? "Loading trading data..." : "No tokens with trading data found"}
            </span>
            {/* 🔥 REMOVED: Debug address display - too intrusive */}
          </div>
        ) : (
          <div className="px-2"> {/* Removed excessive bottom padding */}
            <LayoutGroup id="tokens">
              <AnimatePresence>
                {allTokens.map((token) => (
                  <MobileTokenRow
                    key={token.mint}
                    token={token}
                    isSelected={token.selected || false}
                    isExpanded={expandedToken === token.mint}
                    onSelect={() => select(token)}
                    onRemove={() => remove(token.mint)}
                    onAmountChange={(amount) => update(token.mint, amount)}
                    onToggleExpand={() => toggleExpand(token.mint)}
                    selectedAmount={token.selectedAmount}
                    usdValue={tokenUSDValues[token.mint]}
                    solPrice={solPrice}
                    tokenPriceInSol={tokenPricesInSol[token.mint]}
                  />
                ))}
              </AnimatePresence>
            </LayoutGroup>
          </div>
        )}
      </div>

      {/* 🔥 ENHANCED SLIDER STYLES - Added mobile-custom-slider */}
      <style jsx>{`
        /* 🎯 WEBKIT SCROLLBAR - Ultra visible with animations */
        .scrollable-list-container::-webkit-scrollbar {
          width: 16px !important;
          background: linear-gradient(180deg, #FF1493 0%, #FFD700 50%, #FF1493 100%) !important;
          border-radius: 8px !important;
          border: 3px solid #FFFF00 !important;
          box-shadow: 0 0 20px rgba(255, 215, 0, 1) !important;
        }
        
        .scrollable-list-container::-webkit-scrollbar-track {
          background: linear-gradient(180deg, #000000 0%, #2D0A30 50%, #000000 100%) !important;
          border-radius: 8px !important;
          border: 2px solid #FFD700 !important;
          box-shadow: 
            inset 0 0 20px rgba(255, 215, 0, 0.5),
            0 0 30px rgba(255, 215, 0, 1) !important;
        }
        
        .scrollable-list-container::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #FFFF00 0%, #FFD700 25%, #FF1493 50%, #FFD700 75%, #FFFF00 100%) !important;
          border-radius: 8px !important;
          border: 3px solid #FFFF00 !important;
          box-shadow: 
            0 0 30px rgba(255, 215, 0, 1),
            inset 0 2px 0 rgba(255, 255, 255, 0.8),
            inset 0 -2px 0 rgba(0, 0, 0, 0.8),
            0 0 40px rgba(255, 20, 147, 0.8) !important;
          min-height: 40px !important;
          animation: pulse-glow 2s infinite !important;
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 
              0 0 30px rgba(255, 215, 0, 1),
              0 0 40px rgba(255, 20, 147, 0.8);
          }
          50% { 
            box-shadow: 
              0 0 50px rgba(255, 255, 0, 1),
              0 0 60px rgba(255, 20, 147, 1);
          }
        }
        
        .scrollable-list-container::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #FFFFFF 0%, #FFFF00 25%, #FF69B4 50%, #FFFF00 75%, #FFFFFF 100%) !important;
          transform: scale(1.2) !important;
          box-shadow: 
            0 0 50px rgba(255, 255, 255, 1),
            0 0 70px rgba(255, 20, 147, 1) !important;
        }
        
        .scrollable-list-container::-webkit-scrollbar-thumb:active {
          background: linear-gradient(180deg, #FF0000 0%, #FFFF00 25%, #00FFFF 50%, #FFFF00 75%, #FF0000 100%) !important;
          transform: scale(1.1) !important;
          box-shadow: 
            0 0 60px rgba(255, 0, 0, 1),
            0 0 80px rgba(0, 255, 255, 1) !important;
        }

        /* 🔥 FIREFOX FALLBACK */
        .scrollable-list-container {
          scrollbar-width: thick !important;
          scrollbar-color: #FFD700 #2D0A30 !important;
        }

        /* 🎯 MOBILE CUSTOM SLIDER STYLES - Updated with transparent track */
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
    </div>
  );
}