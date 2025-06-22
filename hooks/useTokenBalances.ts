"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from 'swr';

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_HELIUS_RPC ?? "";

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

interface JupiterBalance {
  amount: string;
  uiAmount: number;
  slot: number;
  isFrozen: boolean;
}

interface JupiterBalanceResponse {
  [mintAddress: string]: JupiterBalance;
}

interface TokenMetadata {
  symbol: string;
  name: string;
  image: string;
}

interface HeliusAsset {
  id: string;
  token_info?: { symbol?: string; decimals?: number };
  content?: {
    metadata?: { name?: string; symbol?: string };
    links?: { image?: string };
    files?: Array<{ cdn_uri?: string; uri?: string }>;
  };
}

// DexScreener types
interface DexScreenerTokenInfo {
  address: string;
  name: string;
  symbol: string;
}

interface DexScreenerTokenPairInfo {
  imageUrl?: string;
  websites?: Array<{ url: string }>;
  socials?: Array<{ platform: string; handle: string }>;
}

interface DexScreenerTokenPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: DexScreenerTokenInfo;
  quoteToken: DexScreenerTokenInfo;
  info?: DexScreenerTokenPairInfo;
}

function getTokenDecimals(mint: string): number {
  const map: Record<string, number> = {
    So11111111111111111111111111111111111111112: 9,
    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 6,
    Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: 6,
  };
  return map[mint] ?? 6;
}

