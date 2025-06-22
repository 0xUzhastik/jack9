import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import CountUp from 'react-countup';

type RoundState = 'active' | 'ending' | 'ended' | 'starting';

interface RoundStateDisplayProps {
  roundState: RoundState;
  totalAmount: number;
  seconds: number;
  winner: string | null;
  winAmount: number;
  newRoundCountdown: number;
  isSpinning: boolean;
}

// 🎰 CASINO EASING FUNCTIONS
const casinoEasing = {
  // Slot machine reel effect - accelerates then decelerates
  slotMachine: (t: number, b: number, c: number, d: number) => {
    return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
  }
};

export function RoundStateDisplay({
  roundState,
  totalAmount,
  seconds,
  winner,
  winAmount,
  newRoundCountdown,
  isSpinning
}: RoundStateDisplayProps) {
  // Track previous totalAmount for smooth CountUp transitions
  const [prevTotalAmount, setPrevTotalAmount] = useState(totalAmount);

  // Update previous amount when totalAmount changes
  useEffect(() => {
    if (totalAmount !== prevTotalAmount) {
      setPrevTotalAmount(prevTotalAmount); // Keep the previous value for animation start
    }
  }, [totalAmount, prevTotalAmount]);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-5">
      <AnimatePresence mode="wait">
        {roundState === 'active' && (
          <motion.div
            key="active"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="text-center"
          >
            <motion.div
              key={totalAmount} // Re-trigger animation when amount changes
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="block text-6xl sm:text-7xl md:text-8xl font-extrabold"
              style={{
                fontFamily: 'Visby Round CF, SF Pro Display, sans-serif',
                color: '#FFD700',
                textShadow:
                  '3px 3px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 0 0 15px #FFD700, 0 0 25px #FFFF00',
              }}
            >
              $<CountUp
                start={prevTotalAmount}
                end={totalAmount}
                duration={2} // Slightly longer for more dramatic effect
                separator=","
                preserveValue={true}
                useEasing={true}
                easingFn={casinoEasing.slotMachine} // 🎰 Slot machine reel effect
                onEnd={() => setPrevTotalAmount(totalAmount)} // Update previous value after animation
              />
            </motion.div>
            <span
              className="text-sm uppercase font-bold tracking-wider mt-1"
              style={{
                fontFamily: 'Visby Round CF, SF Pro Display, sans-serif',
                color: '#FFD700',
                textShadow: '1px 1px 0 #000000, 0 0 5px #FFD700',
              }}
            >
              Round ends in
            </span>
            <span
              className="text-3xl sm:text-4xl font-extrabold ml-2"
              style={{
                fontFamily: 'Visby Round CF, SF Pro Display, sans-serif',
                color: '#FF1493',
                textShadow:
                  '2px 2px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 0 0 10px #FF1493, 0 0 20px #FF69B4',
              }}
            >
              {formatTime(seconds)}
            </span>
          </motion.div>
        )}

        {roundState === 'ending' && (
          <motion.div
            key="ending"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            className="text-center"
          >
            {/* Simplified spinning text - just "Selecting Winner" */}
            <motion.div
              animate={{
                opacity: [0.6, 1, 0.6]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity
              }}
              className="text-lg font-bold"
              style={{
                fontFamily: 'Visby Round CF, SF Pro Display, sans-serif',
                color: '#FFFF00',
                textShadow: '1px 1px 0 #000000, 0 0 8px #FFFF00',
              }}
            >
              Selecting Winner
            </motion.div>
          </motion.div>
        )}

        {roundState === 'ended' && winner && (
          <motion.div
            key="ended"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="text-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <div
                className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2"
                style={{
                  fontFamily: 'Visby Round CF, SF Pro Display, sans-serif',
                  color: '#FFD700',
                  textShadow:
                    '2px 2px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 0 0 15px #FFD700',
                }}
              >
                🎉 {winner} WINS! 🎉
              </div>
              <div
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2"
                style={{
                  fontFamily: 'Visby Round CF, SF Pro Display, sans-serif',
                  color: '#00FFFF',
                  textShadow:
                    '2px 2px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 0 0 15px #00FFFF',
                }}
              >
                ${winAmount.toFixed(0)}
              </div>
              <div
                className="text-lg font-bold"
                style={{
                  fontFamily: 'Visby Round CF, SF Pro Display, sans-serif',
                  color: '#FF1493',
                  textShadow: '1px 1px 0 #000000, 0 0 5px #FF1493',
                }}
              >
                New round in {newRoundCountdown}s
              </div>
            </motion.div>
          </motion.div>
        )}

        {roundState === 'starting' && (
          <motion.div
            key="starting"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="text-center"
          >
            <motion.div
              animate={{ 
                scale: [0.9, 1.1, 0.9],
              }}
              transition={{ 
                duration: 1, 
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold"
              style={{
                fontFamily: 'Visby Round CF, SF Pro Display, sans-serif',
                color: '#00FFFF',
                textShadow:
                  '3px 3px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 0 0 20px #00FFFF, 0 0 40px #00FFFF',
              }}
            >
              NEW ROUND!
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}