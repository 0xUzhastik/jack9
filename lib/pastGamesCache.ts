// lib/pastGamesCache.ts
"use client";

import { mutate } from 'swr';
import { toast } from '@/hooks/use-toast';

const PAST_GAMES_URL = 'https://webhooks-production-2e4f.up.railway.app/game/games?limit=10&orphan=false';

export const pastGamesCache = {
  /**
   * Re-fetch past games history
   */
  refresh: () => {
    console.log('[pastGamesCache] Refreshing past games history...');
    // Add a small delay to ensure backend has processed the game closure
    setTimeout(() => {
      mutate(PAST_GAMES_URL);
      toast({
        title: '📊 History Updated',
        description: 'Recent winners list has been refreshed!',
        duration: 2000,
      });
    }, 1000); // 1 second delay
  },

  /**
   * Get the URL used for past games API
   */
  getUrl: () => PAST_GAMES_URL,
}; 