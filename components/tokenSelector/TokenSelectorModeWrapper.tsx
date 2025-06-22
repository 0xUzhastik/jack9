"use client";

import { TokenPortfolioWrapper } from "../TokenPortfolioWrapper";
import { DesktopTokenSelector } from "./DesktopTokenSelector";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { useSolPriceUSD } from "@/hooks/useSolPriceUSD";
import { useTokenPricesSol } from "@/hooks/useTokenPriceSol"; // 🔧 FIXED: Import from correct file name (singular file, plural hook)
import { useTokenData } from "@/hooks/useTokenData";
import { useDebugStore } from "@/stores/debugStore";
import { usePrivy } from '@privy-io/react-auth';
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { WalletConnect } from "../WalletConnect";
import { useUIStore } from '@/stores/uiStore';

interface TokenSelectorModeWrapperProps {
  mutateTokenBalances?: () => Promise<any>;
}

export function TokenSelectorModeWrapper({ mutateTokenBalances }: TokenSelectorModeWrapperProps) {
  const { tokenSelectorMode } = useSettingsStore();
  const { authenticated, user } = usePrivy();
  const { debugWalletAddress } = useDebugStore();
  
  // 🔧 FIXED: Use same data fetching pattern as TokenPortfolioWrapper (chip view)
  // Use debug address if available, otherwise use connected wallet
  const effectiveWalletAddress = debugWalletAddress || user?.wallet?.address;
  const isUsingDebugWallet = !!debugWalletAddress;
  
  const { tokens, loading, error } = useTokenBalances(effectiveWalletAddress);
  const { price: solPrice } = useSolPriceUSD();
  
  // Get all mint addresses for price fetching and DexScreener filtering
  const mintAddresses = useMemo(() => tokens?.map(token => token.mint) || [], [tokens]);
  const { prices: tokenPricesInSol } = useTokenPricesSol(mintAddresses); // 🔧 FIXED: Use correct plural hook from singular file
  const { data: dexScreenerData } = useTokenData({
    chainId: "solana",
    tokenAddresses: mintAddresses,
    enabled: mintAddresses.length > 0
  });

  // 🔧 FIXED: Filter tokens to only include those with DexScreener trading data (same as chip view)
  const filteredTokens = useMemo(() => {
    if (!tokens || !dexScreenerData) return [];
    
    const dexScreenerTokens = new Set(
      dexScreenerData.map(pair => pair.baseToken.address)
    );

    const filtered = tokens.filter(token => dexScreenerTokens.has(token.mint));
    
    // 🔧 DEBUG: Log data flow in development
    if (process.env.NODE_ENV === 'development' && filtered.length > 0) {
      // console.log("🔧 TokenSelectorModeWrapper: Data successfully filtered", {
      //   totalTokens: tokens.length,
      //   filteredTokens: filtered.length,
      //   solPrice,
      //   tokenPricesLoaded: Object.keys(tokenPricesInSol).length,
      //   mode: tokenSelectorMode,
      //   wallet: isUsingDebugWallet ? "DEBUG" : "CONNECTED"
      // });
    }
    
    return filtered;
  }, [tokens, dexScreenerData, isUsingDebugWallet, tokenPricesInSol, solPrice, tokenSelectorMode]);

  // Show connect wallet state (only if not using debug mode)
  if (!authenticated && !isUsingDebugWallet) {
    return (
      <Card className="casino-box casino-box-gold h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <WalletConnect />
          </div>
        </CardContent>
      </Card>
    );
  }

  // 🔧 FIXED: Debug logging for desktop selector data
  if (process.env.NODE_ENV === 'development' && tokenSelectorMode === 'desktop') {
    console.log("🔧 Passing to Desktop Selector:", {
      tokensCount: filteredTokens.length,
      solPrice,
      tokenPricesCount: Object.keys(tokenPricesInSol).length,
      validPrices: Object.entries(tokenPricesInSol).filter(([, price]) => price !== null).length,
      loading,
      error,
      sampleToken: filteredTokens[0] ? {
        symbol: filteredTokens[0].symbol,
        hasPrice: !!tokenPricesInSol[filteredTokens[0].mint]
      } : null
    });
  }

  // Render based on selected mode
  switch (tokenSelectorMode) {
    case 'desktop':
      return (
        <DesktopTokenSelector
          tokens={filteredTokens}
          tokenPricesInSol={tokenPricesInSol}
          solPrice={solPrice}
          loading={loading}
          error={error}
        />
      );
    
    case 'chip':
    default:
      return <TokenPortfolioWrapper mutateTokenBalances={mutateTokenBalances} />;
  }
}