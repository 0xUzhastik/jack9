"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction, createTransferInstruction } from '@solana/spl-token';
import { usePrivy } from '@privy-io/react-auth';
import { Zap, ArrowRight, Wallet, ChevronDown, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TokenSelector } from "./tokenSelector/TokenSelector";
import { toast } from '@/hooks/use-toast';
import { jackpotAddr } from "@/lib/constants";
import { useSolPriceUSD } from "@/hooks/useSolPriceUSD";
import { useTokenPricesSol } from "@/hooks/useTokenPriceSol";
import { useTokenStore } from "@/stores/tokenStore";
import { useUIStore } from "@/stores/uiStore";
import { useSettingsStore } from "@/stores/settingsStore";

interface TokenRow {
  mint: string;
  amount: number;
  decimals: number;
  symbol: string;
  name: string;
  image: string;
  selected?: boolean;
  selectedAmount?: number;
}

interface DepositBarProps {
  selectedTokens: TokenRow[];
}

declare global {
  interface Window {
    solana?: {
      signAndSendTransaction: (transaction: any) => Promise<{ signature: string }>;
      isPhantom?: boolean;
    };
  }
}

// USD formatting helper function
function formatUSDValue(usdValue: number): string {
  if (usdValue >= 1000000) {
    return `$${(usdValue / 1000000).toFixed(1)}M`;
  } else if (usdValue >= 1000) {
    return `$${(usdValue / 1000).toFixed(1)}K`;
  } else if (usdValue >= 1) {
    return `$${usdValue.toFixed(2)}`;
  } else if (usdValue >= 0.01) {
    return `$${usdValue.toFixed(2)}`;
  } else {
    return `$${usdValue.toFixed(4)}`;
  }
}

