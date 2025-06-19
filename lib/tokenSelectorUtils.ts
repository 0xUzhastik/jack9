// Shared utilities for token selector components

import { TokenRow } from './tokenUtils';
import { calculateTokenUSDValue, calculateTokenAmountFromUSD, calculateMaxUSDValue } from './priceCalculations';

// 🔥 UNIFIED: Token amount formatting for display overlays
export function formatTokenAmountForDisplay(amount: number, decimals: number): string {
  if (amount === 0) return '0';
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 100000) return `${(amount / 1000).toFixed(2)}K`;
  if (amount >= 100) return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (amount >= 10) return amount.toFixed(2);
  return amount.toFixed(3);
}

// 🔥 UNIFIED: USD value formatting for display overlays
export function formatUSDValueForDisplay(usdValue: number): string {
  if (usdValue === 0) return '$0';
  if (usdValue >= 1000000) {
    const truncated = Math.floor((usdValue / 1000000) * 10) / 10;
    return `$${truncated}M`;
  }
  if (usdValue >= 1000) {
    const truncated = Math.floor((usdValue / 1000) * 10) / 10;
    return `$${truncated}K`;
  }
  if (usdValue >= 1) {
    const truncated = Math.floor(usdValue * 100) / 100;
    const fixed = truncated.toFixed(2);
    return fixed.endsWith('.00') ? `$${truncated.toFixed(0)}` : `$${fixed}`;
  }
  const truncated = Math.floor(usdValue * 10000) / 10000;
  return `$${truncated.toFixed(4)}`;
}

// 🔥 UNIFIED: Calculate USD value from token amount with error handling
export function calculateTokenUSDValueSafe(
  token: TokenRow,
  tokenAmount: number,
  tokenPriceInSol: number | null | undefined, // Added undefined as possible type
  solPrice: number | null
): number {
  // 🔥 FIXED: Check if tokenPriceInSol is undefined before using it
  if (tokenPriceInSol === undefined || tokenPriceInSol === null || solPrice === null) {
    return 0; // Return 0 if we don't have valid price data
  }
  
  const usdValue = calculateTokenUSDValue(token, tokenAmount, tokenPriceInSol, solPrice);
  return usdValue !== null ? Math.floor(usdValue * 100) / 100 : 0;
}

// 🔥 UNIFIED: Calculate max USD value with error handling
export function calculateMaxUSDValueSafe(
  token: TokenRow,
  tokenPriceInSol: number | null | undefined, // Added undefined as possible type
  solPrice: number | null
): number {
  // 🔥 FIXED: Check if tokenPriceInSol is undefined before using it
  if (!solPrice || tokenPriceInSol === undefined || tokenPriceInSol === null) return 0;
  
  if (token.mint === 'So11111111111111111111111111111111111111112') {
    return Math.floor(token.amount * solPrice * 100) / 100;
  } else {
    const valueInSol = token.amount * tokenPriceInSol;
    return Math.floor(valueInSol * solPrice * 100) / 100;
  }
}

// 🔥 UNIFIED: Validate Solana wallet address
export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  
  // Basic validation - Solana addresses are typically 32-44 characters
  if (address.length < 32 || address.length > 44) return false;
  
  // Check if it's base58 encoded (roughly)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return base58Regex.test(address);
}

// 🔥 UNIFIED: Sort tokens by USD value (highest first)
export function sortTokensByUSDValue(
  tokens: TokenRow[],
  tokenPricesInSol: Record<string, number | null> = {}, // Default empty object
  solPrice: number | null
): TokenRow[] {
  if (!tokenPricesInSol || Object.keys(tokenPricesInSol).length === 0) {
    // If no price data is available, just return the original order
    return [...tokens];
  }

  return [...tokens].sort((a, b) => {
    // Safely access tokenPricesInSol with null coalescence
    const aPriceInSol = tokenPricesInSol[a.mint] ?? 0;
    const bPriceInSol = tokenPricesInSol[b.mint] ?? 0;
    
    // Calculate USD values safely
    const aUSD = calculateTokenUSDValueSafe(a, a.amount, aPriceInSol, solPrice);
    const bUSD = calculateTokenUSDValueSafe(b, b.amount, bPriceInSol, solPrice);
    
    return bUSD - aUSD;
  });
}

// 🔥 UNIFIED: Filter tokens by search term
export function filterTokensBySearch(tokens: TokenRow[], searchTerm: string): TokenRow[] {
  if (!searchTerm.trim()) return tokens;
  
  const search = searchTerm.toLowerCase().trim();
  return tokens.filter(token => 
    token.symbol.toLowerCase().includes(search) ||
    token.name.toLowerCase().includes(search) ||
    token.mint.toLowerCase().includes(search)
  );
}

// 🔥 UNIFIED: Calculate total USD value of selected tokens
export function calculateTotalSelectedUSD(
  selectedTokens: TokenRow[],
  tokenPricesInSol: Record<string, number | null> = {}, // Default empty object
  solPrice: number | null
): number {
  if (!tokenPricesInSol || Object.keys(tokenPricesInSol).length === 0 || !solPrice) {
    return 0; // Return 0 if no price data
  }

  return selectedTokens.reduce((total, token) => {
    const selectedAmount = token.selectedAmount ?? 0;
    if (selectedAmount <= 0) return total;
    
    // Safely access tokenPricesInSol with null coalescence
    const priceInSol = tokenPricesInSol[token.mint] ?? 0;
    const usdValue = calculateTokenUSDValueSafe(token, selectedAmount, priceInSol, solPrice);
    
    return total + usdValue;
  }, 0);
}