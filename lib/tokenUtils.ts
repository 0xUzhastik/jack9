// Shared token utility functions

export interface TokenRow {
  mint: string;
  amount: number;
  decimals: number;
  symbol: string;
  name: string;
  image: string;
  selected?: boolean;
  selectedAmount?: number;
}

// 🔥 UNIFIED: Token decimals mapping
export function getTokenDecimals(mint: string): number {
  const map: Record<string, number> = {
    So11111111111111111111111111111111111111112: 9, // SOL
    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 6, // USDC
    Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: 6, // USDT
  };
  return map[mint] ?? 6;
}

// 🔥 UNIFIED: Basic amount formatting
export function formatAmount(amount: number, decimals: number): string {
  if (amount === 0) return "0";
  if (amount < 0.000001) return amount.toExponential(Math.min(decimals, 3));
  return amount.toLocaleString(undefined, {
    maximumFractionDigits: Math.min(decimals, 6),
    minimumFractionDigits: 0,
  });
}

// 🔥 UNIFIED: Abbreviated amount formatting with suffixes
export function formatAmountAbbreviated(amount: number, decimals: number): string {
  if (amount === 0) return "0";
  if (amount < 0.000001) return amount.toExponential(Math.min(decimals, 3));

  const abs = Math.abs(amount);
  let value: number, suffix: string;

  if (abs >= 1_000_000_000) {
    value = amount / 1_000_000_000;
    suffix = "b";
  } else if (abs >= 1_000_000) {
    value = amount / 1_000_000;
    suffix = "m";
  } else if (abs >= 1_000) {
    value = amount / 1_000;
    suffix = "k";
  } else {
    return amount.toLocaleString(undefined, {
      maximumFractionDigits: Math.min(decimals, 6),
      minimumFractionDigits: 0,
    });
  }

  // Show up to 2 decimal places, but trim trailing zeros
  let str = value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  // Remove trailing .00 or .0
  str = str.replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1");

  return str + suffix;
}

// 🔥 UNIFIED: USD formatting with truncation instead of rounding
export function formatUSDValue(usdValue: number): string {
  if (usdValue >= 1000000) {
    const truncated = Math.floor((usdValue / 1000000) * 10) / 10;
    return `$${truncated}M`;
  } else if (usdValue >= 1000) {
    const truncated = Math.floor((usdValue / 1000) * 10) / 10;
    return `$${truncated}K`;
  } else if (usdValue >= 1) {
    const truncated = Math.floor(usdValue * 100) / 100;
    return `$${truncated.toFixed(2)}`;
  } else if (usdValue >= 0.01) {
    const truncated = Math.floor(usdValue * 100) / 100;
    return `$${truncated.toFixed(2)}`;
  } else {
    const truncated = Math.floor(usdValue * 10000) / 10000;
    return `$${truncated.toFixed(4)}`;
  }
}

// 🔥 UNIFIED: Smart USD formatting for overlay display (removes .00 for whole numbers)
export function formatUSDValueSmart(usdValue: number): string {
  if (usdValue === 0) return '0';
  if (usdValue >= 1000000) {
    const truncated = Math.floor((usdValue / 1000000) * 10) / 10;
    return `${truncated}M`;
  }
  if (usdValue >= 1000) {
    const truncated = Math.floor((usdValue / 1000) * 10) / 10;
    return `${truncated}K`;
  }
  if (usdValue >= 1) {
    const truncated = Math.floor(usdValue * 100) / 100;
    const fixed = truncated.toFixed(2);
    return fixed.endsWith('.00') ? truncated.toFixed(0) : fixed;
  }
  const truncated = Math.floor(usdValue * 10000) / 10000;
  return truncated.toFixed(4);
}

// 🔥 UNIFIED: Smart token amount formatting (abbreviated for display)
export function formatTokenAmountSmart(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2)}m`;
  } else if (amount >= 100000) {
    return `${(amount / 1000).toFixed(2)}k`;
  } else if (amount >= 100) {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else if (amount >= 10) {
    return amount.toFixed(2);
  } else {
    return amount.toFixed(3);
  }
}

// 🔥 UNIFIED: Convert percentage to token count
export function percentageToTokenCount(percentage: number, totalAmount: number): number {
  return (totalAmount * percentage) / 100;
}

// 🔥 UNIFIED: Convert token count to percentage
export function tokenCountToPercentage(tokenCount: number, totalAmount: number): number {
  if (totalAmount === 0) return 0;
  return (tokenCount / totalAmount) * 100;
}

// 🔥 UNIFIED: Clamp value between min and max
export function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(min, value), max);
}

// 🔥 UNIFIED: Check if input string is partial decimal (like "5." or "0.")
export function isPartialDecimal(inputValue: string): boolean {
  return inputValue.endsWith('.') && !isNaN(parseFloat(inputValue.slice(0, -1)));
}

// 🔥 UNIFIED: Parse input value safely
export function parseInputValue(inputValue: string): number {
  if (inputValue === '' || inputValue === '.') return 0;
  
  if (isPartialDecimal(inputValue)) {
    return parseFloat(inputValue.slice(0, -1));
  }
  
  const numValue = parseFloat(inputValue);
  return isNaN(numValue) ? 0 : numValue;
}

// 🔥 UNIFIED: Snap percentage to common values
export function snapPercentage(percentage: number, snapThreshold: number = 2): number {
  const snapPoints = [0, 100]; // Common snap points
  
  for (const snapPoint of snapPoints) {
    if (Math.abs(percentage - snapPoint) <= snapThreshold) {
      return snapPoint;
    }
  }
  
  return percentage;
}