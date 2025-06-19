// Event handlers and state management for token selector components

import { TokenRow } from './tokenUtils';
import { calculateTokenAmountFromUSD } from './priceCalculations';

// 🔥 UNIFIED: Handle token amount input changes
export function handleTokenAmountChange(
  token: TokenRow,
  inputValue: string,
  setTempAmount: (amount: number) => void,
  setLastModified: (type: 'token' | 'usd') => void
): void {
  if (inputValue === '' || inputValue === '.') {
    setTempAmount(0);
    setLastModified('token');
    return;
  }

  if (inputValue.endsWith('.') && !isNaN(parseFloat(inputValue.slice(0, -1)))) {
    const numValue = parseFloat(inputValue.slice(0, -1));
    const clampedValue = Math.min(Math.max(0, numValue), token.amount);
    setTempAmount(clampedValue);
    setLastModified('token');
    return;
  }

  const numValue = parseFloat(inputValue);
  if (isNaN(numValue) && inputValue !== '') return;

  const finalValue = isNaN(numValue) ? 0 : numValue;
  const clampedValue = Math.min(Math.max(0, finalValue), token.amount);
  setTempAmount(clampedValue);
  setLastModified('token');
}

// 🔥 UNIFIED: Handle USD amount input changes
export function handleUSDAmountChange(
  token: TokenRow,
  inputValue: string,
  maxUSDValue: number,
  setTempUSDAmount: (amount: number) => void,
  setLastModified: (type: 'token' | 'usd') => void
): void {
  if (inputValue === '' || inputValue === '.') {
    setTempUSDAmount(0);
    setLastModified('usd');
    return;
  }

  if (inputValue.endsWith('.') && !isNaN(parseFloat(inputValue.slice(0, -1)))) {
    const usdValue = parseFloat(inputValue.slice(0, -1));
    const clampedValue = Math.min(Math.max(0, usdValue), maxUSDValue);
    setTempUSDAmount(Math.floor(clampedValue * 100) / 100);
    setLastModified('usd');
    return;
  }

  const usdValue = parseFloat(inputValue);
  if (isNaN(usdValue) && inputValue !== '') return;

  const finalUsdValue = isNaN(usdValue) ? 0 : usdValue;
  const clampedValue = Math.min(Math.max(0, finalUsdValue), maxUSDValue);
  setTempUSDAmount(Math.floor(clampedValue * 100) / 100);
  setLastModified('usd');
}

// 🔥 UNIFIED: Handle slider changes with snapping
export function handleSliderChange(
  token: TokenRow,
  value: number,
  setTempAmount: (amount: number) => void,
  setLastModified: (type: 'token' | 'usd') => void
): void {
  const percentage = value / token.amount;
  const snapThreshold = 0.01;
  const snapPoints = [0, 0.25, 0.5, 0.75, 1.0];
  
  let snappedPercentage = percentage;
  for (const snapPoint of snapPoints) {
    if (Math.abs(percentage - snapPoint) <= snapThreshold) {
      snappedPercentage = snapPoint;
      break;
    }
  }
  
  const snappedValue = snappedPercentage * token.amount;
  setTempAmount(snappedValue);
  setLastModified('token');
}

// 🔥 UNIFIED: Update token amounts based on USD/SOL price changes
export function updateTokenAmountFromUSD(
  token: TokenRow,
  tempUSDAmount: number,
  tokenPriceInSol: number | null,
  solPrice: number | null,
  setTempAmount: (amount: number) => void
): void {
  if (!solPrice || !tokenPriceInSol || tempUSDAmount <= 0) return;
  
  let tokenFromUSD = 0;
  if (token.mint === 'So11111111111111111111111111111111111111112') {
    tokenFromUSD = tempUSDAmount / solPrice;
  } else {
    const valueInSol = tempUSDAmount / solPrice;
    tokenFromUSD = valueInSol / tokenPriceInSol;
  }
  
  setTempAmount(Math.min(tokenFromUSD, token.amount));
}

// 🔥 UNIFIED: Update USD amount based on token amount changes
export function updateUSDAmountFromToken(
  token: TokenRow,
  tempAmount: number,
  tokenPriceInSol: number | null,
  solPrice: number | null,
  setTempUSDAmount: (amount: number) => void
): void {
  if (!solPrice || !tokenPriceInSol) return;
  
  let usdFromToken = 0;
  if (token.mint === 'So11111111111111111111111111111111111111112') {
    usdFromToken = tempAmount * solPrice;
  } else {
    const valueInSol = tempAmount * tokenPriceInSol;
    usdFromToken = valueInSol * solPrice;
  }
  
  if (usdFromToken !== null) {
    setTempUSDAmount(Math.floor(usdFromToken * 100) / 100);
  }
}

// 🔥 UNIFIED: Quick percentage selection handler
export function handleQuickPercentageSelect(
  token: TokenRow,
  percentage: number,
  setTempAmount: (amount: number) => void,
  setLastModified: (type: 'token' | 'usd') => void
): void {
  const amount = (token.amount * percentage) / 100;
  setTempAmount(amount);
  setLastModified('token');
}
