// Shared price calculation utilities

import { TokenRow } from './tokenUtils';

// 🔥 UNIFIED: Calculate USD value from token amount
export function calculateTokenUSDValue(
  token: TokenRow,
  tokenAmount: number,
  tokenPriceInSol: number | null,
  solPrice: number | null
): number | null {
  if (token.mint === 'So11111111111111111111111111111111111111112') {
    // SOL: direct USD calculation
    if (!solPrice) return null;
    return tokenAmount * solPrice;
  }
  if (!tokenPriceInSol || !solPrice) return null;
  // Other tokens: convert through SOL
  const valueInSol = tokenAmount * tokenPriceInSol;
  return valueInSol * solPrice;
}

// 🔥 UNIFIED: Calculate token amount from USD value
export function calculateTokenAmountFromUSD(
  token: TokenRow,
  usdValue: number,
  tokenPriceInSol: number | null,
  solPrice: number | null
): number | null {
  if (token.mint === 'So11111111111111111111111111111111111111112') {
    if (!solPrice) return null;
    // SOL: direct calculation
    return usdValue / solPrice;
  }
  if (!tokenPriceInSol || !solPrice) return null;
  // Other tokens: convert through SOL
  const valueInSol = usdValue / solPrice;
  return valueInSol / tokenPriceInSol;
}

// 🔥 UNIFIED: Calculate max USD value for a token
export function calculateMaxUSDValue(
  token: TokenRow,
  tokenPriceInSol: number | null,
  solPrice: number | null
): number {
  if (token.mint === 'So11111111111111111111111111111111111111112') {
    if (!solPrice) return 0;
    // SOL: direct USD calculation - truncate instead of round
    return Math.floor(token.amount * solPrice * 100) / 100;
  }
  if (!solPrice || !tokenPriceInSol) return 0;
  // Other tokens: convert through SOL - truncate instead of round
  const valueInSol = token.amount * tokenPriceInSol;
  return Math.floor(valueInSol * solPrice * 100) / 100;
}

// 🔥 UNIFIED: Get display values for token selection (selected vs remaining)
export function getTokenDisplayValues(
  token: TokenRow,
  percentage: number,
  tokenPricesInSol: Record<string, number | null>,
  solPrice: number | null
): { selectedValue: number; remainingValue: number; selectedTokenCount: number; remainingTokenCount: number } {
  const selectedTokenCount = (token.amount * percentage) / 100;
  const remainingTokenCount = token.amount - selectedTokenCount;
  
  const tokenPriceInSol = tokenPricesInSol[token.mint];
  if (!tokenPriceInSol || !solPrice) {
    return { 
      selectedValue: 0, 
      remainingValue: 0,
      selectedTokenCount,
      remainingTokenCount
    };
  }

  // Convert token counts to USD values for display
  const selectedValueInSol = selectedTokenCount * tokenPriceInSol;
  const remainingValueInSol = remainingTokenCount * tokenPriceInSol;
  
  const selectedValue = selectedValueInSol * solPrice;
  const remainingValue = remainingValueInSol * solPrice;

  return {
    selectedValue: Math.round(selectedValue * 100) / 100,
    remainingValue: Math.round(remainingValue * 100) / 100,
    selectedTokenCount,
    remainingTokenCount
  };
}

// 🔥 UNIFIED: Currency value formatting for display
export function formatCurrencyValue(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  } else {
    return `$${value.toFixed(0)}`;
  }
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
  // 🔥 FIXED: Only check solPrice for SOL, otherwise check both
  if (token.mint === 'So11111111111111111111111111111111111111112') {
    if (solPrice === null) return 0;
    const usdValue = calculateTokenUSDValue(token, tokenAmount, null, solPrice);
    return usdValue !== null ? Math.floor(usdValue * 100) / 100 : 0;
  }
  if (tokenPriceInSol === undefined || tokenPriceInSol === null || solPrice === null) {
    return 0; // Return 0 if we don't have valid price data
  }
  const usdValue = calculateTokenUSDValue(token, tokenAmount, tokenPriceInSol, solPrice);
  return usdValue !== null ? Math.floor(usdValue * 100) / 100 : 0;
}