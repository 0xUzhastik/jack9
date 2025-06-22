'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { Connection } from '@solana/web3.js';
import { useWallets, usePrivy } from '@privy-io/react-auth';
import { useAudioStore } from '@/stores/audioStore';
import { useGameStore } from '@/stores/gameStore';
import { jackpotAddr } from '@/lib/constants';
import { triggerJackpotConfetti } from '@/lib/confetti';
import { generateSpinningAngle, generateChartData } from '@/lib/wheel-utils';
import type { Deposit } from '@/stores/gameStore';
import { SpinningWheel } from './SpinningWheel';
import { RoundStateDisplay } from './RoundStateDisplay';
import { useWebSocketGameEvents } from '@/hooks/useWebsocketGameEvents';
import type { RoundState } from '@/stores/gameStore';

// Add TypeScript declaration for window.solana
declare global {
  interface Window {
    solana?: {
      signAndSendTransaction: (transaction: any) => Promise<{ signature: string }>;
      isPhantom?: boolean;
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                               */
/* -------------------------------------------------------------------------- */
export default function JackpotDonutChart() {
  useWebSocketGameEvents();

  /* -------------------------------- context ------------------------------ */
  const connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC!);
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const connectedWallet = wallets[0];
  const walletAddress = user?.wallet?.address;
  
  // Zustand stores
  const { playSound } = useAudioStore();
  const {
    currentRoundDeposits: deposits,
    totalAmount,
    roundState,
    winner,
    winAmount,
    seconds,
    newRoundCountdown,
    isSpinning,
    finalSpinAngle,
    selectedWinner,
    shouldResetWheel,
    isAnimating,
    addDeposit,
    setDeposits,
    setRoundState,
    setWinner,
    setSeconds,
    setNewRoundCountdown,
    startSpinning,
    stopSpinning,
    setIsAnimating,
    setShouldResetWheel,
    resetRound
  } = useGameStore();

  // 🔥 CRITICAL: Block new deposits during animations
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /* ------------------------ data simulation ------------------------ */
  // useEffect(() => {
  //   // 🔥 CRITICAL: Stop simulation completely during animations or non-active states
  //   if (roundState !== 'active' || isAnimating) return;

  //   const interval = setInterval(() => {
  //     // 🔥 Double-check animation state before adding deposit
  //     if (isAnimating) return;

  //     const isUserDeposit = Math.random() < 0.2; // 20% chance it's the user
  //     const newDeposit = {
  //       id: Math.random().toString(36).substr(2, 9),
  //       user: isUserDeposit ? 'You' : `User${Math.floor(Math.random() * 9999)}`,
  //       token: Math.random() > 0.7 ? 'USDC' : 'SOL',
  //       amount: Math.floor(Math.random() * 500) + 50, // $50-$550
  //       timestamp: new Date(),
  //     };

  //     // 🔥 CRITICAL: Set animation flag BEFORE updating data
  //     setIsAnimating(true);

  //     // Update deposits through Zustand
  //     addDeposit(newDeposit);
      
  //     // 🎵 PLAY AUDIO BASED ON DEPOSIT TYPE
  //     if (isUserDeposit) {
  //       playSound('userDeposit');
  //     } else {
  //       playSound('deposit');
  //     }
      
  //     // Toast notification for new deposit
  //     toast({
  //       title: '🎰 New Deposit!',
  //       description: `${newDeposit.user} deposited $${newDeposit.amount} ${newDeposit.token}`,
  //       duration: 2000,
  //     });

  //     // 🔥 CRITICAL: Clear animation flag after animation completes
  //     if (animationTimeoutRef.current) {
  //       clearTimeout(animationTimeoutRef.current);
  //     }
  //     animationTimeoutRef.current = setTimeout(() => {
  //       setIsAnimating(false);
  //     }, 1500); // 1.5 seconds - longer than Recharts animation

  //   }, Math.random() * 4000 + 5000); // 5-9 seconds (even longer gap)

  //   return () => clearInterval(interval);
  // }, [roundState, isAnimating, addDeposit, playSound, setIsAnimating]);

  // // Cleanup animation timeout
  // useEffect(() => {
  //   return () => {
  //     if (animationTimeoutRef.current) {
  //       clearTimeout(animationTimeoutRef.current);
  //     }
  //   };
  // }, []);

  /* ------------------------ responsive ring sizing ------------------------ */
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartDims, setChartDims] = useState({ inner: 140, outer: 200 });
  useEffect(() => {
    const onResize = () => {
      if (!containerRef.current) return;
      const { clientWidth: w, clientHeight: h } = containerRef.current;
      const r = Math.min(w, h) * 0.48;
      setChartDims({ inner: r * 0.72, outer: r });
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ------------------------------ countdown ------------------------------ */
  // 🔥 FIXED: Use direct value updates instead of function updaters
  useEffect(() => {
    const interval = setInterval(() => {
      if (roundState === 'active') {
        // 🔥 FIXED: Get current value and set new value directly
        if (seconds <= 1) {
          // Round is ending
          setRoundState('ending');
          setSeconds(0);
        } else {
          setSeconds(seconds - 1);
        }
      } else if (roundState === 'ended') {
        // 🔥 FIXED: Get current value and set new value directly
        if (newRoundCountdown <= 1) {
          // Start new round
          startNewRound();
          setNewRoundCountdown(10);
        } else {
          setNewRoundCountdown(newRoundCountdown - 1);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [roundState, seconds, newRoundCountdown, setRoundState, setSeconds, setNewRoundCountdown]);

  // Move proceedToSpin outside useEffect
  function proceedToSpin(
    deposits: Deposit[],
    totalAmount: number,
    startSpinning: (angle: number, winner: Deposit) => void,
    stopSpinning: () => void,
    setWinner: (winner: string, amount?: number) => void,
    playSound: (sound: 'deposit' | 'userDeposit' | 'win') => void,
    triggerJackpotConfetti: () => void,
    toast: (args: { title: string; description: string; duration: number }) => void,
    setRoundState: (state: RoundState) => void
  ) {
    const randomWinner = deposits[Math.floor(Math.random() * deposits.length)];
    // Start spinning animation
    const dramaticSpinAngle = generateSpinningAngle(deposits, randomWinner, 200); // Use 200 so remainingCap=0
    startSpinning(dramaticSpinAngle, randomWinner);
    setTimeout(() => {
      stopSpinning();
      setWinner(randomWinner.user, totalAmount);
      playSound('win');
      triggerJackpotConfetti();
      toast({
        title: '🎉 JACKPOT WINNER! 🎉',
        description: `${randomWinner.user} won $${totalAmount.toFixed(0)}!`,
        duration: 5000,
      });
      setRoundState('ended');
    }, 7000);
  }

  // Handle round ending sequence
  useEffect(() => {
    if (roundState === 'ending') {
      setIsAnimating(true);

      if (deposits.length === 0) {
        setRoundState('ended');
        return;
      }

      const calculatedTotal = deposits.reduce((sum, d) => sum + d.amountUSD, 0);
      const remainingCap = Math.max(200 - calculatedTotal, 0);
      if (remainingCap > 0) {
        setTimeout(() => {
          setForceFullDonut(true);
          setTimeout(() => {
            setForceFullDonut(false);
            proceedToSpin(deposits, totalAmount, startSpinning, stopSpinning, setWinner, playSound, triggerJackpotConfetti, toast, setRoundState);
          }, 400);
        }, 100);
      } else {
        proceedToSpin(deposits, totalAmount, startSpinning, stopSpinning, setWinner, playSound, triggerJackpotConfetti, toast, setRoundState);
      }
    }
  }, [roundState, deposits, totalAmount, startSpinning, stopSpinning, setWinner, setRoundState, playSound]);

  const startNewRound = () => {
    setRoundState('starting');
    
    // IMPORTANT: Reset wheel position for new round
    setShouldResetWheel(true);
    
    // Reset all round data
    resetRound();
    
    toast({
      title: '🎰 NEW ROUND STARTED!',
      description: 'Place your deposits now!',
      duration: 3000,
    });
    
    // Start the new round after a brief moment and stop wheel reset
    setTimeout(() => {
      setRoundState('active');
      setShouldResetWheel(false); // Stop the reset after the wheel has moved
    }, 1000);
  };

  /* ------------------------------ chart data ----------------------------- */
  // Add forceFullDonut state and update chartData useMemo
  const [forceFullDonut, setForceFullDonut] = useState(false);
  const chartData = useMemo(() => {
    const calculatedTotal = deposits.reduce((sum, deposit) => sum + deposit.amountUSD, 0);
    return generateChartData(deposits, forceFullDonut ? 200 : calculatedTotal);
  }, [deposits, forceFullDonut]);

  /* --------------------------------- UI ---------------------------------- */
  return (
    <div className="flex flex-col items-center relative h-full mb-2">
      <div className="w-full flex flex-col items-center gap-0 h-full">
        {/* ------------------------------- RING ------------------------------ */}
        <div
          ref={containerRef}
          className="relative w-full h-full"
        >
          <SpinningWheel
            chartData={chartData}
            chartDims={chartDims}
            isSpinning={isSpinning}
            finalSpinAngle={finalSpinAngle}
            shouldReset={shouldResetWheel}
          />

          <RoundStateDisplay
            roundState={roundState}
            totalAmount={totalAmount}
            seconds={seconds}
            winner={winner}
            winAmount={winAmount}
            newRoundCountdown={newRoundCountdown}
            isSpinning={isSpinning}
          />
        </div>
      </div>
    </div>
  );
}