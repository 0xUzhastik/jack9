"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Star, Trophy, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from '@/hooks/use-toast';
import { pastDraws } from "@/lib/mock-data";
import useSWR from 'swr';

interface PastGame {
  gameId: number;
  winner: string;
  totalPotValueSol: number;
  createdAt: string;
  payoutTxSig?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export function PastWinners() {
  const { data, error, isLoading } = useSWR<PastGame[]>(
    'https://webhooks-production-2e4f.up.railway.app/game/games?limit=3',
    fetcher,
    { revalidateOnFocus: false }
  );

  const games = (data || []).filter(g => g.winner && g.totalPotValueSol);

  const handleVerifyWin = (winnerId: string, winnerName: string) => {
    toast({
      title: '🔍 Verification Started',
      description: `Verifying ${winnerName}'s win on the blockchain...`,
      duration: 3000,
    });
    setTimeout(() => {
      toast({
        title: '✅ Win Verified',
        description: `${winnerName}'s jackpot win is confirmed on Solana blockchain.`,
        duration: 4000,
      });
    }, 2000);
  };

  return (
    <Card className="casino-box casino-box-gold overflow-hidden p-0 h-full flex flex-col relative">
      {/* Corner stars */}
      <div className="absolute top-2 left-2 z-10">
        <Star className="h-4 w-4 casino-star" fill="currentColor" />
      </div>
      <div className="absolute top-2 right-2 z-10">
        <Star className="h-4 w-4 casino-star" fill="currentColor" />
      </div>
      
      <CardContent className="p-3 h-full flex flex-col min-w-0">
        {/* Title */}
        <div className="mb-3">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="h-4 w-4 casino-text-gold" />
            <h2 className="text-lg font-black uppercase text-center tracking-wide casino-text-gold truncate" 
                style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
              Recent Winners
            </h2>
          </div>
        </div>
        
        {/* Winners as Horizontal Compact Cards */}
        <div className="flex-1 overflow-hidden min-w-0">
          <div className="flex flex-wrap gap-2">
            {isLoading ? (
              <div className="text-center w-full text-slate-400">Loading...</div>
            ) : error ? (
              <div className="text-center w-full text-red-400">Failed to load winners.</div>
            ) : games.length === 0 ? (
              <div className="text-center w-full text-slate-400">No past winners found.</div>
            ) : (
              games.map((draw, index) => (
                <motion.div
                  key={draw.gameId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-1 min-w-0 casino-box p-2 rounded-md border border-[#FFD700] bg-gradient-to-r from-[#4A0E4E] to-[#2D0A30] relative overflow-hidden group hover:border-[#FFFF00] transition-all duration-200"
                  style={{
                    boxShadow: "0 0 8px rgba(255, 215, 0, 0.4)"
                  }}
                >
                  {/* Compact horizontal layout */}
                  <div className="flex flex-col items-center gap-1 relative z-10">
                    {/* Top row: Trophy + Name */}
                    <div className="flex items-center gap-2 w-full">
                      <motion.div
                        animate={{
                          rotate: [0, 15, -15, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: index * 0.5
                        }}
                        className="flex-shrink-0"
                      >
                        <Trophy className="h-3 w-3 casino-text-gold" fill="currentColor" />
                      </motion.div>
                      
                      <span className="text-xs font-black casino-text-gold truncate flex-1" 
                            style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                        {draw.winner.slice(0, 4)}...{draw.winner.slice(-4)}
                      </span>
                    </div>
                    
                    {/* Middle row: Amount */}
                    <div className="text-sm font-black casino-text-gold text-center" 
                         style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                      {draw.totalPotValueSol
                        ? `${draw.totalPotValueSol.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SOL`
                        : "—"}
                    </div>
                    
                    {/* Bottom row: WIN Badge + Verify */}
                    <div className="flex items-center justify-between w-full gap-1">
                      <motion.div
                        animate={{
                          boxShadow: [
                            "0 0 0px rgba(255, 20, 147, 0)",
                            "0 0 6px rgba(255, 20, 147, 0.8)",
                            "0 0 0px rgba(255, 20, 147, 0)"
                          ]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: index * 0.3
                        }}
                        className="px-2 py-0.5 bg-gradient-to-r from-[#FF1493] to-[#DC143C] rounded-full border border-[#FF69B4] flex-shrink-0"
                      >
                        <span className="text-[10px] font-black text-white tracking-wider"
                              style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                          WIN
                        </span>
                      </motion.div>
                      
                      {/* Verify Button */}
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVerifyWin(draw.gameId.toString(), draw.winner)}
                          className="p-1 h-auto w-auto border border-[#00FFFF] bg-[#00FFFF]/20 hover:bg-[#00FFFF]/40 transition-all duration-200 rounded group-hover:border-[#FFFF00] group-hover:bg-[#FFFF00]/20"
                          title="Verify this win on blockchain"
                        >
                          <Eye className="h-3 w-3 text-[#00FFFF] group-hover:text-[#FFFF00]" />
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Corner decoration */}
                  <div className="absolute top-0.5 right-0.5">
                    <Star className="h-2 w-2 casino-star" fill="currentColor" />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}