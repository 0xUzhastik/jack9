// hooks/useWebSocketGameEvents.ts
"use client";

import { useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { toast } from '@/hooks/use-toast';
import { Deposit } from '@/lib/types'; // Assuming you have this type
import { useSolPriceUSD } from './useSolPriceUSD';

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'wss://webhooks-production-2e4f.up.railway.app/ws';

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

    // Use a ref to always have the latest solPrice
    const solPriceRef = useRef<number | undefined>(solPrice);
    useEffect(() => {
        solPriceRef.current = solPrice;
    }, [solPrice]);

    const ws = useRef<WebSocket | null>(null);

    const connect = () => {
        console.log('[ws]Connecting to WebSocket...', WEBSOCKET_URL);
        ws.current = new WebSocket(WEBSOCKET_URL);

        ws.current.onopen = () => {
            console.log('🔗 WebSocket connected');
            toast({ title: 'Connected to Live Game', duration: 2000 });
        };

        ws.current.onmessage = (event) => {
            console.log('[ws] Received message:', event.data);
            try {
                const message = JSON.parse(event.data);
                
                switch (message.event) {
                    case 'game_updated':
                        handleGameUpdated(message.data as GameUpdateData);
                        break;
                    case 'game_started':
                        handleGameStarted(message.data as GameStartedData);
                        break;
                    case 'game_closed':
                        handleGameClosed(message.data as GameClosedData);
                        break;
                    default:
                        // console.log('Received unknown event:', message.event);
                        break;
                }
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };

        ws.current.onclose = () => {
            console.log('🔌 WebSocket disconnected. Reconnecting in 3 seconds...');
            setTimeout(connect, 3000); // Simple auto-reconnect
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
            ws.current?.close(); // This will trigger the onclose handler for reconnection
        };
    };

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

        console.log('[ws] tokenPrices:', tokenPrices, currentSolPrice);
        const newDeposits: Deposit[] = data.deposits.map((d: any, index: number) => ({
            id: d.signature || d._id || `deposit-${index}`,
            user: `${d.from.slice(0, 4)}...${d.from.slice(-4)}`,
            token: d.metadata?.symbol || '',
            amount: d.tokenAmount * (tokenPrices[d.tokenMint] || 0), // Convert to SOL
            amountUSD: d.tokenAmount * (tokenPrices[d.tokenMint] || 0) * currentSolPrice,
            timestamp: new Date(d.receivedAt),
            color: ''
        }));

        console.log('[ws] newDeposits:', newDeposits);

        setDeposits(newDeposits);

        // Calculate countdown
        const raffleTime = new Date(data.estimatedRaffleAt).getTime();
        const now = Date.now();
        const secondsLeft = Math.max(0, Math.floor((raffleTime - now) / 1000));
        setSeconds(secondsLeft);
    }, [setDeposits, setSeconds]);

    const handleGameStarted = (data: GameStartedData) => {
        console.log(`🎉 New Game Started: #${data.gameId}`);
        toast({ title: `🚀 Round #${data.gameId} has started!`, description: 'Get your deposits in!', duration: 4000 });
        resetRound();
        setRoundState('active');
    };

    const handleGameClosed = (data: GameClosedData) => {
        console.log(`🏁 Game Closed: #${data.gameId}, Winner: ${data.winner}`);
        const { winner, totalPotValueSol } = data;

        const winnerDeposit = currentRoundDeposits.find(d => d.user.replace('...', '') === `${winner.slice(0,4)}${winner.slice(-4)}`);
        
        if (!winnerDeposit) {
            console.error("Winner from event not found in current deposits list!");
            // Fallback: just announce winner name and end round without spinning
            setWinner(winner, totalPotValueSol);
            setRoundState('ended');
            return;
        }

        // Trigger the spinning animation
        setRoundState('ending');
        
        // Let the existing logic in JackpotDonutChart handle the sequence
        // The component will see `roundState` is 'ending' and start its animation sequence.
        // You've already determined the winner here, so the spin will be for show.
    };

    useEffect(() => {
        connect();
        return () => {
            ws.current?.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}