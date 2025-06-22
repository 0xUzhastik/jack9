'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useSolPriceUSD } from '@/hooks/useSolPriceUSD';
import { useTokenPricesSol } from '@/hooks/useTokenPriceSol';
import { useTokenData } from '@/hooks/useTokenData';
import { formatAmountAbbreviated } from '@/utils/tokenUtils';
import TokenPortfolioView from './TokenPortfolioView';
import { WalletConnect } from './WalletConnect';
import { useTokenStore } from '@/stores/tokenStore';
import { useDebugStore } from '@/stores/debugStore';
import { TokenRow } from '@/lib/tokenUtils';

interface TokenPortfolioWrapperProps {
  mutateTokenBalances?: () => Promise<any>;
}

export function TokenPortfolioWrapper({ mutateTokenBalances }: TokenPortfolioWrapperProps) {
    const { authenticated, user } = usePrivy();
    
    // Get debug wallet address
    const { debugWalletAddress } = useDebugStore();
    
    // Use debug address if available, otherwise use connected wallet
    const effectiveWalletAddress = debugWalletAddress || user?.wallet?.address;
    const isUsingDebugWallet = !!debugWalletAddress;
    
    const { tokens: rawTokens = [], loading, error } = useTokenBalances(effectiveWalletAddress);
    const tokens: TokenRow[] = rawTokens;

    // Get SOL price
    const { price: solPrice } = useSolPriceUSD();

    // Memoize stable mint addresses to prevent unnecessary re-fetches
    const mintAddresses = useMemo(() => {
        return tokens?.map(token => token.mint) || [];
    }, [tokens]);
    
    const { prices: tokenPricesInSol } = useTokenPricesSol(mintAddresses);

    // Fetch token data from DexScreener to filter tokens with trading pairs
    const { data: dexScreenerData, error: dexScreenerError, isLoading: dexScreenerLoading } = useTokenData({
        chainId: "solana",
        tokenAddresses: mintAddresses,
        enabled: mintAddresses.length > 0
    });

    // Filter tokens to only include those with DexScreener trading data
    const filteredTokens: TokenRow[] = useMemo(() => {
        if (!tokens || !dexScreenerData) return [];
        
        const dexScreenerTokens = new Set(
            dexScreenerData.map((pair: any) => pair.baseToken.address)
        );

        const filtered = tokens.filter((token: TokenRow) => dexScreenerTokens.has(token.mint));
        
        // Only log in development and when data actually changes
        if (process.env.NODE_ENV === 'development' && filtered.length > 0) {
            console.log("TokenPortfolio: Filtered tokens with trading data:", filtered.length, "from wallet:", isUsingDebugWallet ? "DEBUG" : "CONNECTED");
        }
        
        return filtered;
    }, [tokens, dexScreenerData, isUsingDebugWallet]);

    // Calculate USD values for each token - with TRUNCATION
    const stackValues = useMemo(() => {
        if (!filteredTokens || !solPrice) return [];
        
        const values = filteredTokens.map(token => {
            const tokenPriceInSol = tokenPricesInSol[token.mint];
            if (tokenPriceInSol) {
                const valueInSol = token.amount * tokenPriceInSol;
                return valueInSol * solPrice;
            }
            return 0;
        });
        
        return values;
    }, [filteredTokens, tokenPricesInSol, solPrice]);

    // Zustand store for slider percentages
    const {
        sliderPercentages,
        setSliderPercentages,
        updateSliderPercentage,
        selectedTokens,
        addToken,
        removeToken
    } = useTokenStore();
    // Ensure sliderPercentages is always a number[]
    const safeSliderPercentages: number[] = Array.isArray(sliderPercentages) ? sliderPercentages : [];

    // Initialize slider percentages only when needed
    const initializeSliderPercentages = useCallback(() => {
        if (filteredTokens.length > 0 && sliderPercentages.length !== filteredTokens.length) {
            const newSliderPercentages = filteredTokens.map(() => 0); // Default to 0%
            setSliderPercentages(newSliderPercentages);
        }
    }, [filteredTokens.length, sliderPercentages.length, setSliderPercentages]);

    // Initialize slider percentages when filteredTokens change
    useEffect(() => {
        initializeSliderPercentages();
    }, [initializeSliderPercentages]);

    // Memoized slider change handler
    const handleSliderChange = useCallback((index: number, percentage: number) => {
        const safeTokens: TokenRow[] = filteredTokens || [];
        updateSliderPercentage(index, percentage);
        const token = safeTokens[index];
        if (!token) return;
        // Always get the latest amount from the tokens array (from SWR)
        const latestToken = tokens.find(t => t.mint === token.mint) || token;
        const selectedAmount = (latestToken.amount * percentage) / 100;
        const isAlreadySelected = selectedTokens.some(t => t.mint === token.mint);
        if (percentage > 0) {
            // Add or update token in selectedTokens with the latest amount
            addToken({ ...latestToken, selectedAmount });
        } else if (isAlreadySelected) {
            // Remove token if slider is set to 0
            removeToken(token.mint);
        }
    }, [updateSliderPercentage, filteredTokens, selectedTokens, addToken, removeToken, tokens]);

    // Helper functions to prevent recreation on every render
    const getTokenImage = useCallback((index: number) => {
        return filteredTokens[index]?.image || "/jackpotlogo.png";
    }, [filteredTokens]);

    const getTokenSymbol = useCallback((index: number) => {
        return filteredTokens[index]?.symbol || "Unknown";
    }, [filteredTokens]);

    const getRawTokenAmount = useCallback((index: number) => {
        const token = filteredTokens[index];
        if (!token) return "0";
        return formatAmountAbbreviated(token.amount, token.decimals);
    }, [filteredTokens]);

    // Calculate which column a token should be in (1-based)
    const getColumnForToken = useCallback((tokenIndex: number, totalTokens: number) => {
        return tokenIndex + 1; // Simple 1-to-1 mapping for now
    }, []);

    // Calculate total columns needed - exactly match the number of tokens
    const totalColumns = filteredTokens.length;

    // Clear sliders when selectedTokens is cleared (after deposit)
    useEffect(() => {
        if (selectedTokens.length === 0 && safeSliderPercentages.some(p => p > 0)) {
            setSliderPercentages(safeSliderPercentages.map(() => 0));
            if (mutateTokenBalances) mutateTokenBalances();
        }
    }, [selectedTokens.length, safeSliderPercentages, setSliderPercentages, mutateTokenBalances]);

    // Show loading state
    if (loading) {
        return (
            <div className="relative text-[#FFD700] w-full h-full flex flex-col font-bold text-[1.2rem] items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD700] mx-auto"></div>
                    <div className="mt-2 text-sm">
                        Loading tokens{isUsingDebugWallet ? " (Debug Mode)" : ""}...
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="relative text-[#FFD700] w-full h-full flex flex-col font-bold text-[1.2rem] items-center justify-center">
                <div className="text-center text-red-400">
                    <div className="text-sm">Error loading tokens:</div>
                    <div className="text-xs mt-1">{error}</div>
                </div>
            </div>
        );
    }

    // Show connect wallet state (only if not using debug mode)
    if (!authenticated && !isUsingDebugWallet) {
        return (
            <div className="relative text-[#FFD700] w-full h-full flex flex-col font-bold text-[1.2rem] items-center justify-center">
                <div className="text-center">
                    <WalletConnect />
                </div>
            </div>
        );
    }

    // Show no tokens state
    if (!filteredTokens.length) {
        return (
            <div className="relative text-[#FFD700] w-full h-full flex flex-col font-bold text-[1.2rem] items-center justify-center">
                <div className="text-center">
                    <div className="text-sm">
                        {dexScreenerLoading ? "Loading trading data..." : "No tokens with trading data found"}
                    </div>
                    {dexScreenerError && (
                        <div className="text-xs text-red-400 font-bold mt-1">
                            Error loading trading data
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Show loading if we don't have price data yet
    if (!solPrice || Object.keys(tokenPricesInSol).length === 0) {
        return (
            <div className="relative text-[#FFD700] w-full h-full flex flex-col font-bold text-[1.2rem] items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD700] mx-auto"></div>
                    <div className="mt-2 text-sm">Loading price data...</div>
                </div>
            </div>
        );
    }

    return (
        <TokenPortfolioView
            stackValues={stackValues}
            sliderValues={sliderPercentages}
            onSliderChange={handleSliderChange}
            filteredTokens={filteredTokens}
            totalColumns={totalColumns}
            getTokenImage={getTokenImage}
            getTokenSymbol={getTokenSymbol}
            getRawTokenAmount={getRawTokenAmount}
            getColumnForToken={getColumnForToken}
            tokenPricesInSol={tokenPricesInSol}
            solPrice={solPrice}
        />
    );
}