const SOLANA_TRACKER_BASE_URL = 'https://data.solanatracker.io';

// Individual token metrics structure
export interface TokenMetrics {
  holding: number;
  held: number;
  sold: number;
  sold_usd?: number;
  realized: number;
  unrealized: number;
  total: number;
  total_sold: number;
  total_invested: number;
  average_buy_amount: number;
  current_value: number;
  cost_basis: number;
  first_buy_time?: number;
  last_buy_time?: number;
  last_sell_time?: number;
  last_trade_time?: number;
  buy_transactions?: number;
  sell_transactions?: number;
  total_transactions?: number;
}

// Change data for historic comparison
export interface TokenChange {
  totalDiff: number;
  realizedDiff: number;
  unrealizedDiff: number;
  valueDiff: number;
  holdingDiff: number;
  percentageChange: number;
}

// Token data with historic timeframes
export interface TokenData {
  current: TokenMetrics;
  '1d'?: {
    metrics: TokenMetrics;
    change: TokenChange | null;
  };
  '7d'?: {
    metrics: TokenMetrics;
    change: TokenChange | null;
  };
  '30d'?: {
    metrics: TokenMetrics;
    change: TokenChange | null;
  };
}

// New tokens data structure
export interface NewTokensData {
  tokens: Record<string, {
    first_buy_amount: number;
    first_buy_value: number;
    current_value: number;
    realized: number;
    unrealized: number;
    total: number;
  }>;
  count: number;
  total_invested: number;
  total_current_value: number;
  total_pnl: number;
  pnl_percentage: number;
}

// Summary data for a timeframe
export interface TimeframeSummary {
  totalPnL: number;
  realizedChange: number;
  unrealizedChange: number;
  totalChange: number;
  percentageChange: number;
  wins: number;
  losses: number;
  winPercentage: number;
  lossPercentage: number;
  newTokens: NewTokensData;
}

export interface SolanaTrackerPnLResponse {
  tokens: Record<string, TokenData>;
  summary?: {
    pnl_since?: number;
  };
  historic?: {
    summary: {
      '1d'?: TimeframeSummary;
      '7d'?: TimeframeSummary;
      '30d'?: TimeframeSummary;
    };
  };
  pnl_since?: number;
}

// Multi-token API response interfaces
export interface TokenInfo {
  name: string;
  symbol: string;
  mint: string;
  uri: string;
  decimals: number;
  description?: string;
  image?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
}

export interface MultiTokenResponse {
  data?: Record<string, {
    token: TokenInfo;
    pools?: any[];
    events?: any;
    risk?: any;
  }>;
  tokens?: Record<string, {
    token: TokenInfo;
    pools?: any[];
    events?: any;
    risk?: any;
  }>;
  // Allow for direct token access as well
  [key: string]: any;
}

export class SolanaTrackerAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = SOLANA_TRACKER_BASE_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json'
    };
    console.log("headers:", headers, url);
    const response = await fetch(url, {
      headers
    });

    if (!response.ok) {
      throw new Error(`Solana Tracker API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getPnL(
    wallet: string,
    options: {
      showHistoricPnL?: boolean;
      holdingCheck?: boolean;
      hideDetails?: boolean;
    } = {}
  ): Promise<SolanaTrackerPnLResponse> {
    const params = new URLSearchParams();
    if (options.showHistoricPnL) params.append('showHistoricPnL', 'true');
    if (options.holdingCheck) params.append('holdingCheck', 'true');
    if (options.hideDetails) params.append('hideDetails', 'true');

    const queryString = params.toString();
    const endpoint = `/pnl/${wallet}${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest<SolanaTrackerPnLResponse>(endpoint);
  }

  async getTokenPnL(wallet: string, token: string): Promise<TokenMetrics> {
    const endpoint = `/pnl/${wallet}/${token}`;
    return this.makeRequest<TokenMetrics>(endpoint);
  }

  async getTokensMulti(tokens: string[]): Promise<MultiTokenResponse> {
    const url = `${this.baseUrl}/tokens/multi`;
    const headers = {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json'
    };

    console.log("🔍 [getTokensMulti] Request URL:", url);
    console.log("🔍 [getTokensMulti] Request headers:", headers);
    console.log("🔍 [getTokensMulti] Request body:", JSON.stringify({ tokens }));

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tokens })
    });

    console.log("🔍 [getTokensMulti] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("🔍 [getTokensMulti] Error response:", errorText);
      throw new Error(`Solana Tracker Multi-Token API error: ${response.status} ${response.statusText}`);
    }

    const jsonResponse = await response.json();
    console.log("🔍 [getTokensMulti] Raw JSON response:", JSON.stringify(jsonResponse, null, 2));

    return jsonResponse;
  }
}

// Export a default instance that can be configured
export const solanaTrackerAPI = new SolanaTrackerAPI(
  process.env.SOLANA_TRACKER_API_KEY || '08b739ec-5077-4d0c-beb4-57806f3da540'
);
