export function getTokenDecimals(mint: string): number {
    const map: Record<string, number> = {
      So11111111111111111111111111111111111111112: 9,
      EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 6,
      Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: 6,
    };
    return map[mint] ?? 6;
  }
  
  export function formatAmount(amount: number, decimals: number) {
    if (amount === 0) return "0";
    if (amount < 0.000001) return amount.toExponential(Math.min(decimals, 3));
    return amount.toLocaleString(undefined, {
      maximumFractionDigits: Math.min(decimals, 6),
      minimumFractionDigits: 0,
    });
  }
  
  export function formatAmountAbbreviated(amount: number, decimals: number) {
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