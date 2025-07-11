// hooks/useWebSocketGameEvents.ts
"use client";

import { useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { socketBus } from '@/lib/socketBus';
import { toast } from '@/hooks/use-toast';
import { Deposit } from '@/lib/types'; // Assuming you have this type
import { useSolPriceUSD } from './useSolPriceUSD';
import { usePrivy } from '@privy-io/react-auth';
import { pastGamesCache } from '@/lib/pastGamesCache';

// Define the shape of the incoming WebSocket data based on your examples
interface GameUpdateData {
    game: { _id: string; gameId: number; };
    totalPotValueSol: number;
    participants: any[]; // Define a proper type for participants
    deposits: any[]; // Define a proper type for raw deposit data
    estimatedRaffleAt: string;
    tokenPricesSol?: Record<string, number>;
}

interface GameStartedData {
    gameId: number;
    createdAtISO: string;
}

interface GameClosedData {
    gameId: number;
    winner: string; // This should be the wallet address of the winner
    totalPotValueSol: number;
    payoutTxSig?: string;
}

export function useWebSocketGameEvents() {
    const { 
        setRoundState,
        setDeposits, 
        setWinner, 
        setSeconds, 
        startSpinning,
        resetRound,
        currentRoundDeposits, // Get current deposits to find winner object
        totalAmount
    } = useGameStore.getState();

    const { price: solPrice } = useSolPriceUSD();
    const { user } = usePrivy();
    const userWalletRef = useRef<string | undefined>(user?.wallet?.address);

    useEffect(() => {
        userWalletRef.current = user?.wallet?.address;
    }, [user]);

    // Use a ref to always have the latest solPrice
    const solPriceRef = useRef<number | undefined>(solPrice);
    useEffect(() => {
        solPriceRef.current = solPrice;
    }, [solPrice]);

    const hasLoadedInitialRound = useRef(false);
    const prevUserDepositSigsRef = useRef<Set<string>>(new Set());

    console.log('[ws] solPrice:', solPrice);

    // Stable handler that always reads from the ref
    const handleGameUpdated = useCallback((data: GameUpdateData) => {
        const currentSolPrice = solPriceRef.current;
        if (currentSolPrice === undefined) {
            console.warn('[ws] Skipping handleGameUpdated: solPrice is undefined');
            return;
        }
        console.log('[ws] handleGameUpdated:', {data});
        const tokenPrices = data.tokenPricesSol || {};

        // Get current user wallet address
        // let userWallet: string | null = null;
        // if (typeof window !== 'undefined' && window.localStorage.getItem('privy:wallet')) {
        //     try {
        //         userWallet = JSON.parse(window.localStorage.getItem('privy:wallet') || '{}').address || null;
        //     } catch {}
        // }

        const userWallet = userWalletRef.current;

        // Aggregate deposits by signature+user
        const depositMap = new Map();
        let newUserDepositSigs = new Set(prevUserDepositSigsRef.current);
        let toastsShownThisUpdate = new Set();

        for (const d of data.deposits) {
            const key = `${d.signature || d._id || ''}_${d.from}`;
            let tokenSymbol, tokenAmount, tokenAmountUSD;

            if (d.kind === 'SOL') {
                tokenSymbol = 'SOL';
                tokenAmount = d.sol;
                tokenAmountUSD = d.sol * currentSolPrice;
            } else {
                tokenSymbol = d.metadata?.symbol || '';
                tokenAmount = d.tokenAmount * (tokenPrices[d.tokenMint] || 0);
                tokenAmountUSD = d.tokenAmount * (tokenPrices[d.tokenMint] || 0) * currentSolPrice;
            }

            // Debug logging for credited toast
            console.log('[toast-debug] userWallet:', userWallet, 'd.from:', d.from, 'd.signature:', d.signature);
            if (
                typeof userWallet === 'string' &&
                d.from === userWallet &&
                d.signature &&
                !prevUserDepositSigsRef.current.has(d.signature) &&
                !toastsShownThisUpdate.has(d.signature)
            ) {
                console.log('[toast-debug] Credited toast condition met for signature:', d.signature);
                toast({ title: 'Your deposit has been credited!' });
                newUserDepositSigs.add(d.signature);
                toastsShownThisUpdate.add(d.signature);
            }

            if (depositMap.has(key)) {
                const dep = depositMap.get(key);
                dep.tokens.push(tokenSymbol);
                dep.amount += tokenAmount;
                dep.amountUSD += tokenAmountUSD;
            } else {
                depositMap.set(key, {
                    id: d.signature || d._id || key,
                    user: `${d.from.slice(0, 4)}...${d.from.slice(-4)}`,
                    tokens: [tokenSymbol],
                    amount: tokenAmount,
                    amountUSD: tokenAmountUSD,
                    timestamp: new Date(d.receivedAt),
                    color: '',
                });
            }
        }
        const newDeposits = Array.from(depositMap.values());
        if (!hasLoadedInitialRound.current) {
            setDeposits(newDeposits);
            // Calculate countdown
            const raffleTime = new Date(data.estimatedRaffleAt).getTime();
            const now = Date.now();
            const secondsLeft = Math.max(0, Math.floor((raffleTime - now) / 1000));
            setSeconds(secondsLeft);
            hasLoadedInitialRound.current = true;
        } else {
            setDeposits(newDeposits);
            // Calculate countdown
            const raffleTime = new Date(data.estimatedRaffleAt).getTime();
            const now = Date.now();
            const secondsLeft = Math.max(0, Math.floor((raffleTime - now) / 1000));
            setSeconds(secondsLeft);
        }
        prevUserDepositSigsRef.current = newUserDepositSigs;
    }, [setDeposits, setSeconds]);

    const handleGameStarted = useCallback((data: GameStartedData) => {
        console.log(`🎉 New Game Started: #${data.gameId}`);
        toast({ title: `🚀 Round #${data.gameId} has started!`, description: 'Get your deposits in!', duration: 4000 });
        resetRound();
        setRoundState('active');
    }, [resetRound, setRoundState]);

    const handleGameClosed = useCallback((data: GameClosedData) => {
        console.log(`🏁 Game Closed: #${data.gameId}, Winner: ${data.winner}`);
        const { winner, totalPotValueSol } = data;

        const winnerDeposit = currentRoundDeposits.find(d => d.user.replace('...', '') === `${winner.slice(0,4)}${winner.slice(-4)}`);
        
        if (!winnerDeposit) {
            console.error("Winner from event not found in current deposits list!");
            // Fallback: just announce winner name and end round without spinning
            setWinner(winner, totalPotValueSol);
            setRoundState('ended');
            // Refresh past games history when round ends
            pastGamesCache.refresh();
            return;
        }

        // Trigger the spinning animation
        setRoundState('ending');
        
        // Let the existing logic in JackpotDonutChart handle the sequence
        // The component will see `roundState` is 'ending' and start its animation sequence.
        // You've already determined the winner here, so the spin will be for show.
        
        // Refresh past games history when round ends
        pastGamesCache.refresh();
    }, [currentRoundDeposits, setWinner, setRoundState]);

    useEffect(() => {
        socketBus.on("game_updated", handleGameUpdated);
        socketBus.on("game_started", handleGameStarted);
        socketBus.on("game_closed", handleGameClosed);

        return () => {
            socketBus.off("game_updated", handleGameUpdated);
            socketBus.off("game_started", handleGameStarted);
            socketBus.off("game_closed", handleGameClosed);
        };
    }, [handleGameUpdated, handleGameStarted, handleGameClosed]);
}