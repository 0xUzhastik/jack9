import useSWR from 'swr';

// TypeScript interfaces for the API response
interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
}

interface Website {
  url: string;
}

interface Social {
  platform: string;
  handle: string;
}

interface TokenPairInfo {
  imageUrl?: string;
  websites?: Website[];
  socials?: Social[];
}

interface Liquidity {
  usd?: number;
  base?: number;
  quote?: number;
}

interface TransactionData {
  buys: number;
  sells: number;
}

interface Boosts {
  active?: number;
}

interface TokenPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  labels?: string[];
  baseToken: TokenInfo;
  quoteToken: TokenInfo;
  priceNative: string;
  priceUsd: string;
  txns?: Record<string, TransactionData>;
  volume?: Record<string, number>;
  priceChange?: Record<string, number>;
  liquidity?: Liquidity;
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: TokenPairInfo;
  boosts?: Boosts;
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

// Fetcher function for the DexScreener API
const fetcher = async (url: string): Promise<TokenPair[]> => {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

// Main SWR hook for fetching token data
export const useTokenData = ({
  chainId = "solana",
  tokenAddresses,
  enabled = true,
}: UseTokenDataParams): UseTokenDataResponse => {
  // Convert tokenAddresses to comma-separated string if it's an array
  const addressesString = Array.isArray(tokenAddresses) 
    ? tokenAddresses.join(',') 
    : tokenAddresses;

  // Validate inputs
  const shouldFetch = enabled && chainId && addressesString;

  // Build the API URL
  const url = shouldFetch 
    ? `https://api.dexscreener.com/tokens/v1/${chainId}/${addressesString}`
    : null;

  // Use SWR with the fetcher
  const { data, error, isLoading, isValidating, mutate } = useSWR<TokenPair[]>(
    url,
    fetcher,
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
