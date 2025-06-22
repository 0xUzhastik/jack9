"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Star, Trophy, Eye, ExternalLink, Users, Coins, Hash, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from '@/hooks/use-toast';
import { pastDraws } from "@/lib/mock-data";
import { useSolPriceUSD } from '@/hooks/useSolPriceUSD';
import useSWR from 'swr';
import { useState } from 'react';

interface PastGame {
  gameId: number;
  winner: string;
  totalPotValueSol: number;
  createdAt: string;
  payoutTxSig?: string;
  participants?: Array<{
    wallet: string;
    sol: number;
    valueSol: number;
    percentOfPot: number;
    tokens?: Array<{
      mint: string;
      amount: number;
      symbol: string;
      name: string;
      liquidated: boolean;
    }>;
  }>;
  deposits?: Array<{
    signature: string;
    from: string;
    kind: string;
    sol?: number;
    tokenMint?: string;
    tokenAmount?: number;
    metadata?: {
      symbol: string;
      name: string;
    };
  }>;
  vrfProof?: {
    winningTicket: string;
    ticketCount: string;
    randomness: string;
  };
  ticketInfo?: {
    total: number;
  };
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  // if (!res.ok) throw new Error('Failed to fetch');
  const data = await res.json();
  console.log({ data });
  return data;
};

