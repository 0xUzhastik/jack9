"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { CurrentDeposits } from "./CurrentDeposits";
import { useGameStore } from "@/stores/gameStore";
import CountUp from 'react-countup';

interface LeftColumnProps {
  isMobile?: boolean;
}

// 🎰 CASINO EASING FUNCTIONS
const casinoEasing = {
  // Coin drop effect - starts slow, accelerates like coins falling
  coinDrop: (t: number, b: number, c: number, d: number) => {
    return c * Math.pow(t / d, 2.2) + b;
  },
  
  // Slot machine mechanical feel
  mechanical: (t: number, b: number, c: number, d: number) => {
    return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
  }
};

export function LeftColumn({ isMobile = false }: LeftColumnProps) {
  const [totalDeposits, setTotalDeposits] = useState(7961280);
  const [prevTotalDeposits, setPrevTotalDeposits] = useState(7961280);
  const { currentRoundDeposits } = useGameStore();

  useEffect(() => {
    const interval = setInterval(() => {
      setTotalDeposits(prev => {
        setPrevTotalDeposits(prev); // Store previous value for smooth transition
        return prev + Math.floor(Math.random() * (1000 - 100) + 100);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Desktop layout - show all components
  return (
    <div className="h-full flex flex-col gap-3">
      {/* Total Deposits */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="casino-box casino-box-gold overflow-hidden h-24 flex flex-col">
            <CardContent className="bg-gradient-to-b from-[#4A0E4E] to-[#2D0A30] p-2 flex-1 flex flex-col justify-center items-center">
              <p className="text-lg sm:text-xl md:text-2xl uppercase font-bold text-center tracking-wider casino-text-yellow mb-2"
                 style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                Total Deposits
              </p>
              <div className="text-2xl sm:text-3xl md:text-4xl font-black casino-text-gold flex items-center"
                   style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                $<CountUp
                  start={prevTotalDeposits}
                  end={totalDeposits}
                  duration={2.8} // Slightly longer for more dramatic effect
                  separator=","
                  preserveValue={true}
                  useEasing={true}
                  easingFn={casinoEasing.coinDrop} // 🎰 Coin drop effect
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Current Round - Takes up most of the available space */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 min-h-0"
      >
        <CurrentDeposits isMobile={isMobile} />
      </motion.div>
    </div>
  );
}