export function DepositBar({ selectedTokens }: DepositBarProps) {
  const { authenticated, user } = usePrivy();
  const publicKey = user?.wallet?.address;
  const [depositing, setDepositing] = useState(false);
  
  const connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC!);

  // Zustand stores
  const {
    selectedTokens: localSelectedTokens,
    delayedExpandToken,
    clearDelayedExpand,
    clearSelectedTokens
  } = useTokenStore();
  
  const { isExpanded, setIsExpanded } = useUIStore();
  
  // Settings store for Pro Mode
  const { isProModeEnabled, toggleProMode } = useSettingsStore();

  // Add price hooks for USD calculation
  const { price: solPrice } = useSolPriceUSD();
  
  // Get all mint addresses for price fetching
  const mintAddresses = useMemo(() => localSelectedTokens?.map(token => token.mint) || [], [localSelectedTokens]);
  const { prices: tokenPricesInSol } = useTokenPricesSol(mintAddresses);

  // Calculate total USD value of selected tokens
  const totalSelectedUSDValue = useMemo(() => {
    if (!localSelectedTokens.length || !solPrice) return 0;

    return localSelectedTokens.reduce((total, token) => {
      const selectedAmount = token.selectedAmount ?? 0;
      if (selectedAmount <= 0) return total;

      // For SOL, direct USD calculation
      if (token.mint === 'So11111111111111111111111111111111111111112') {
        return total + (selectedAmount * solPrice);
      }

      // For other tokens, convert through SOL price
      const tokenPriceInSol = tokenPricesInSol[token.mint];
      if (tokenPriceInSol) {
        const valueInSol = selectedAmount * tokenPriceInSol;
        return total + (valueInSol * solPrice);
      }

      return total;
    }, 0);
  }, [localSelectedTokens, tokenPricesInSol, solPrice]);

  const buildTransaction = async () => {
    if (!publicKey) throw new Error('Wallet not connected');
    const pubKey = new PublicKey(publicKey);
    const tx = new Transaction();

    for (const token of localSelectedTokens) {
      const amount = token.selectedAmount ?? 0;
      if (amount <= 0) continue;

      if (token.mint === 'So11111111111111111111111111111111111111112') {
        tx.add(
          SystemProgram.transfer({
            fromPubkey: pubKey,
            toPubkey: new PublicKey(jackpotAddr),
            lamports: Math.round(amount * LAMPORTS_PER_SOL),
          }),
        );
      } else {
        const mint = new PublicKey(token.mint);
        const fromAta = getAssociatedTokenAddressSync(mint, pubKey);
        const toAta = getAssociatedTokenAddressSync(mint, new PublicKey(jackpotAddr), true);

        if (!(await connection.getAccountInfo(toAta))) {
          tx.add(
            createAssociatedTokenAccountInstruction(
              pubKey,
              toAta,
              new PublicKey(jackpotAddr),
              mint,
            ),
          );
        }

        tx.add(
          createTransferInstruction(
            fromAta,
            toAta,
            pubKey,
            BigInt(Math.round(amount * 10 ** token.decimals)),
          ),
        );
      }
    }

    tx.feePayer = pubKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    return tx;
  };

  const handleDeposit = async () => {
    if (!authenticated || !publicKey || localSelectedTokens.length === 0) {
      toast({ title: 'Please select tokens to deposit', variant: 'destructive' });
      return;
    }

    try {
      setDepositing(true);
      const tx = await buildTransaction();

      if (window.solana && window.solana.signAndSendTransaction) {
        const signature = await window.solana.signAndSendTransaction(tx);
        await connection.confirmTransaction(signature.signature, 'confirmed');
        toast({ title: 'Deposit sent! Waiting for confirmation...', description: signature.signature });
        clearSelectedTokens();
        setIsExpanded(false);
      } else {
        throw new Error('Solana wallet not found');
      }
    } catch (e: any) {
      console.error('Deposit error:', e);
      toast({
        title: 'Deposit failed',
        description: e?.message ?? 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setDepositing(false);
    }
  };

  return (
    <>
      {/* Expanded Token Selector - FIXED: Proper height constraints */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          >
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-[#4A0E4E] to-[#2D0A30] border-t-4 border-[#FFD700] flex flex-col rounded-t-xl"
                 style={{ height: '85vh' }}>
              {/* Header */}
              <div className="p-4 border-b-2 border-[#FFD700] flex items-center justify-between flex-shrink-0">
                <h2 className="text-xl font-black casino-text-gold" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                  Select Tokens to Deposit
                </h2>
                <div className="flex items-center gap-2">
                  {/* Pro Mode Toggle */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={toggleProMode}
                      className={`casino-button border-2 ${isProModeEnabled ? 'bg-[#FFFF00] text-black' : ''}`}
                      style={{ 
                        fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                        boxShadow: "0 0 8px rgba(255, 215, 0, 0.6)",
                        borderRadius: "12px",
                        padding: "8px 12px"
                      }}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      {isProModeEnabled ? "Pro Mode" : "Basic Mode"}
                    </Button>
                  </motion.div>
                  
                  {/* Close Button */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => setIsExpanded(false)}
                      className="casino-button border-2 border-[#FFD700]"
                      style={{ 
                        fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                        boxShadow: "0 0 8px rgba(255, 215, 0, 0.6)",
                        borderRadius: "12px"
                      }}
                    >
                      <ChevronDown className="h-5 w-5" />
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Token Selector - FIXED: Proper flex constraints */}
              <div className="flex-1 min-h-0 p-4">
                <TokenSelector
                  selectedTokens={localSelectedTokens}
                  onSelectedTokensChange={() => {}} // Handled by Zustand
                  delayedExpandToken={delayedExpandToken}
                  onClearDelayedExpand={clearDelayedExpand}
                  isMobile={true}
                />
              </div>

              {/* Action Buttons - FIXED: Proper button sizing */}
              <div className="p-4 border-t-2 border-[#FFD700] flex gap-3 flex-shrink-0">
                {/* Cancel button - smaller with fixed width */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-shrink-0"
                  style={{ width: '100px' }}
                >
                  <Button
                    onClick={() => setIsExpanded(false)}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-black border-2 border-gray-500 transition-all duration-200"
                    style={{ 
                      fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                      boxShadow: "0 0 8px rgba(100, 100, 100, 0.6)",
                      borderRadius: "12px"
                    }}
                  >
                    Cancel
                  </Button>
                </motion.div>
                
                {/* Deposit button - much larger taking remaining space */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1"
                >
                  <Button
                    onClick={handleDeposit}
                    disabled={depositing || localSelectedTokens.length === 0}
                    className="w-full casino-button border-2 border-[#FFD700] font-black"
                    style={{ 
                      fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                      boxShadow: "0 0 12px rgba(255, 215, 0, 0.8)",
                      borderRadius: "12px"
                    }}
                  >
                    {depositing ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Zap className="h-5 w-5 mr-2" fill="currentColor" />
                        </motion.div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5 mr-2" fill="currentColor" />
                        Deposit {localSelectedTokens.length > 0 && totalSelectedUSDValue > 0 && formatUSDValue(totalSelectedUSDValue)}
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Bottom Bar with centered "Select Tokens" text */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFFF00] border-t-4 border-[#DAA520] rounded-t-xl">
          {authenticated ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsExpanded(true)}
              className="w-full px-4 py-3 flex items-center justify-center cursor-pointer hover:bg-[#FFFF00] transition-colors duration-200"
            >
              <span className="text-black font-black text-lg text-center" 
                    style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                Select Tokens
              </span>
            </motion.button>
          ) : (
            <div className="flex items-center justify-center px-4 py-3">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-black" />
                <span className="text-black font-black text-base" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                  Connect Wallet to Play
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}