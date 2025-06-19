import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Deposit {
  id: string;
  user: string;
  token: string;
  amount: number;
  amountUSD: number;
  timestamp: Date;
}

type RoundState = 'active' | 'ending' | 'ended' | 'starting';

interface GameStore {
  // Round state
  currentRoundDeposits: Deposit[];
  roundState: RoundState;
  winner: string | null;
  winAmount: number;
  seconds: number;
  newRoundCountdown: number;
  
  // Spinning wheel state
  isSpinning: boolean;
  finalSpinAngle: number;
  selectedWinner: Deposit | null;
  shouldResetWheel: boolean;
  
  // Animation state
  isAnimating: boolean;
  
  // Computed values
  totalAmount: number;
  
  // Actions
  addDeposit: (deposit: Deposit) => void;
  setDeposits: (deposits: Deposit[]) => void;
  updateDeposits: (updater: (deposits: Deposit[]) => Deposit[]) => void;
  
  // Round management
  setRoundState: (state: RoundState) => void;
  setWinner: (winner: string | null, amount?: number) => void;
  setSeconds: (seconds: number) => void;
  setNewRoundCountdown: (countdown: number) => void;
  
  // Spinning wheel
  startSpinning: (angle: number, winner: Deposit) => void;
  stopSpinning: () => void;
  setIsAnimating: (animating: boolean) => void;
  setShouldResetWheel: (reset: boolean) => void;
  
  // Reset
  resetRound: () => void;
}

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentRoundDeposits: [],
      roundState: 'active',
      winner: null,
      winAmount: 0,
      seconds: 54,
      newRoundCountdown: 10,
      isSpinning: false,
      finalSpinAngle: 0,
      selectedWinner: null,
      shouldResetWheel: false,
      isAnimating: false,
      totalAmount: 0,
      
      // Deposit actions
      addDeposit: (deposit) => {
        set((state) => {
          const newDeposits = [...state.currentRoundDeposits, deposit];
          const newTotal = newDeposits.reduce((sum, d) => sum + d.amountUSD, 0);
          return {
            currentRoundDeposits: newDeposits,
            totalAmount: newTotal
          };
        }, false, 'addDeposit');
      },
      
      setDeposits: (deposits) => {
        console.log('[gameStore] setDeposits:', {deposits});
        const newTotal = deposits.reduce((sum, d) => sum + d.amountUSD, 0);
        console.log('[gameStore] newTotal:', newTotal);
        set({
          currentRoundDeposits: deposits,
          totalAmount: newTotal
        }, false, 'setDeposits');
      },
      
      updateDeposits: (updater) => {
        set((state) => {
          const newDeposits = updater(state.currentRoundDeposits);
          const newTotal = newDeposits.reduce((sum, d) => sum + d.amountUSD, 0);
          return {
            currentRoundDeposits: newDeposits,
            totalAmount: newTotal
          };
        }, false, 'updateDeposits');
      },
      
      // Round management
      setRoundState: (roundState) => {
        set({ roundState }, false, 'setRoundState');
      },
      
      setWinner: (winner, amount = 0) => {
        set({ winner, winAmount: amount }, false, 'setWinner');
      },
      
      setSeconds: (seconds) => {
        set({ seconds }, false, 'setSeconds');
      },
      
      setNewRoundCountdown: (newRoundCountdown) => {
        set({ newRoundCountdown }, false, 'setNewRoundCountdown');
      },
      
      // Spinning wheel
      startSpinning: (finalSpinAngle, selectedWinner) => {
        set({
          isSpinning: true,
          finalSpinAngle,
          selectedWinner,
          isAnimating: true
        }, false, 'startSpinning');
      },
      
      stopSpinning: () => {
        set({ isSpinning: false }, false, 'stopSpinning');
      },
      
      setIsAnimating: (isAnimating) => {
        set({ isAnimating }, false, 'setIsAnimating');
      },
      
      setShouldResetWheel: (shouldResetWheel) => {
        set({ shouldResetWheel }, false, 'setShouldResetWheel');
      },
      
      // Reset
      resetRound: () => {
        set({
          currentRoundDeposits: [],
          roundState: 'active',
          winner: null,
          winAmount: 0,
          seconds: 54,
          newRoundCountdown: 10,
          isSpinning: false,
          finalSpinAngle: 0,
          selectedWinner: null,
          shouldResetWheel: false,
          isAnimating: false,
          totalAmount: 0
        }, false, 'resetRound');
      },
    }),
    { name: 'game-store' }
  )
);