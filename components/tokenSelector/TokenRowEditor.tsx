"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Coins, DollarSign, Check, X } from "lucide-react";
import { TokenRow } from "@/lib/tokenUtils";
import { calculateMaxUSDValueSafe, formatTokenAmountForDisplay, formatUSDValueForDisplay } from "@/lib/tokenSelectorUtils";
import { useUIStore } from "@/stores/uiStore";
import { createFocusHandlers } from "@/lib/inputHandlers";

interface TokenRowEditorProps {
  token: TokenRow;
  initialAmount: number;
  tokenPriceInSol: number | null;
  solPrice: number | null;
  onSave: (amount: number) => void;
  onCancel: () => void;
}

export function TokenRowEditor({
  token,
  initialAmount,
  tokenPriceInSol,
  solPrice,
  onSave,
  onCancel
}: TokenRowEditorProps) {
  // State for editing
  const [tempAmount, setTempAmount] = useState(initialAmount);
  const [tempUSDAmount, setTempUSDAmount] = useState(0);
  const [lastModified, setLastModified] = useState<'token' | 'usd'>('token');
  
  // Get focus management from UI store
  const { setInputFocus, focusedInputs } = useUIStore();
  const { handleInputFocus, handleInputBlur, isInputFocused } = createFocusHandlers(
    setInputFocus,
    focusedInputs
  );
  
  // Calculate max USD value
  const maxUSDValue = calculateMaxUSDValueSafe(token, tokenPriceInSol, solPrice);
  
  // Initialize USD amount on first render
  useEffect(() => {
    if (tokenPriceInSol && solPrice) {
      if (token.mint === 'So11111111111111111111111111111111111111112') {
        // SOL: direct USD calculation
        setTempUSDAmount(tempAmount * solPrice);
      } else {
        // Other tokens: convert through SOL
        const valueInSol = tempAmount * tokenPriceInSol;
        setTempUSDAmount(valueInSol * solPrice);
      }
    }
  }, [token.mint, initialAmount, tokenPriceInSol, solPrice]);
  
  // Update USD when token amount changes
  useEffect(() => {
    if (lastModified === 'token' && tokenPriceInSol && solPrice) {
      let usdValue = 0;
      if (token.mint === 'So11111111111111111111111111111111111111112') {
        // SOL: direct USD calculation
        usdValue = tempAmount * solPrice;
      } else {
        // Other tokens: convert through SOL
        const valueInSol = tempAmount * tokenPriceInSol;
        usdValue = valueInSol * solPrice;
      }
      // Floor to 2 decimal places
      setTempUSDAmount(Math.floor(usdValue * 100) / 100);
    }
  }, [tempAmount, tokenPriceInSol, solPrice, token.mint, lastModified]);
  
  // Update token amount when USD changes
  useEffect(() => {
    if (lastModified === 'usd' && tokenPriceInSol && solPrice && tempUSDAmount > 0) {
      let tokenAmount = 0;
      if (token.mint === 'So11111111111111111111111111111111111111112') {
        // SOL: direct calculation
        tokenAmount = tempUSDAmount / solPrice;
      } else {
        // Other tokens: convert through SOL
        const valueInSol = tempUSDAmount / solPrice;
        tokenAmount = valueInSol / tokenPriceInSol;
      }
      // Clamp to max available
      setTempAmount(Math.min(tokenAmount, token.amount));
    }
  }, [tempUSDAmount, tokenPriceInSol, solPrice, token.mint, token.amount, lastModified]);
  
  // Handle token amount input change
  const handleTokenInput = (value: string) => {
    // Handle empty input or just decimal point
    if (value === '' || value === '.') {
      setTempAmount(0);
      setLastModified('token');
      return;
    }
    
    // Handle input that ends with decimal
    if (value.endsWith('.') && !isNaN(parseFloat(value.slice(0, -1)))) {
      const numValue = parseFloat(value.slice(0, -1));
      const clampedValue = Math.min(Math.max(0, numValue), token.amount);
      setTempAmount(clampedValue);
      setLastModified('token');
      return;
    }
    
    // Handle normal number input
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    const clampedValue = Math.min(Math.max(0, numValue), token.amount);
    setTempAmount(clampedValue);
    setLastModified('token');
  };
  
  // Handle USD amount input change
  const handleUSDInput = (value: string) => {
    // Handle empty input or just decimal point
    if (value === '' || value === '.') {
      setTempUSDAmount(0);
      setLastModified('usd');
      return;
    }
    
    // Handle input that ends with decimal
    if (value.endsWith('.') && !isNaN(parseFloat(value.slice(0, -1)))) {
      const numValue = parseFloat(value.slice(0, -1));
      const clampedValue = Math.min(Math.max(0, numValue), maxUSDValue);
      setTempUSDAmount(clampedValue);
      setLastModified('usd');
      return;
    }
    
    // Handle normal number input
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    const clampedValue = Math.min(Math.max(0, numValue), maxUSDValue);
    setTempUSDAmount(clampedValue);
    setLastModified('usd');
  };
  
  // Handle percentage selection
  const handlePercentage = (percent: number) => {
    const amount = (token.amount * percent) / 100;
    setTempAmount(amount);
    setLastModified('token');
  };
  
  return (
    <div className="space-y-4 pt-2">
      {/* Inputs Row */}
      <div className="flex gap-3 items-center">
        {/* Token Amount Input */}
        <div className="flex-1 relative">
          <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 casino-text-gold opacity-80" />
          <div className="relative">
            <Input
              type="number"
              min={0}
              max={token.amount}
              step={1 / Math.pow(10, Math.min(token.decimals, 6))}
              value={tempAmount}
              onChange={(e) => handleTokenInput(e.target.value)}
              onFocus={() => handleInputFocus(`pro-token-${token.mint}`)}
              onBlur={() => handleInputBlur(`pro-token-${token.mint}`)}
              className={`pl-10 casino-input pr-2 font-bold ${
                isInputFocused(`pro-token-${token.mint}`) ? 'opacity-100' : 'opacity-0'
              }`}
            />
            
            {/* Overlay with formatted display */}
            {!isInputFocused(`pro-token-${token.mint}`) && (
              <div
                className="absolute inset-0 flex items-center pl-10 casino-text-gold font-bold pointer-events-none"
              >
                {formatTokenAmountForDisplay(tempAmount, token.decimals)}
              </div>
            )}
          </div>
          <div className="text-xs casino-text-yellow mt-1 font-bold text-center">
            {((tempAmount / token.amount) * 100).toFixed(0)}% of balance
          </div>
        </div>
        
        {/* USD Value Input */}
        <div className="flex-1 relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 casino-text-green-400 opacity-80" />
          <div className="relative">
            <Input
              type="number"
              min={0}
              max={maxUSDValue}
              step={0.01}
              value={tempUSDAmount}
              onChange={(e) => handleUSDInput(e.target.value)}
              onFocus={() => handleInputFocus(`pro-usd-${token.mint}`)}
              onBlur={() => handleInputBlur(`pro-usd-${token.mint}`)}
              className={`pl-10 casino-input pr-2 font-bold ${
                isInputFocused(`pro-usd-${token.mint}`) ? 'opacity-100' : 'opacity-0'
              }`}
              disabled={!tokenPriceInSol || !solPrice}
            />
            
            {/* Overlay with formatted display */}
            {!isInputFocused(`pro-usd-${token.mint}`) && (
              <div
                className="absolute inset-0 flex items-center pl-10 casino-text-green-400 font-bold pointer-events-none"
              >
                {formatUSDValueForDisplay(tempUSDAmount)}
              </div>
            )}
          </div>
          {(!tokenPriceInSol || !solPrice) ? (
            <div className="text-xs text-red-400 mt-1 font-bold text-center">
              Price data unavailable
            </div>
          ) : (
            <div className="text-xs casino-text-green-400 mt-1 font-bold text-center">
              Max: {formatUSDValueForDisplay(maxUSDValue)}
            </div>
          )}
        </div>
      </div>
      
      {/* Percentage Quick Select */}
      <div className="flex justify-between">
        {[0, 25, 50, 75, 100].map(percent => (
          <motion.button
            key={percent}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePercentage(percent)}
            className={`px-2 py-1 rounded text-xs font-bold transition-all ${
              Math.abs((tempAmount / token.amount) * 100 - percent) < 1
                ? "bg-[#FFD700] text-black"
                : "bg-[#FFD700]/20 casino-text-gold hover:bg-[#FFD700]/40"
            }`}
          >
            {percent}%
          </motion.button>
        ))}
      </div>
      
      {/* Slider */}
      <div className="px-2">
        <Slider
          value={[Math.min((tempAmount / token.amount) * 100, 100)]}
          min={0}
          max={100}
          step={1}
          onValueChange={([percentage]) => handlePercentage(percentage)}
          className="slider-casino"
        />
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-2">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white font-black border border-gray-600"
            style={{
              borderRadius: '8px'
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={() => onSave(tempAmount)}
            className={`px-4 py-2 font-black ${
              tempAmount === 0 
                ? "bg-[#FF1493] hover:bg-[#DC143C] text-white border border-[#FF1493]" 
                : "casino-button border border-[#FFD700]"
            }`}
            style={{
              borderRadius: '8px',
            }}
          >
            <Check className="h-4 w-4 mr-1" />
            {tempAmount === 0 ? "Remove" : "Apply"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}