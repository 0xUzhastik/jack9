import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type TokenSelectorMode = 'chip' | 'desktop';

interface SettingsStore {
  // Token selector mode
  tokenSelectorMode: TokenSelectorMode;
  
  // Pro Mode features
  isProModeEnabled: boolean;
  
  // UI preferences
  showAdvancedControls: boolean;
  autoSelectOptimalAmounts: boolean;
  
  // Actions
  setTokenSelectorMode: (mode: TokenSelectorMode) => void;
  setProModeEnabled: (enabled: boolean) => void;
  setShowAdvancedControls: (show: boolean) => void;
  setAutoSelectOptimalAmounts: (auto: boolean) => void;
  toggleProMode: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        tokenSelectorMode: 'chip',
        isProModeEnabled: false,
        showAdvancedControls: false,
        autoSelectOptimalAmounts: false,
        
        // Actions
        setTokenSelectorMode: (tokenSelectorMode) => {
          set({ tokenSelectorMode }, false, 'setTokenSelectorMode');
        },
        
        setProModeEnabled: (isProModeEnabled) => {
          set({ 
            isProModeEnabled,
            // When enabling Pro Mode, automatically switch to desktop selector
            tokenSelectorMode: isProModeEnabled ? 'desktop' : 'chip'
          }, false, 'setProModeEnabled');
        },
        
        setShowAdvancedControls: (showAdvancedControls) => {
          set({ showAdvancedControls }, false, 'setShowAdvancedControls');
        },
        
        setAutoSelectOptimalAmounts: (autoSelectOptimalAmounts) => {
          set({ autoSelectOptimalAmounts }, false, 'setAutoSelectOptimalAmounts');
        },
        
        toggleProMode: () => {
          const { isProModeEnabled } = get();
          const newProMode = !isProModeEnabled;
          set({ 
            isProModeEnabled: newProMode,
            tokenSelectorMode: newProMode ? 'desktop' : 'chip'
          }, false, 'toggleProMode');
        },
      }),
      {
        name: 'settings-store',
        partialize: (state) => ({
          tokenSelectorMode: state.tokenSelectorMode,
          isProModeEnabled: state.isProModeEnabled,
          showAdvancedControls: state.showAdvancedControls,
          autoSelectOptimalAmounts: state.autoSelectOptimalAmounts,
        }),
      }
    ),
    { name: 'settings-store' }
  )
);