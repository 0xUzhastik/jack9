export interface TokenRow {
    mint: string;
    amount: number;
    decimals: number;
    symbol: string;
    name: string;
    image: string;
    selected?: boolean;
    selectedAmount?: number;
  }
  
  export interface JupiterBalance {
    amount: string;
    uiAmount: number;
    slot: number;
    isFrozen: boolean;
  }
  
  export interface JupiterBalanceResponse {
    [mintAddress: string]: JupiterBalance;
  }
  
  export interface TokenMetadata {
    symbol: string;
    name: string;
    image: string;
  }
  
  export interface HeliusAsset {
    id: string;
    token_info?: { symbol?: string; decimals?: number };
    content?: {
      metadata?: { name?: string; symbol?: string };
      links?: { image?: string };
      files?: Array<{ cdn_uri?: string; uri?: string }>;
    };
  }
  
  export interface TokenSelectorProps {
    selectedTokens: TokenRow[];
    onSelectedTokensChange: (tokens: TokenRow[]) => void;
    delayedExpandToken?: string | null;
    onClearDelayedExpand?: () => void;
  }