/* components/tokenSelector/DesktopTokenSelector.tsx */
"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  Plus,
  Minus,
  DollarSign,
  Coins,
  TrendingUp,
  CheckCircle,
  Circle,
  Activity,
  Settings,
  Info
} from "lucide-react";
import Image from "next/image";
import { TokenRow } from "@/lib/tokenUtils";
import {
  formatTokenAmountForDisplay,
  formatUSDValueForDisplay,
  calculateTotalSelectedUSD,
  calculateTokenUSDValueSafe,
  sortTokensByUSDValue,
  filterTokensBySearch,
} from "@/lib/tokenSelectorUtils";
import { 
  calculateTokenAmountFromUSD,
  calculateMaxUSDValue,
  calculateTokenUSDValue
} from "@/lib/priceCalculations";
import { useTokenStore } from "@/stores/tokenStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useUIStore } from "@/stores/uiStore";
import { createFocusHandlers } from "@/lib/inputHandlers";
import { usePrivy } from '@privy-io/react-auth';
import { useToast } from '../../hooks/use-toast';
import { buildDepositTransaction } from '../../lib/transaction-builder';
import { useAudioStore } from '../../stores/audioStore';
import { WalletConnect } from '../WalletConnect';
import { Connection } from '@solana/web3.js';
import { jackpotAddr } from '../../lib/constants';

interface DesktopTokenSelectorProps {
  tokens: TokenRow[];
  tokenPricesInSol: Record<string, number | null>;
  solPrice: number | null;
  loading?: boolean;
  error?: string | null;
}