const truncateWallet = (wallet: string) => {
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function PastWinners() {
  const [selectedGame, setSelectedGame] = useState<PastGame | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { price: solPriceUSD } = useSolPriceUSD();

  const { data, error, isLoading } = useSWR<PastGame[]>(
    'https://webhooks-production-2e4f.up.railway.app/game/games?limit=3&orphan=false',
    fetcher,
    { revalidateOnFocus: false }
  );

  const games = data?.filter(game => game.winner && game.payoutTxSig) || [];

  const handleVerifyWin = (payoutTxSig: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (payoutTxSig) {
      window.open(`https://solscan.io/tx/${payoutTxSig}`, '_blank');
    } else {
      toast({
        title: '❌ No Transaction',
        description: 'No payout transaction found for this game.',
        duration: 3000,
      });
    }
  };

  const handleGameClick = (game: PastGame) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="casino-box casino-box-gold overflow-hidden p-0 h-full flex flex-col relative">
        {/* Corner stars */}
        <div className="absolute top-2 left-2 z-10">
          <Trophy className="h-4 w-4 casino-text-gold" />
        </div>
        <div className="absolute top-2 right-2 z-10">
          <Trophy className="h-4 w-4 casino-text-gold" />
        </div>

        <CardContent className="p-3 h-full flex flex-col min-w-0">
          {/* Title */}
          <div className="mb-3">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-lg font-black uppercase text-center tracking-wide casino-text-gold truncate"
                style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                Recent Winners
              </h2>
            </div>
          </div>

          {/* Scrollable Games */}
          <div className="flex-1 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-sm text-white/60">Loading winners...</div>
              </div>
            ) : games.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-sm text-white/60">No recent winners</div>
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-hidden h-full">
                <div className="flex gap-3 h-full pb-2">
                  {games.map((game, index) => (
                    <motion.div
                      key={game.gameId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex-shrink-0 w-48 cursor-pointer"
                      onClick={() => handleGameClick(game)}
                    >
                      <Card className="casino-box casino-box-purple h-full bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-400/30 hover:border-purple-300/50 transition-colors">
                        <CardContent className="p-3 h-full flex flex-col justify-between">
                          {/* Game Header */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="bg-purple-500/20 px-2 py-1 rounded text-xs font-bold text-purple-300">
                                Game #{game.gameId}
                              </div>
                              <Star className="h-3 w-3 text-yellow-400" />
                            </div>
                            
                            {/* Winner */}
                            <div>
                              <div className="text-xs text-white/60 mb-1">Winner</div>
                              <div className="text-sm font-mono text-white bg-black/20 px-2 py-1 rounded">
                                {truncateWallet(game.winner)}
                              </div>
                            </div>

                            {/* Pot Value */}
                            <div>
                              <div className="text-xs text-white/60 mb-1">Jackpot</div>
                              <div className="text-lg font-bold casino-text-gold">
                                {game.totalPotValueSol.toFixed(3)} SOL
                              </div>
                              {solPriceUSD && (
                                <div className="text-sm text-green-400 font-semibold flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  ${(game.totalPotValueSol * solPriceUSD).toLocaleString('en-US', { 
                                    minimumFractionDigits: 0, 
                                    maximumFractionDigits: 0 
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Date */}
                            <div>
                              <div className="text-xs text-white/60 mb-1">Won</div>
                              <div className="text-xs text-white/80">
                                {formatDate(game.createdAt)}
                              </div>
                            </div>
                          </div>

                          {/* Verify Button */}
                          <Button
                            onClick={(e) => handleVerifyWin(game.payoutTxSig || '', e)}
                            size="sm"
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white border-purple-500 text-xs"
                            disabled={!game.payoutTxSig}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View TX
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </div>

      {/* Game Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-purple-950 to-black border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold casino-text-gold flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              Game #{selectedGame?.gameId} Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedGame && (
            <div className="space-y-6 text-white">
              {/* Game Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-purple-900/20 p-3 rounded border border-purple-500/20">
                  <div className="text-xs text-white/60 mb-1">Winner</div>
                  <div className="font-mono text-sm">{truncateWallet(selectedGame.winner)}</div>
                </div>
                <div className="bg-purple-900/20 p-3 rounded border border-purple-500/20">
                  <div className="text-xs text-white/60 mb-1">Total Pot</div>
                  <div className="text-lg font-bold casino-text-gold">{selectedGame.totalPotValueSol.toFixed(3)} SOL</div>
                  {solPriceUSD && (
                    <div className="text-sm text-green-400 font-semibold">
                      ${(selectedGame.totalPotValueSol * solPriceUSD).toLocaleString('en-US', { 
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 0 
                      })}
                    </div>
                  )}
                </div>
                <div className="bg-purple-900/20 p-3 rounded border border-purple-500/20">
                  <div className="text-xs text-white/60 mb-1">Date</div>
                  <div className="text-sm">{formatDate(selectedGame.createdAt)}</div>
                </div>
                <div className="bg-purple-900/20 p-3 rounded border border-purple-500/20">
                  <div className="text-xs text-white/60 mb-1">Total Tickets</div>
                  <div className="text-sm font-mono">{selectedGame.ticketInfo?.total.toLocaleString() || 'N/A'}</div>
                </div>
              </div>

              {/* Participants */}
              {selectedGame.participants && selectedGame.participants.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participants ({selectedGame.participants.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedGame.participants.map((participant, idx) => (
                      <div key={idx} className="bg-black/20 p-3 rounded border border-white/10">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-mono text-sm">{truncateWallet(participant.wallet)}</div>
                          <Badge variant={participant.wallet === selectedGame.winner ? "default" : "secondary"}>
                            {participant.wallet === selectedGame.winner ? "WINNER" : "Player"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="text-white/60">SOL: </span>
                            <span className="font-bold">{participant.sol.toFixed(3)}</span>
                          </div>
                          <div>
                            <span className="text-white/60">Value: </span>
                            <span className="font-bold">{participant.valueSol.toFixed(3)} SOL</span>
                          </div>
                          <div>
                            <span className="text-white/60">Share: </span>
                            <span className="font-bold">{(participant.percentOfPot * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                        {participant.tokens && participant.tokens.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-white/60 mb-1">Tokens:</div>
                            <div className="flex flex-wrap gap-1">
                              {participant.tokens.map((token, tokenIdx) => (
                                <Badge key={tokenIdx} variant="outline" className="text-xs">
                                  {token.amount.toLocaleString()} {token.symbol}
                                  {token.liquidated && <span className="ml-1 text-green-400">✓</span>}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VRF Proof */}
              {selectedGame.vrfProof && (
                <div>
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Randomness Proof
                  </h3>
                  <div className="bg-black/20 p-3 rounded border border-white/10 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-white/60">Winning Ticket: </span>
                        <span className="font-mono">{selectedGame.vrfProof.winningTicket}</span>
                      </div>
                      <div>
                        <span className="text-white/60">Total Tickets: </span>
                        <span className="font-mono">{selectedGame.vrfProof.ticketCount}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-white/60 text-xs mb-1">Randomness Hash:</div>
                      <div className="font-mono text-xs bg-black/30 p-2 rounded break-all">
                        {selectedGame.vrfProof.randomness}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {selectedGame.payoutTxSig && (
                  <Button 
                    onClick={() => window.open(`https://solscan.io/tx/${selectedGame.payoutTxSig}`, '_blank')}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Payout Transaction
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  className="border-purple-500/30 hover:bg-purple-500/10"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}