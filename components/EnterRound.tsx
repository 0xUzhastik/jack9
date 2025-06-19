"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Zap, Wallet } from "lucide-react";
import { usePrivy } from '@privy-io/react-auth';
import { WalletConnect } from './WalletConnect';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction, createTransferInstruction } from '@solana/spl-token';
import { toast } from '@/hooks/use-toast';
import { jackpotAddr } from "@/lib/constants";

// Types
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

interface EnterRoundProps {
  selectedTokens: TokenRow[];
  onSelectedTokensChange: (tokens: TokenRow[]) => void;
}

// TypeScript declaration for window.solana
declare global {
  interface Window {
    solana?: {
      signAndSendTransaction: (transaction: any) => Promise<{ signature: string }>;
      isPhantom?: boolean;
    };
  }
}

export function EnterRound({ selectedTokens, onSelectedTokensChange }: EnterRoundProps) {
  const { authenticated, user } = usePrivy();
  const publicKey = user?.wallet?.address;

  const [depositing, setDepositing] = useState(false);

  const connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC!);

  const buildTransaction = async () => {
    if (!publicKey) throw new Error('Wallet not connected');
    const pubKey = new PublicKey(publicKey);
    const tx = new Transaction();

    for (const token of selectedTokens) {
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

  const handleEnterRound = async () => {
    if (!authenticated || !publicKey || selectedTokens.length === 0) {
      toast({ title: 'Please select tokens to deposit', variant: 'destructive' });
      return;
    }

    try {
      setDepositing(true);
      const tx = await buildTransaction();

      if (window.solana && window.solana.signAndSendTransaction) {
        const signature = await window.solana.signAndSendTransaction(tx);
        await connection.confirmTransaction(signature.signature, 'confirmed');
        toast({ title: 'Successfully entered the round!', description: signature.signature });
        onSelectedTokensChange([]);
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

  // if (!authenticated) {
  //   return (
  //     <div className="flex justify-center items-center p-4">
  //       <div className="casino-box casino-box-gold p-4 rounded-lg">
  //         <div className="flex items-center gap-3">
  //           <Wallet className="h-5 w-5 casino-text-gold" />
  //           <span className="text-sm font-black casino-text-gold" 
  //                 style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
  //             Connect Wallet to Play
  //           </span>
  //           <div className="ml-3">
  //             <WalletConnect />
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="flex justify-center items-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Button
          onClick={handleEnterRound}
          disabled={depositing || selectedTokens.length === 0}
          className="casino-button text-lg font-black uppercase tracking-wider px-8 py-4 border-2 border-[#FFD700] relative overflow-hidden group"
          style={{
            fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
            background: 'linear-gradient(145deg, #FFD700, #DAA520)',
            boxShadow: `
              0 0 25px rgba(255, 215, 0, 0.8),
              inset 0 2px 0 rgba(255, 255, 255, 0.3),
              inset 0 -2px 0 rgba(0, 0, 0, 0.3)
            `
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          <div className="flex items-center gap-3 relative z-10">
            {depositing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="h-5 w-5" fill="currentColor" />
                </motion.div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" fill="currentColor" />
                <span>ENTER ROUND</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </div>
        </Button>
      </motion.div>
    </div>
  );
}