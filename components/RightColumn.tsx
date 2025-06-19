"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ChatSection } from "./ChatSection";
import { UnifiedAudioControl } from "./UnifiedAudioControl";
import { DebugModal } from "./DebugModal";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";
import { usePrivy } from '@privy-io/react-auth';
import { useState } from "react";

export function RightColumn() {
  const { logout, authenticated } = usePrivy();
  const [showDebugModal, setShowDebugModal] = useState(false);

  return (
    <div className="h-full min-h-0 flex flex-col gap-3">
      {/* Largest Win - Fixed height - NO CountUp */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-shrink-0"
      >
        <Card className="casino-box casino-box-gold overflow-hidden h-24 flex flex-col">
          <CardContent className="bg-gradient-to-b from-[#4A0E4E] to-[#2D0A30] p-2 flex-1 flex flex-col justify-center items-center">
            <p className="text-lg sm:text-xl md:text-2xl uppercase font-bold text-center tracking-wider casino-text-yellow mb-2"
              style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
              Largest Win
            </p>
            <div className="text-2xl sm:text-3xl md:text-4xl font-black casino-text-gold flex items-center"
                 style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
              $28,400
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Chat - Takes most of the remaining space */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 min-h-0"
      >
        <ChatSection isMobile={false} />
      </motion.div>

      {/* Control Buttons Row - Fixed height at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex-shrink-0"
      >
        <div className="flex items-center justify-center gap-3 p-3 casino-box casino-box-gold rounded-xl">
          {/* Unified Audio Control */}
          <UnifiedAudioControl />

          {/* Disconnect Button */}
          {authenticated && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={logout}
                className="casino-box casino-box-red p-3 rounded-full border-2 border-[#FF1493] hover:border-[#FFFF00] transition-all duration-200"
                style={{
                  background: 'linear-gradient(145deg, #4A0E4E, #2D0A30)',
                  boxShadow: `
                    0 0 15px rgba(255, 20, 147, 0.6),
                    inset 0 1px 0 rgba(255, 20, 147, 0.3),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.3)
                  `
                }}
                title="Disconnect Wallet"
              >
                <LogOut className="h-4 w-4 casino-text-pink" />
              </Button>
            </motion.div>
          )}

          {/* Settings/Debug Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => setShowDebugModal(true)}
              className="casino-box casino-box-gold p-3 rounded-full border-2 border-[#FFD700] hover:border-[#FFFF00] transition-all duration-200"
              style={{
                background: 'linear-gradient(145deg, #4A0E4E, #2D0A30)',
                boxShadow: `
                  0 0 15px rgba(255, 215, 0, 0.6),
                  inset 0 1px 0 rgba(255, 215, 0, 0.3),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.3)
                `
              }}
              title="Debug Tools & Settings"
            >
              <Settings className="h-4 w-4 casino-text-gold" />
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Debug Modal */}
      <DebugModal 
        isOpen={showDebugModal} 
        onClose={() => setShowDebugModal(false)} 
      />
    </div>
  );
}