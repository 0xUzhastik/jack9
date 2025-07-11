import useSWR from 'swr';
import { solanaTrackerAPI, MultiTokenResponse } from '@/lib/solanatracker/api';

// Transformed interface for compatibility with existing components
interface TokenPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns?: {
    buys: number;
    sells: number;
  };
  volume?: Record<string, number>;
  priceChange?: Record<string, number>;
  liquidity?: {
    usd?: number;
    base?: number;
    quote?: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    websites?: Array<{ url: string }>;
    socials?: Array<{ platform: string; handle: string }>;
  };
  // Additional Solana Tracker specific fields
  risk?: any;
  events?: any;
  holders?: number;
}

interface UseTokenDataParams {
  chainId: string;
  tokenAddresses: string | string[];
  enabled?: boolean;
}

interface UseTokenDataResponse {
  data: TokenPair[] | undefined;
  error: any;
  isLoading: boolean;
  isValidating: boolean;
  mutate: () => void;
}

// Minimum liquidity threshold in USD
const MIN_LIQUIDITY_USD = 1000;

// Helper function to check if token should be filtered out
const shouldFilterToken = (tokenData: any): boolean => {
  // Filter out rugged tokens
  if (tokenData.risk?.rugged) {
    return true;
  }
  
  // Filter out tokens with very low liquidity
  const pools = tokenData.pools || [];
  const hasValidLiquidity = pools.some((pool: any) => 
    pool.liquidity?.usd && pool.liquidity.usd >= MIN_LIQUIDITY_USD
  );
  
  if (!hasValidLiquidity) {
    return true;
  }
  
  // Filter out tokens with very high risk scores (above 15000)
  if (tokenData.risk?.score && tokenData.risk.score > 15000) {
    return true;
  }
  
  return false;
};

// Transform Solana Tracker data to TokenPair format for compatibility
const transformSolanaTrackerData = (response: MultiTokenResponse): TokenPair[] => {
  const tokenPairs: TokenPair[] = [];
  
  // Get tokens from either 'tokens' or 'data' property, whichever exists
  const tokensData = response.tokens || response.data || {};
  
  for (const [tokenAddress, tokenData] of Object.entries(tokensData)) {
    // Skip tokens that should be filtered out
    if (shouldFilterToken(tokenData)) {
      continue;
    }
    
    // Safely access pools
    const pools = (tokenData as any).pools || [];
    if (!pools.length) continue;
    
    // Find the best pool (highest liquidity)
    const bestPool = pools.reduce((best: any, current: any) => {
      if (!best || (current.liquidity?.usd || 0) > (best.liquidity?.usd || 0)) {
        return current;
      }
      return best;
    }, pools[0]);
    
    if (!bestPool) continue;
    
    // Safely access token info
    const tokenInfo = (tokenData as any).token;
    if (!tokenInfo) continue;
    
    // Create social links array
    const socials: Array<{ platform: string; handle: string }> = [];
    const extensions = tokenInfo.extensions || {};
    
    if (extensions.twitter) socials.push({ platform: 'twitter', handle: extensions.twitter });
    if (extensions.telegram) socials.push({ platform: 'telegram', handle: extensions.telegram });
    if (extensions.discord) socials.push({ platform: 'discord', handle: extensions.discord });
    
    // Create websites array
    const websites: Array<{ url: string }> = [];
    if (extensions.website) websites.push({ url: extensions.website });
    if (tokenInfo.website) websites.push({ url: tokenInfo.website });
    
    const tokenPair: TokenPair = {
      chainId: 'solana',
      dexId: bestPool.market || 'unknown',
      url: `https://solanatracker.io/token/${tokenAddress}`,
      pairAddress: bestPool.poolId || bestPool.id || tokenAddress,
      baseToken: {
        address: tokenAddress,
        name: tokenInfo.name || 'Unknown',
        symbol: tokenInfo.symbol || 'UNKNOWN',
      },
      quoteToken: {
        address: bestPool.quoteToken || 'So11111111111111111111111111111111111111112',
        name: bestPool.quoteToken === 'So11111111111111111111111111111111111111112' ? 'Wrapped SOL' : 'USDC',
        symbol: bestPool.quoteToken === 'So11111111111111111111111111111111111111112' ? 'WSOL' : 'USDC',
      },
      priceNative: bestPool.price?.quote?.toString() || '0',
      priceUsd: bestPool.price?.usd?.toString() || '0',
      txns: bestPool.txns ? {
        buys: bestPool.txns.buys || 0,
        sells: bestPool.txns.sells || 0,
      } : undefined,
      volume: bestPool.txns ? {
        '24h': bestPool.txns.volume24h || 0,
      } : undefined,
      priceChange: {
        '1h': (tokenData as any).events?.['1h']?.priceChangePercentage || 0,
        '24h': (tokenData as any).events?.['24h']?.priceChangePercentage || 0,
      },
      liquidity: {
        usd: bestPool.liquidity?.usd,
        quote: bestPool.liquidity?.quote,
      },
      marketCap: bestPool.marketCap?.usd,
      pairCreatedAt: bestPool.createdAt,
      info: {
        imageUrl: tokenInfo.image,
        websites,
        socials,
      },
      // Additional Solana Tracker specific data
      risk: (tokenData as any).risk,
      events: (tokenData as any).events,
      holders: (tokenData as any).holders,
    };
    
    tokenPairs.push(tokenPair);
  }
  
  return tokenPairs;
};

// Fetcher function for the Solana Tracker API
const fetcher = async (tokenAddresses: string[]): Promise<TokenPair[]> => {
  try {
    const response = await solanaTrackerAPI.getTokensMulti(tokenAddresses);
    console.log('🔍 [useTokenData] Solana Tracker raw response:', response);
    
    // Transform the response to TokenPair format
    const transformedData = transformSolanaTrackerData(response);
    console.log('🔍 [useTokenData] Transformed data:', transformedData);
    
    return transformedData;
  } catch (error) {
    console.error('🔍 [useTokenData] Error fetching token data:', error);
    throw error;
  }
};

// Main SWR hook for fetching token data
export const useTokenData = ({
  chainId = "solana",
  tokenAddresses,
  enabled = true,
}: UseTokenDataParams): UseTokenDataResponse => {
  // Convert tokenAddresses to array if it's a string
  const addressesArray = Array.isArray(tokenAddresses) 
    ? tokenAddresses 
    : [tokenAddresses];

  // Validate inputs
  const shouldFetch = enabled && chainId && addressesArray.length > 0;

  // Create a cache key for SWR
  const cacheKey = shouldFetch ? `solana-tracker-${addressesArray.join(',')}` : null;

  // Use SWR with the fetcher
  const { data, error, isLoading, isValidating, mutate } = useSWR<TokenPair[]>(
    cacheKey,
    () => fetcher(addressesArray),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute deduping to respect rate limits
      errorRetryCount: 3,
      errorRetryInterval: 5000, // 5 seconds between retries
    }
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  };
};

// Helper hook for single token
export const useSingleTokenData = (
  chainId: string,
  tokenAddress: string,
  enabled?: boolean
) => {
  return useTokenData({
    chainId,
    tokenAddresses: tokenAddress,
    enabled,
  });
};

// Helper hook for multiple tokens
export const useMultipleTokenData = (
  chainId: string,
  tokenAddresses: string[],
  enabled?: boolean
) => {
  return useTokenData({
    chainId,
    tokenAddresses,
    enabled,
  });
};

export default useTokenData;
