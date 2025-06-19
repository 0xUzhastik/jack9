// Shared price calculation utilities

import { TokenRow } from './tokenUtils';

// 🔥 UNIFIED: Calculate USD value from token amount
export function calculateTokenUSDValue(
  token: TokenRow,
  tokenAmount: number,
  tokenPriceInSol: number | null,
  solPrice: number | null
): number | null {
  if (!tokenPriceInSol || !solPrice) return null;
  
  if (token.mint === 'So11111111111111111111111111111111111111112') {
    // SOL: direct USD calculation
    return tokenAmount * solPrice;
  } else {
    // Other tokens: convert through SOL
    const valueInSol = tokenAmount * tokenPriceInSol;
    return valueInSol * solPrice;
  }
}

// 🔥 UNIFIED: Calculate token amount from USD value
export function calculateTokenAmountFromUSD(
  token: TokenRow,
  usdValue: number,
  tokenPriceInSol: number | null,
  solPrice: number | null
): number | null {
  if (!tokenPriceInSol || !solPrice) return null;
  
  if (token.mint === 'So11111111111111111111111111111111111111112') {
    // SOL: direct calculation
    return usdValue / solPrice;
  } else {
    // Other tokens: convert through SOL
    const valueInSol = usdValue / solPrice;
    return valueInSol / tokenPriceInSol;
  }
}

// 🔥 UNIFIED: Calculate max USD value for a token
export function calculateMaxUSDValue(
  token: TokenRow,
  tokenPriceInSol: number | null,
  solPrice: number | null
): number {
  if (!solPrice || !tokenPriceInSol) return 0;
  
  if (token.mint === 'So11111111111111111111111111111111111111112') {
    // SOL: direct USD calculation - truncate instead of round
    return Math.floor(token.amount * solPrice * 100) / 100;
  } else {
    // Other tokens: convert through SOL - truncate instead of round
    const valueInSol = token.amount * tokenPriceInSol;
    return Math.floor(valueInSol * solPrice * 100) / 100;
  }
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