import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIStore {
  // Mobile state
  isMobile: boolean;
  activeTab: 'deposits' | 'chat';
  
  // Layout state
  isExpanded: boolean; // For mobile deposit bar
  showVolumeSlider: boolean;
  
  // Focus states
  focusedInputs: Record<string, boolean>;
  
  // Actions
  setIsMobile: (isMobile: boolean) => void;
  setActiveTab: (tab: 'deposits' | 'chat') => void;
  setIsExpanded: (expanded: boolean) => void;
  setShowVolumeSlider: (show: boolean) => void;
  setInputFocus: (inputKey: string, focused: boolean) => void;
  clearAllFocus: () => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      // Initial state
      isMobile: false,
      activeTab: 'deposits',
      isExpanded: false,
      showVolumeSlider: false,
      focusedInputs: {},
      
      // Actions
      setIsMobile: (isMobile) => {
        set({ isMobile }, false, 'setIsMobile');
      },
      
      setActiveTab: (activeTab) => {
        set({ activeTab }, false, 'setActiveTab');
      },
      
      setIsExpanded: (isExpanded) => {
        set({ isExpanded }, false, 'setIsExpanded');
      },
      
      setShowVolumeSlider: (showVolumeSlider) => {
        set({ showVolumeSlider }, false, 'setShowVolumeSlider');
      },
      
      setInputFocus: (inputKey, focused) => {
        set((state) => ({
          focusedInputs: {
            ...state.focusedInputs,
            [inputKey]: focused
          }
        }), false, 'setInputFocus');
      },
      
      clearAllFocus: () => {
        set({ focusedInputs: {} }, false, 'clearAllFocus');
      },
    }),
    { name: 'ui-store' }
  )
);