export function DesktopTokenSelector({
  tokens,
  tokenPricesInSol = {},
  solPrice = null,
  loading = false,
  error = null,
}: DesktopTokenSelectorProps) {
  /* ----------------------------- Zustand stores ---------------------------- */
  const { selectedTokens, addToken, removeToken, updateTokenAmount, clearSelectedTokens } =
    useTokenStore();
    
  const { showAdvancedControls, autoSelectOptimalAmounts } =
    useSettingsStore();

  const { setInputFocus, focusedInputs } = useUIStore();

  const { ready, authenticated, user } = usePrivy();
  const { toast } = useToast();
  const playSound = useAudioStore((s) => s.playSound);
  const [depositLoading, setDepositLoading] = useState(false);

  /* ------------------------------- Local state ----------------------------- */
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "balance" | "value">("value");
  const [bulkSelectPercentage, setBulkSelectPercentage] = useState(50);
  const [showPriceImpact, setShowPriceImpact] = useState(false);

  // Focus handlers
  const { handleInputFocus, handleInputBlur, isInputFocused } = createFocusHandlers(
    setInputFocus,
    focusedInputs
  );

  /* --------------------------- Memoised selectors -------------------------- */
  const { filteredTokens, totalSelectedUSD } = useMemo(() => {
    /* Filter by search */
    let filtered = filterTokensBySearch(tokens, searchTerm);

    /* Sort */
    switch (sortBy) {
      case "name":
        filtered.sort((a, b) => a.symbol.localeCompare(b.symbol));
        break;
      case "balance":
        filtered.sort((a, b) => b.amount - a.amount);
        break;
      case "value":
      default:
        filtered = sortTokensByUSDValue(filtered, tokenPricesInSol, solPrice);
        break;
    }

    const totalUSD = calculateTotalSelectedUSD(
      selectedTokens,
      tokenPricesInSol,
      solPrice,
    );

    return { filteredTokens: filtered, totalSelectedUSD: totalUSD };
  }, [
    tokens,
    searchTerm,
    sortBy,
    selectedTokens,
    tokenPricesInSol,
    solPrice,
  ]);

  /* -------------------------- Token-selection helpers ---------------------- */
  const handleSelectToken = useCallback(
    (token: TokenRow) => {
      const defaultAmount = autoSelectOptimalAmounts
        ? token.amount * 0.5 // 50%
        : token.amount * 0.25; // 25%

      addToken({ ...token, selectedAmount: defaultAmount });
    },
    [addToken, autoSelectOptimalAmounts],
  );

  const handleDeselectToken = useCallback(
    (mint: string) => {
      removeToken(mint);
    },
    [removeToken],
  );

  const handleUpdateAmount = useCallback(
    (mint: string, amount: number) => {
      if (amount <= 0) {
        handleDeselectToken(mint);
      } else {
        updateTokenAmount(mint, amount);
      }
    },
    [updateTokenAmount, handleDeselectToken],
  );

  const handleBulkSelect = useCallback(() => {
    const unselectedTokens = filteredTokens.filter(
      (token) => !selectedTokens.some((sel) => sel.mint === token.mint),
    );

    unselectedTokens.slice(0, 10).forEach((token) => {
      const amount = (token.amount * bulkSelectPercentage) / 100;
      addToken({ ...token, selectedAmount: amount });
    });
  }, [filteredTokens, selectedTokens, bulkSelectPercentage, addToken]);

  const isTokenSelected = useCallback(
    (mint: string) => selectedTokens.some((t) => t.mint === mint),
    [selectedTokens],
  );

  const getSelectedTokenAmount = useCallback(
    (mint: string) => selectedTokens.find((t) => t.mint === mint)?.selectedAmount ?? 0,
    [selectedTokens],
  );

  // Handle token amount input
  const handleTokenInput = useCallback((mint: string, value: string) => {
    const token = tokens.find(t => t.mint === mint);
    if (!token) return;
    
    if (value === '' || value === '.') {
      handleUpdateAmount(mint, 0);
      return;
    }
    
    if (value.endsWith('.') && !isNaN(parseFloat(value.slice(0, -1)))) {
      const numValue = parseFloat(value.slice(0, -1));
      const clampedValue = Math.min(Math.max(0, numValue), token.amount);
      handleUpdateAmount(mint, clampedValue);
      return;
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    const clampedValue = Math.min(Math.max(0, numValue), token.amount);
    handleUpdateAmount(mint, clampedValue);
  }, [tokens, handleUpdateAmount]);

  // Handle USD amount input
  const handleUSDInput = useCallback((mint: string, value: string) => {
    const token = tokens.find(t => t.mint === mint);
    const tokenPriceInSol = tokenPricesInSol[mint];
    if (!token || !tokenPriceInSol || !solPrice) return;
    
    const maxUSDValue = calculateMaxUSDValue(token, tokenPriceInSol, solPrice);
    
    if (value === '' || value === '.') {
      handleUpdateAmount(mint, 0);
      return;
    }
    
    if (value.endsWith('.') && !isNaN(parseFloat(value.slice(0, -1)))) {
      const usdValue = parseFloat(value.slice(0, -1));
      const clampedValue = Math.min(Math.max(0, usdValue), maxUSDValue);
      const tokenAmount = calculateTokenAmountFromUSD(token, clampedValue, tokenPriceInSol, solPrice);
      if (tokenAmount !== null) {
        handleUpdateAmount(mint, Math.min(tokenAmount, token.amount));
      }
      return;
    }
    
    const usdValue = parseFloat(value);
    if (isNaN(usdValue)) return;
    
    const clampedValue = Math.min(Math.max(0, usdValue), maxUSDValue);
    const tokenAmount = calculateTokenAmountFromUSD(token, clampedValue, tokenPriceInSol, solPrice);
    if (tokenAmount !== null) {
      handleUpdateAmount(mint, Math.min(tokenAmount, token.amount));
    }
  }, [tokens, tokenPricesInSol, solPrice, handleUpdateAmount]);

  const handleDeposit = async () => {
    if (!user?.wallet?.address || selectedTokens.length === 0 || totalSelectedUSD <= 0) return;
    setDepositLoading(true);
    try {
      const connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC!);
      const tx = await buildDepositTransaction(selectedTokens, user.wallet.address, jackpotAddr, connection);
      // @ts-ignore
      const { signature } = await window.solana.signAndSendTransaction(tx);
      toast({ title: 'Deposit successful', description: 'Your deposit was sent!' });
      if (playSound) playSound('deposit');
      clearSelectedTokens();
    } catch (e: any) {
      toast({ title: 'Deposit failed', description: e?.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setDepositLoading(false);
    }
  };

  // Debug log: tokens, filteredTokens, totalSelectedUSD, selectedTokens, etc.
    console.log("[DesktopTokenSelector]", {
      tokens,
      filteredTokens,
      selectedTokens,
      totalSelectedUSD,
      tokenPricesInSol,
      solPrice,
    });

  /* ------------------------------ Loading / error -------------------------- */
  if (loading) {
    return (
      <Card className="casino-box casino-box-gold h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD700] mx-auto"></div>
            <div className="mt-2 text-sm casino-text-gold">Loading tokens…</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="casino-box casino-box-gold h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-red-400">
            <div className="text-sm">Error: {error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                              MAIN RENDER                                 */
  /* ------------------------------------------------------------------------ */
  return (
    <div className="relative flex flex-col h-full">
    <Card className="casino-box casino-box-gold h-full flex flex-col overflow-hidden">
      {/* ------------------------------- Header ------------------------------ */}
      <CardHeader className="p-4 border-b-2 border-[#FFD700]">
        {/* Search / sort controls */}
        <div className="space-y-3">
          <div className="flex gap-2">
            {/* Search input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 casino-text-gold" />
              <Input
                placeholder="Search tokens…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="casino-input pl-10"
              />
            </div>

            {/* Sort dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="casino-input px-3 py-2 font-bold"
              style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}
            >
              <option value="value">By Value</option>
              <option value="balance">By Balance</option>
              <option value="name">By Name</option>
            </select>
          </div>

          {/* Display options */}
          {showAdvancedControls && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 casino-text-gold" />
                <span className="text-sm casino-text-yellow font-bold">Show Price Impact</span>
                <Switch 
                  checked={showPriceImpact} 
                  onCheckedChange={setShowPriceImpact}
                />
              </div>
            </div>
          )}

          {/* Advanced controls */}
          {showAdvancedControls && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="border-t border-[#FFD700]/30 pt-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 casino-text-gold" />
                  <span className="text-sm casino-text-yellow font-bold">
                    Bulk Select:
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Slider
                    value={[bulkSelectPercentage]}
                    onValueChange={([v]) => setBulkSelectPercentage(v)}
                    max={100}
                    min={0}
                    step={25}
                    className="w-32"
                  />
                  <span className="text-sm casino-text-gold font-bold w-8">
                    {bulkSelectPercentage}%
                  </span>
                </div>

                <Button
                  onClick={handleBulkSelect}
                  className="casino-button text-xs px-3 py-1"
                >
                  Select Top 10
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </CardHeader>

      {/* --------------------------- Token list ------------------------------ */}
      <CardContent className="flex-1 p-0 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            <AnimatePresence initial={false}>
              {filteredTokens.map((token) => {
                const isSelected = isTokenSelected(token.mint);
                const selectedAmount = getSelectedTokenAmount(token.mint);
                const tokenPriceInSol = tokenPricesInSol?.[token.mint] ?? null;
                
                // Calculate USD values - always calculate since USD values are always shown
                let tokenUSDValue: number | null = null;
                let selectedUSDValue: number | null = null;
                let maxUSDValue = 0;

                if (token.mint === 'So11111111111111111111111111111111111111112' && solPrice) {
                  tokenUSDValue = token.amount * solPrice;
                  if (isSelected) {
                    selectedUSDValue = selectedAmount * solPrice;
                  }
                  maxUSDValue = Math.floor(token.amount * solPrice * 100) / 100;
                } else if (tokenPriceInSol && solPrice) {
                  tokenUSDValue = calculateTokenUSDValue(token, token.amount, tokenPriceInSol, solPrice);
                  if (isSelected) {
                    selectedUSDValue = calculateTokenUSDValue(token, selectedAmount, tokenPriceInSol, solPrice);
                  }
                  maxUSDValue = calculateMaxUSDValue(token, tokenPriceInSol, solPrice);
                }

                return (
                  <motion.div
                    key={token.mint}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={"rounded-xl transition-all duration-200 overflow-hidden"}
                    style={{}}
                  >
                    {/* Main Token Row */}
                    <div className="p-3">
                      <div className="flex items-center gap-3">
                        {/* Select / deselect toggle */}
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            isSelected
                              ? handleDeselectToken(token.mint)
                              : handleSelectToken(token);
                          }}
                          className="cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckCircle className="h-5 w-5 text-[#FFD700]" fill="currentColor" />
                          ) : (
                            <Circle className="h-5 w-5 text-[#FFD700]/60 hover:text-[#FFD700]" />
                          )}
                        </motion.div>

                        {/* Token avatar + info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="relative w-8 h-8 flex-shrink-0">
                            <Image
                              src={token.image}
                              alt={token.symbol}
                              fill
                              className="rounded-full object-cover"
                              onError={(e) =>
                                ((e.target as HTMLImageElement).src =
                                  "/jackpotlogo.png")
                              }
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="font-black casino-text-gold text-base truncate"
                                style={{
                                  fontFamily:
                                    "Visby Round CF, SF Pro Display, sans-serif",
                                }}
                              >
                                {token.symbol}
                              </span>
                              {tokenUSDValue && tokenUSDValue > 1000 && (
                                <TrendingUp className="h-3 w-3 text-green-400" />
                              )}
                            </div>
                            
                            {/* Token amount and USD value side by side */}
                            <div className="flex items-center gap-2 text-xs">
                              <span className="casino-text-yellow font-bold">
                                {formatTokenAmountForDisplay(token.amount, token.decimals)}
                              </span>
                              {tokenUSDValue && tokenUSDValue > 0 && (
                                <>
                                  <span className="text-gray-500">•</span>
                                  <span className="casino-text-green-400 font-bold">
                                    {formatUSDValueForDisplay(tokenUSDValue)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions on right */}
                        {isSelected ? (
                          <div className="flex items-center gap-3">
                            {/* Input fields for selected tokens */}
                            <div className="flex items-center gap-2">
                              {/* Token amount input */}
                              <div className="relative w-24">
                                <Input
                                  type="number"
                                  value={selectedAmount}
                                  onChange={(e) => handleTokenInput(token.mint, e.target.value)}
                                  onFocus={() => handleInputFocus(`token-${token.mint}`)}
                                  onBlur={() => handleInputBlur(`token-${token.mint}`)}
                                  min={0}
                                  max={token.amount}
                                  step={1 / Math.pow(10, Math.min(token.decimals, 6))}
                                  className={`casino-input text-xs text-center font-bold h-8 ${
                                    isInputFocused(`token-${token.mint}`) ? 'opacity-100' : 'opacity-0'
                                  }`}
                                />
                                
                                {!isInputFocused(`token-${token.mint}`) && (
                                  <div
                                    onClick={() => handleInputFocus(`token-${token.mint}`)}
                                    className="absolute inset-0 flex items-center justify-center text-xs casino-text-gold font-bold cursor-pointer bg-[var(--casino-dark-purple)] border-2 border-[var(--casino-gold)] rounded-md"
                                  >
                                    {formatTokenAmountForDisplay(selectedAmount, token.decimals)}
                                  </div>
                                )}
                              </div>

                              {/* USD value input - show if we have valid USD data */}
                              {selectedUSDValue && selectedUSDValue > 0 && (
                                <div className="relative w-20">
                                  <Input
                                    type="number"
                                    value={selectedUSDValue.toFixed(2)}
                                    onChange={(e) => handleUSDInput(token.mint, e.target.value)}
                                    onFocus={() => handleInputFocus(`usd-${token.mint}`)}
                                    onBlur={() => handleInputBlur(`usd-${token.mint}`)}
                                    min={0}
                                    max={maxUSDValue}
                                    step={0.01}
                                    className={`casino-input text-xs text-center font-bold h-8 ${
                                      isInputFocused(`usd-${token.mint}`) ? 'opacity-100' : 'opacity-0'
                                    }`}
                                    disabled={!tokenPriceInSol || !solPrice}
                                  />
                                  
                                  {!isInputFocused(`usd-${token.mint}`) && (
                                    <div
                                      onClick={() => handleInputFocus(`usd-${token.mint}`)}
                                      className="absolute inset-0 flex items-center justify-center text-xs casino-text-green-400 font-bold cursor-pointer bg-[var(--casino-dark-purple)] border-2 border-[var(--casino-gold)] rounded-md"
                                    >
                                      {formatUSDValueForDisplay(selectedUSDValue)}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Percentage badge */}
                            <Badge className="bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/60 text-xs">
                              {((selectedAmount / token.amount) * 100).toFixed(0)}%
                            </Badge>

                            {/* Remove button */}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeselectToken(token.mint)}
                              className="p-1.5 rounded-full bg-[#FF1493]/30 hover:bg-[#FF1493]/60 transition-colors"
                              title="Remove token"
                            >
                              <Minus className="h-4 w-4 text-[#FF1493]" />
                            </motion.button>
                          </div>
                        ) : (
                          /* Add button (when not selected) */
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleSelectToken(token)}
                            className="p-1.5 rounded-full bg-[#FFD700] hover:bg-[#FFFF00] transition-colors shadow-lg"
                            title="Add token"
                          >
                            <Plus className="h-4 w-4 text-black" />
                          </motion.button>
                        )}
                      </div>

                      {/* Simple Percentage Slider - shown when selected */}
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          className="mt-3 px-4 pb-1"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 text-xs casino-text-gold text-center font-bold">0%</div>
                            <div className="flex-1 relative py-2">
                              {/* Background Track */}
                              <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-[#4A0E4E] rounded-full transform -translate-y-1/2"></div>
                              
                              {/* Colored Fill */}
                              <div
                                className="absolute top-1/2 left-0 h-1.5 bg-gradient-to-r from-[#FFD700] to-[#FFFF00] rounded-full transform -translate-y-1/2"
                                style={{ width: `${(selectedAmount / token.amount) * 100}%` }}
                              ></div>
                              
                              {/* Actual Slider */}
                              <Slider
                                value={[(selectedAmount / token.amount) * 100]}
                                min={0}
                                max={100}
                                step={1}
                                onValueChange={([percentage]) => {
                                  const amount = (token.amount * percentage) / 100;
                                  updateTokenAmount(token.mint, amount);
                                }}
                                className="slider-casino"
                              />
                            </div>
                            <div className="w-6 text-xs casino-text-gold text-center font-bold">100%</div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Empty-state */}
            {filteredTokens.length === 0 && (
              <div className="text-center py-8">
                <div className="casino-text-gold font-bold">
                  {searchTerm
                    ? "No tokens match your search"
                    : "No tokens found"}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Information footer */}
      {showAdvancedControls && (
        <div className="border-t border-[#FFD700]/50 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 casino-text-gold" />
            <span className="text-xs casino-text-yellow font-bold">
              Click amount values to edit directly
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 casino-text-gold" />
            <span className="text-xs casino-text-gold font-bold">
              {formatUSDValueForDisplay(totalSelectedUSD)} total selected
            </span>
          </div>
        </div>
      )}

      {/* Custom slider styling */}
      <style jsx global>{`
        .slider-casino [data-radix-slider-thumb] {
          width: 14px;
          height: 14px;
          background: linear-gradient(45deg, #fbbf24, #f59e0b);
          border: 2px solid #FFFFFF;
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
          cursor: pointer;
          transition: transform 0.1s;
        }
        
        .slider-casino [data-radix-slider-thumb]:hover {
          transform: scale(1.2);
          background: linear-gradient(45deg, #FFFF00, #FFD700);
        }
        
        .slider-casino [data-radix-slider-track] {
          height: 8px;
        }
        
        .slider-casino [data-radix-slider-range] {
          display: none;
        }
      `}</style>
    </Card>
    </div>
  );
}