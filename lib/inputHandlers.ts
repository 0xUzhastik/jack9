// Shared input handling utilities

import { TokenRow, parseInputValue, clampValue, tokenCountToPercentage } from './tokenUtils';
import { calculateTokenAmountFromUSD } from './priceCalculations';

// 🔥 UNIFIED: Handle token amount input changes
export function handleTokenAmountInput(
  tokenIndex: number,
  inputValue: string,
  token: TokenRow,
  onPercentageChange: (index: number, percentage: number) => void
): void {
  const numValue = parseInputValue(inputValue);
  const clampedValue = clampValue(numValue, 0, token.amount);
  const percentage = tokenCountToPercentage(clampedValue, token.amount);
  onPercentageChange(tokenIndex, percentage);
}

// 🔥 UNIFIED: Handle USD amount input changes
export function handleUSDAmountInput(
  tokenIndex: number,
  inputValue: string,
  token: TokenRow,
  tokenPricesInSol: Record<string, number | null>,
  solPrice: number | null,
  onPercentageChange: (index: number, percentage: number) => void
): void {
  if (!tokenPricesInSol || !solPrice) return;

  const usdValue = parseInputValue(inputValue);
  const tokenCount = calculateTokenAmountFromUSD(token, usdValue, tokenPricesInSol[token.mint], solPrice);
  
  if (tokenCount !== null) {
    const clampedTokenCount = clampValue(tokenCount, 0, token.amount);
    const percentage = tokenCountToPercentage(clampedTokenCount, token.amount);
    onPercentageChange(tokenIndex, percentage);
  }
}

// 🔥 UNIFIED: Handle percentage button clicks
export function handlePercentageButtonClick(
  tokenIndex: number,
  percentage: number,
  onPercentageChange: (index: number, percentage: number) => void
): void {
  onPercentageChange(tokenIndex, percentage);
}

// 🔥 UNIFIED: Handle slider changes with snapping
export function handleSliderChange(
  tokenIndex: number,
  percentage: number,
  onPercentageChange: (index: number, percentage: number) => void,
  enableSnapping: boolean = true
): void {
  let finalPercentage = percentage;
  
  if (enableSnapping) {
    // Define snap thresholds (within 2% of target) - only for 0 and 100
    const snapThreshold = 2;
    const snapPoints = [0, 100];
    
    // Find the closest snap point
    for (const snapPoint of snapPoints) {
      if (Math.abs(percentage - snapPoint) <= snapThreshold) {
        finalPercentage = snapPoint;
        break;
      }
    }
  }
  
  onPercentageChange(tokenIndex, finalPercentage);
}

// 🔥 UNIFIED: Focus/blur handling for inputs
export interface FocusHandlers {
  handleInputFocus: (inputKey: string) => void;
  handleInputBlur: (inputKey: string) => void;
  isInputFocused: (inputKey: string) => boolean;
}

export function createFocusHandlers(
  setInputFocus: (inputKey: string, focused: boolean) => void,
  focusedInputs: Record<string, boolean>
): FocusHandlers {
  return {
    handleInputFocus: (inputKey: string) => {
      setInputFocus(inputKey, true);
    },
    
    handleInputBlur: (inputKey: string) => {
      setInputFocus(inputKey, false);
    },
    
    isInputFocused: (inputKey: string) => {
      return !!focusedInputs[inputKey];
    }
  };
}

// 🔥 UNIFIED: Get raw values for inputs (always numeric)
export function getRawTokenCount(
  tokenIndex: number,
  sliderPercentages: number[],
  filteredTokens: TokenRow[]
): number {
  const percentage = sliderPercentages[tokenIndex] ?? 0;
  const token = filteredTokens[tokenIndex];
  if (!token) return 0;
  return (token.amount * percentage) / 100;
}

export function getRawUSDValue(
  tokenIndex: number,
  getDisplayValues: (index: number) => { selectedValue: number; remainingValue: number }
): number {
  const { selectedValue } = getDisplayValues(tokenIndex);
  return selectedValue;
}