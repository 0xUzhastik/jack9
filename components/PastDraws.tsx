"use client";

import { PastDraw } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, Trophy, Award } from "lucide-react";

interface PastDrawsProps {
  draws: PastDraw[];
}

export default function PastDraws({ draws }: PastDrawsProps) {
  return (
    <Card className="casino-box casino-box-gold overflow-hidden p-0 h-full flex flex-col relative">
      {/* Corner stars */}
      <div className="absolute top-2 left-2 z-10">
        <Star className="h-4 w-4 casino-star" fill="currentColor" />
      </div>
      <div className="absolute top-2 right-2 z-10">
        <Star className="h-4 w-4 casino-star" fill="currentColor" />
      </div>
      
      <CardContent className="p-4 h-full flex flex-col min-w-0">
        {/* Title */}
        <div className="mb-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="h-4 w-4 casino-text-gold" />
            <h2 className="text-lg font-black uppercase tracking-wide casino-text-gold truncate" 
                style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
              Past Winners
            </h2>
            <Award className="h-4 w-4 casino-text-gold" />
          </div>
        </div>
        
        {/* Past Draws List */}
        <div className="flex-1 overflow-hidden min-w-0">
          <ScrollArea className="h-full">
            <div className="space-y-1">
              {draws.map((draw, index) => (
                <motion.div
                  key={draw.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="py-1 px-2 rounded-md overflow-hidden relative"
                  style={{
                    background: index % 2 === 0
                      ? 'linear-gradient(to right, #4A0E4E, #2D0A30)'
                      : 'linear-gradient(to right, #3A0A3E, #1D051A)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 215, 0, 0.2)'
                  }}
                >
                  {/* Winner badge - smaller */}
                  <div className="absolute top-0.5 right-0.5">
                    <motion.div
                      animate={{
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: index * 0.5
                      }}
                    >
                      <Trophy className="h-2 w-2 casino-text-gold" fill="currentColor" />
                    </motion.div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <motion.div
                          className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFFF00]"
                          animate={{
                            scale: [1, 1.2, 1],
                            boxShadow: [
                              '0 0 0px rgba(255, 215, 0, 0)',
                              '0 0 4px rgba(255, 215, 0, 0.8)',
                              '0 0 0px rgba(255, 215, 0, 0)'
                            ]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: index * 0.3
                          }}
                        />
                        <h3 className="text-xs font-black casino-text-gold truncate"
                          style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                          {draw.name}
                        </h3>
                      </div>
                      <motion.a
                        href="#"
                        className="casino-text-yellow text-xs hover:underline hover:text-[#FFFF00] transition-colors font-bold"
                        onClick={(e) => e.preventDefault()}
                        style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif", fontSize: '10px' }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        🔍 Verify
                      </motion.a>
                    </div>
                    
                    <div className="text-right ml-2">
                      <motion.span 
                        className="text-xs font-black casino-text-gold"
                        style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}
                        initial={{ scale: 1 }}
                        whileHover={{ 
                          scale: 1.05,
                          color: '#FFFF00'
                        }}
                      >
                        ${draw.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </motion.span>
                      <div className="text-xs casino-text-pink font-bold" style={{ fontSize: '9px' }}>
                        WIN
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}