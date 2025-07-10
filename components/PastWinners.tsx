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
    'https://webhooks-production-2e4f.up.railway.app/game/games?limit=10&orphan=false',
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
      <div className="flex flex-col h-full w-full">
        {/* Title */}
        <div className="mb-2 flex items-center justify-center gap-2">
          <h2 className="text-lg font-black uppercase text-center tracking-wide casino-text-gold truncate"
            style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
            Recent Winners
          </h2>
        </div>
        {/* Table Headers */}
        <div className="grid grid-cols-12 gap-2 px-2 py-1 flex-shrink-0 border-b border-yellow-400/30">
          <div className="col-span-2 text-xs font-black uppercase casino-text-yellow">Game</div>
          <div className="col-span-3 text-xs font-black uppercase casino-text-yellow">Winner</div>
          <div className="col-span-3 text-xs font-black uppercase casino-text-yellow">Jackpot</div>
          <div className="col-span-2 text-xs font-black uppercase casino-text-yellow">Date</div>
          <div className="col-span-2 text-xs font-black uppercase casino-text-yellow">TX</div>
        </div>
        {/* Table Body - Scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-2" style={{ maxHeight: 160 }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-sm text-white/60">Loading winners...</div>
          ) : games.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-white/60">No recent winners</div>
          ) : (
            <div className="space-y-1">
              {games.map((game, index) => (
                <div
                  key={game.gameId}
                  className="grid grid-cols-12 gap-2 items-center py-1 px-2 rounded-md bg-black/10 hover:bg-yellow-900/10 transition-colors cursor-pointer"
                  style={{ borderRadius: 8 }}
                  onClick={() => handleGameClick(game)}
                >
                  <div className="col-span-2 text-xs font-mono casino-text-gold">#{game.gameId}</div>
                  <div className="col-span-3 text-xs font-mono text-white bg-black/20 px-2 py-1 rounded truncate">{truncateWallet(game.winner)}</div>
                  <div className="col-span-3 text-xs font-bold casino-text-gold">
                    {game.totalPotValueSol.toFixed(3)} SOL
                    {solPriceUSD && (
                      <span className="text-green-400 font-semibold ml-1">
                        (${(game.totalPotValueSol * solPriceUSD).toLocaleString('en-US', { maximumFractionDigits: 0 })})
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 text-xs text-white/80">{formatDate(game.createdAt)}</div>
                  <div className="col-span-2">
                    <button
                      onClick={e => handleVerifyWin(game.payoutTxSig || '', e)}
                      className="text-xs text-blue-400 hover:underline"
                      style={{ fontFamily: 'Visby Round CF, SF Pro Display, sans-serif' }}
                    >
                      View TX
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Game Details Modal (unchanged) */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-purple-950 to-black border-purple-500/30" style={{ borderRadius: 16 }}>
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
      </div>
    </>
  );
}