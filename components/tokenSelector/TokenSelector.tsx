"use client";

import { useState, useEffect, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LayoutGroup, AnimatePresence } from "framer-motion";
import { Wallet, Coins } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useSolPriceUSD } from "@/hooks/useSolPriceUSD";
import { useTokenPricesSol } from "@/hooks/useTokenPriceSol";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { useTokenData } from "@/hooks/useTokenData";
import { useTokenStore } from "@/stores/tokenStore";
import { useUIStore } from "@/stores/uiStore";
import { useDebugStore } from "@/stores/debugStore";
import { MobileTokenRow } from "./MobileTokenRow";
import { calculateTokenUSDValue } from "@/lib/priceCalculations";

interface TokenSelectorProps {
  selectedTokens: any[]; // Kept for compatibility
  onSelectedTokensChange: (tokens: any[]) => void; // Kept for compatibility
  delayedExpandToken?: string | null;
  onClearDelayedExpand?: () => void;
  isMobile?: boolean;
}

export function TokenSelector({
  delayedExpandToken,
  onClearDelayedExpand,
  isMobile = false,
}: TokenSelectorProps) {
  const { authenticated, user } = usePrivy();
  
  // Get debug wallet address
  const { debugWalletAddress } = useDebugStore();
  
  // Use debug address if available, otherwise use connected wallet
  const effectiveWalletAddress = debugWalletAddress || user?.wallet?.address;
  const isUsingDebugWallet = !!debugWalletAddress;
  
  const { tokens, loading, error } = useTokenBalances(effectiveWalletAddress);
  
  // Get all mint addresses for DexScreener filtering
  const mintAddresses = useMemo(() => tokens?.map(token => token.mint) || [], [tokens]);
  const { data: dexScreenerData, error: dexScreenerError, isLoading: dexScreenerLoading } = useTokenData({
    chainId: "solana",
    tokenAddresses: mintAddresses,
    enabled: mintAddresses.length > 0
  });

  // Filter tokens to only include those with DexScreener trading data (same as portfolio view)
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

  // Add price hooks for USD values
  const { price: solPrice } = useSolPriceUSD();

  // Use Zustand store for token operations instead of props
  const { 
    selectedTokens: zustandSelectedTokens,
    expandedToken,
    setExpandedToken,
    addToken,
    removeToken,
    updateTokenAmount
  } = useTokenStore();

  // Calculate USD values for each token using shared utility
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

  // Use Zustand selected tokens instead of props
  const selectedMints = new Set(zustandSelectedTokens.map(t => t.mint));
  const availableTokens = filteredTokens.filter(t => !selectedMints.has(t.mint));
  
  // Combine lists: selected first, then available
  const allTokens = [
    ...zustandSelectedTokens.map(st => ({
      ...st,
      // Make sure we have the latest balance data
      amount: filteredTokens.find(t => t.mint === st.mint)?.amount ?? st.amount,
      selected: true
    })),
    ...availableTokens.map(at => ({ ...at, selected: false }))
  ];

  // Use Zustand actions instead of prop-based callbacks
  const select = (token: any) => {
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
        </h3>
      </div>

      {/* Fill ALL available space with proper flex layout */}
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
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <span className="text-sm text-red-400 font-bold">
              Error: {error}
            </span>
          </div>
        ) : !allTokens.length ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Wallet className="h-8 w-8 casino-text-gold mb-2" />
            <span className="text-sm casino-text-gold font-bold">
              {dexScreenerLoading ? "Loading trading data..." : "No tokens with trading data found"}
            </span>
          </div>
        ) : (
          <div className="px-2">
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

      {/* Enhanced scrollbar styles */}
      <style jsx>{`
        /* WEBKIT SCROLLBAR - Ultra visible with animations */
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

        /* FIREFOX FALLBACK */
        .scrollable-list-container {
          scrollbar-width: thick !important;
          scrollbar-color: #FFD700 #2D0A30 !important;
        }
      `}</style>
    </div>
  );
}