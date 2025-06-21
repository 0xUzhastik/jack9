import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface TokenRow {
  mint: string;
  amount: number;
  decimals: number;
  symbol: string;
  name: string;
  image: string;
  selected?: boolean;
  selectedAmount?: number;
}

interface TokenStore {
  // Selected tokens for deposit
  selectedTokens: TokenRow[];
  
  // Token portfolio state (for desktop view)
  sliderPercentages: number[];
  
  // UI state
  expandedToken: string | null;
  delayedExpandToken: string | null;
  
  // Actions
  addToken: (token: TokenRow) => void;
  removeToken: (mint: string) => void;
  updateTokenAmount: (mint: string, amount: number) => void;
  clearSelectedTokens: () => void;
  
  // Portfolio actions
  setSliderPercentages: (percentages: number[]) => void;
  updateSliderPercentage: (index: number, percentage: number) => void;
  
  // UI actions
  setExpandedToken: (mint: string | null) => void;
  setDelayedExpandToken: (mint: string | null) => void;
  clearDelayedExpand: () => void;
}

export const useTokenStore = create<TokenStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      selectedTokens: [],
      sliderPercentages: [],
      expandedToken: null,
      delayedExpandToken: null,
      
      // Token selection actions
      addToken: (token) => {
        set((state) => {
          const exists = state.selectedTokens.some(t => t.mint === token.mint);
          const updatedToken = { ...token, selected: true };
          return {
            selectedTokens: exists
              ? state.selectedTokens.map(t => t.mint === token.mint ? updatedToken : t)
              : [...state.selectedTokens, updatedToken]
          };
        }, false, 'addToken');
      },
      
      removeToken: (mint) => {
        set((state) => ({
          selectedTokens: state.selectedTokens.filter(token => token.mint !== mint),
          expandedToken: state.expandedToken === mint ? null : state.expandedToken
        }), false, 'removeToken');
      },
      
      updateTokenAmount: (mint, amount) => {
        set((state) => ({
          selectedTokens: state.selectedTokens.map(token =>
            token.mint === mint ? { ...token, selectedAmount: amount } : token
          )
        }), false, 'updateTokenAmount');
      },
      
      clearSelectedTokens: () => {
        set({ 
          selectedTokens: [],
          expandedToken: null,
          delayedExpandToken: null 
        }, false, 'clearSelectedTokens');
      },
      
      // Portfolio actions
      setSliderPercentages: (percentages) => {
        set({ sliderPercentages: percentages }, false, 'setSliderPercentages');
      },
      
      updateSliderPercentage: (index, percentage) => {
        set((state) => {
          const newPercentages = [...state.sliderPercentages];
          newPercentages[index] = percentage;
          return { sliderPercentages: newPercentages };
        }, false, 'updateSliderPercentage');
      },
      
      // UI actions
      setExpandedToken: (mint) => {
        set({ expandedToken: mint }, false, 'setExpandedToken');
      },
      
      setDelayedExpandToken: (mint) => {
        set({ delayedExpandToken: mint }, false, 'setDelayedExpandToken');
      },
      
      clearDelayedExpand: () => {
        set({ delayedExpandToken: null }, false, 'clearDelayedExpand');
      },
    }),
    { name: 'token-store' }
  )
);