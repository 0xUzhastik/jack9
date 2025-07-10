import { EnterRound } from "./EnterRound";
import JackpotDonutChart from "./JackpotDonutChart";
import { TokenSelectorModeWrapper } from "./tokenSelector/TokenSelectorModeWrapper"; // 🔥 NEW: Use mode wrapper
import { useUIStore } from "@/stores/uiStore";
import { Button } from "./ui/button";
import { Edit } from "lucide-react";
import { useTokenStore } from '@/stores/tokenStore';
import { usePrivy } from '@privy-io/react-auth';
import { useToast } from '../hooks/use-toast';
import { buildDepositTransaction } from '../lib/transaction-builder';
import { useAudioStore } from '../stores/audioStore';
import { Connection } from '@solana/web3.js';
import { jackpotAddr } from '../lib/constants';
import { formatUSDValueForDisplay, calculateTotalSelectedUSD } from '../lib/tokenSelectorUtils';
import { WalletConnect } from './WalletConnect';
import { useSolPriceUSD } from '@/hooks/useSolPriceUSD';
import { useTokenPricesSol } from '@/hooks/useTokenPriceSol';
import { useState } from 'react';
import { useTokenBalances } from '@/hooks/useTokenBalances';

export function CenterColumn() {
  const { isMobile } = useUIStore();
  const { selectedTokens, clearSelectedTokens } = useTokenStore();
  const { authenticated, user } = usePrivy();
  const { toast } = useToast();
  const playSound = useAudioStore((s) => s.playSound);
  const [depositLoading, setDepositLoading] = useState(false);
  const { mutate } = useTokenBalances(user?.wallet?.address);

  // Get price data for USD calculation
  const { price: solPrice } = useSolPriceUSD();
  const mintAddresses = selectedTokens.map(token => token.mint);
  const { prices: tokenPricesInSol } = useTokenPricesSol(mintAddresses);
  const totalSelectedUSD = calculateTotalSelectedUSD(selectedTokens, tokenPricesInSol, solPrice);

  const handleDeposit = async () => {
    if (!user?.wallet?.address || selectedTokens.length === 0 || totalSelectedUSD <= 0) return;
    setDepositLoading(true);
    try {
      const connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC!);
      const tx = await buildDepositTransaction(selectedTokens, user.wallet.address, jackpotAddr, connection);
      // @ts-ignore
      const { signature } = await window.solana.signAndSendTransaction(tx);
      toast({ title: 'Deposit successful', description: 'Your deposit was sent!' });
      if (playSound) playSound('deposit');
      clearSelectedTokens();
      if (mutate) await mutate();
    } catch (e: any) {
      toast({ title: 'Deposit failed', description: e?.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setDepositLoading(false);
    }
  };

  return (
    <div className="md:col-span-2 w-full max-w-full min-w-0 h-full min-h-0 flex flex-col gap-2 overflow-visible">
      {/* Donut Chart */}
      <div className="w-full h-[55vh] min-h-0 relative  pt-4 z-5">
        <JackpotDonutChart />
      </div>
      {/* Token Selector/Portfolio (Desktop) or Empty space (Mobile) */}
      {!isMobile && (
        <div className="flex-1 min-h-0 overflow-visible" style={{ zIndex: 2 }}>
          <TokenSelectorModeWrapper mutateTokenBalances={mutate} />
        </div>
      )}
      {/* Shared Deposit Button (Desktop only) - moved below selector */}
      {!isMobile && (
        <div className="w-full flex flex-col items-center z-10 px-4">
          {(!authenticated || !user?.wallet?.address) ? (
            <WalletConnect />
          ) : (
            <Button
              className="max-w-[40%] mx-auto w-full text-lg font-bold py-4 mb-2 rounded-full transition-all duration-200 shadow-md hover:shadow-[0_0_24px_8px_rgba(255,215,0,0.5)] hover:ring-4 hover:ring-yellow-300/40 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black"
              disabled={selectedTokens.length === 0 || totalSelectedUSD <= 0 || depositLoading}
              onClick={handleDeposit}
            >
              {depositLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 mr-2 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                  Depositing...
                </span>
              ) : (
                `Deposit${totalSelectedUSD > 0 ? ` (${formatUSDValueForDisplay(totalSelectedUSD)})` : ''}`
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}