// 🔥 MEMOIZED: Cache to prevent excessive API calls
const dexScreenerCache = new Map<string, DexScreenerTokenPair[]>();
const cacheExpiry = new Map<string, number>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fetch DexScreener data for tokens with caching
async function fetchDexScreenerData(mints: string[]): Promise<Record<string, DexScreenerTokenPair[]>> {
  if (!mints.length) return {};
  
  // Check cache first
  const cacheKey = mints.sort().join(',');
  const now = Date.now();
  const cachedExpiry = cacheExpiry.get(cacheKey);
  
  if (cachedExpiry && now < cachedExpiry && dexScreenerCache.has(cacheKey)) {
    console.log('📦 Using cached DexScreener data for', mints.length, 'tokens');
    const cachedData = dexScreenerCache.get(cacheKey);
    if (cachedData) {
      // Convert array back to grouped format
      const groupedData: Record<string, DexScreenerTokenPair[]> = {};
      cachedData.forEach(pair => {
        const mint = pair.baseToken.address;
        if (!groupedData[mint]) {
          groupedData[mint] = [];
        }
        groupedData[mint].push(pair);
      });
      return groupedData;
    }
  }
  
  try {
    const addressesString = mints.join(',');
    console.log('🔍 Fetching fresh DexScreener data for', mints.length, 'tokens...');
    
    const response = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${addressesString}`, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      console.warn('DexScreener API request failed:', response.status, response.statusText);
      return {};
    }
    
    const data: DexScreenerTokenPair[] = await response.json();
    
    // Cache the results
    dexScreenerCache.set(cacheKey, data);
    cacheExpiry.set(cacheKey, now + CACHE_DURATION);
    
    // Group pairs by base token address
    const groupedData: Record<string, DexScreenerTokenPair[]> = {};
    data.forEach(pair => {
      const mint = pair.baseToken.address;
      if (!groupedData[mint]) {
        groupedData[mint] = [];
      }
      groupedData[mint].push(pair);
    });
    
    console.log('✅ DexScreener data cached for', Object.keys(groupedData).length, 'tokens');
    return groupedData;
  } catch (error) {
    console.warn('Failed to fetch DexScreener data:', error);
    return {};
  }
}

// Extract best metadata from DexScreener data
function extractDexScreenerMetadata(pairs: DexScreenerTokenPair[]): Partial<TokenMetadata> {
  if (!pairs.length) return {};
  
  // Use the first pair with the most complete info
  const bestPair = pairs.find(p => p.info?.imageUrl && p.baseToken.symbol && p.baseToken.name) || pairs[0];
  
  return {
    symbol: bestPair.baseToken.symbol,
    name: bestPair.baseToken.name,
    image: bestPair.info?.imageUrl,
  };
}

// Extract metadata from Helius asset (fallback)
function extractHeliusMetadata(asset: HeliusAsset): TokenMetadata {
  const symbol = 
    asset.token_info?.symbol ||
    asset.content?.metadata?.symbol ||
    asset.id.slice(0, 4);

  const name = 
    asset.content?.metadata?.name ||
    symbol;

  const image = 
    asset.content?.links?.image ||
    asset.content?.files?.[0]?.cdn_uri ||
    asset.content?.files?.[0]?.uri ||
    "/solana-logo.png";

  return { symbol, name, image };
}

// 🔥 MEMOIZED: RPC metadata cache
const rpcMetadataCache = new Map<string, TokenMetadata>();
const rpcCacheExpiry = new Map<string, number>();

// SWR fetcher for balances
const fetchBalances = async (publicKey: string) => {
  if (!publicKey) return [];

  // 1️⃣ Fetch balances from Jupiter API
  const balanceRes = await fetch(
    `https://lite-api.jup.ag/ultra/v1/balances/${publicKey}`
  );
  if (!balanceRes.ok) throw new Error("Failed to fetch balances");
  const balances: JupiterBalanceResponse = await balanceRes.json();

  const nonZero = Object.entries(balances).filter(
    ([, b]) => b.uiAmount > 0
  );
  if (!nonZero.length) {
    return [];
  }

  // 2️⃣ Get non-SOL mints for metadata fetching
  const mints = nonZero
    .filter(([m]) => m !== "SOL")
    .map(([m]) => m);

  // 3️⃣ First try DexScreener for metadata (with caching)
  const dexScreenerData = await fetchDexScreenerData(mints);

  // 4️⃣ Build initial metadata map from DexScreener
  const metadataMap: Record<string, TokenMetadata> = {};
  const mintsNeedingRpcData: string[] = [];

  mints.forEach(mint => {
    const dexPairs = dexScreenerData[mint];
    if (dexPairs && dexPairs.length > 0) {
      const dexMetadata = extractDexScreenerMetadata(dexPairs);
      // Only use DexScreener data if we have at least symbol and image
      if (dexMetadata.symbol && dexMetadata.image) {
        metadataMap[mint] = {
          symbol: dexMetadata.symbol,
          name: dexMetadata.name || dexMetadata.symbol,
          image: dexMetadata.image,
        };
      } else {
        // Partial data, still need RPC fallback
        mintsNeedingRpcData.push(mint);
        if (dexMetadata.symbol || dexMetadata.name) {
          // Store partial data and we'll fill in missing pieces from RPC
          metadataMap[mint] = {
            symbol: dexMetadata.symbol || mint.slice(0, 4),
            name: dexMetadata.name || dexMetadata.symbol || mint.slice(0, 4),
            image: "/solana-logo.png", // Will be overridden by RPC if available
          };
        }
      }
    } else {
      // No DexScreener data, need RPC
      mintsNeedingRpcData.push(mint);
    }
  });

  // 5️⃣ Fetch missing metadata from Helius RPC (fallback) with caching
  if (RPC_ENDPOINT && mintsNeedingRpcData.length > 0) {
    // Check RPC cache first
    const now = Date.now();
    const uncachedMints: string[] = [];

    mintsNeedingRpcData.forEach(mint => {
      const cacheExpiry = rpcCacheExpiry.get(mint);
      if (cacheExpiry && now < cacheExpiry && rpcMetadataCache.has(mint)) {
        // Use cached data
        const cachedMetadata = rpcMetadataCache.get(mint)!;
        const existingMetadata = metadataMap[mint];

        if (existingMetadata) {
          // Merge with existing DexScreener data
          metadataMap[mint] = {
            symbol: existingMetadata.symbol || cachedMetadata.symbol,
            name: existingMetadata.name || cachedMetadata.name,
            image: existingMetadata.image !== "/solana-logo.png" 
              ? existingMetadata.image 
              : cachedMetadata.image,
          };
        } else {
          metadataMap[mint] = cachedMetadata;
        }
      } else {
        uncachedMints.push(mint);
      }
    });

    // Only fetch uncached mints
    if (uncachedMints.length > 0) {
      const chunks = Array.from(
        { length: Math.ceil(uncachedMints.length / 100) },
        (_, i) => uncachedMints.slice(i * 100, i * 100 + 100)
      );

      await Promise.all(
        chunks.map(async (ids) => {
          try {
            const body = {
              jsonrpc: "2.0",
              id: "asset-batch",
              method: "getAssetBatch",
              params: { ids },
            };
            const res = await fetch(RPC_ENDPOINT, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            const { result } = await res.json();
            result?.forEach((asset: HeliusAsset) => {
              if (asset) {
                const heliusMetadata = extractHeliusMetadata(asset);

                // Cache the metadata
                rpcMetadataCache.set(asset.id, heliusMetadata);
                rpcCacheExpiry.set(asset.id, Date.now() + CACHE_DURATION);

                const existingMetadata = metadataMap[asset.id];

                if (existingMetadata) {
                  // Merge with existing DexScreener data, prioritizing DexScreener image
                  metadataMap[asset.id] = {
                    symbol: existingMetadata.symbol || heliusMetadata.symbol,
                    name: existingMetadata.name || heliusMetadata.name,
                    image: existingMetadata.image !== "/solana-logo.png" 
                      ? existingMetadata.image 
                      : heliusMetadata.image,
                  };
                } else {
                  // Use RPC data as complete fallback
                  metadataMap[asset.id] = heliusMetadata;
                }
              }
            });
          } catch (chunkError) {
            console.warn('Failed to fetch RPC metadata chunk:', chunkError);
          }
        })
      );
    }
  }

  // 6️⃣ Build final token array
  const rows: TokenRow[] = nonZero.map(([mint, bal]) => {
    if (mint === "SOL") {
      return {
        mint: "So11111111111111111111111111111111111111112",
        amount: bal.uiAmount,
        decimals: 9,
        symbol: "SOL",
        name: "Solana",
        image: "https://solana.com/src/img/branding/solanaLogoMark.png",
      };
    }

    const metadata = metadataMap[mint] || {
      symbol: mint.slice(0, 4),
      name: mint.slice(0, 8),
      image: "/solana-logo.png",
    };

    return {
      mint,
      amount: bal.uiAmount,
      decimals: getTokenDecimals(mint),
      ...metadata,
    };
  });

  // Sort by amount (highest first)
  rows.sort((a, b) => b.amount - a.amount);

  return rows;
};

export function useTokenBalances(publicKey: string | undefined) {
  const stablePublicKey = useMemo(() => publicKey, [publicKey]);
  const { data: tokens = [], error, isLoading, mutate } = useSWR(
    stablePublicKey ? ['tokenBalances', stablePublicKey] : null,
    () => fetchBalances(stablePublicKey!),
    { revalidateOnFocus: false }
  );
  return { tokens, loading: isLoading, error, mutate };
}