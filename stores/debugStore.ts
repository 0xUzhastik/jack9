import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface DebugStore {
  // Debug wallet address
  debugWalletAddress: string;
  
  // Actions
  setDebugWalletAddress: (address: string) => void;
  clearDebugWalletAddress: () => void;
}

export const useDebugStore = create<DebugStore>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        debugWalletAddress: "",
        
        // Actions
        setDebugWalletAddress: (debugWalletAddress) => {
          set({ debugWalletAddress }, false, 'setDebugWalletAddress');
        },
        
        clearDebugWalletAddress: () => {
          set({ debugWalletAddress: "" }, false, 'clearDebugWalletAddress');
        },
      }),
      {
        name: 'debug-store',
        partialize: (state) => ({
          debugWalletAddress: state.debugWalletAddress,
        }),
      }
    ),
    { name: 'debug-store' }
  )
);