// Constants and types for token selector components

export interface TokenSelectorMode {
  id: 'chip' | 'desktop';
  name: string;
  description: string;
  icon: string;
}

export const TOKEN_SELECTOR_MODES: TokenSelectorMode[] = [
  {
    id: 'chip',
    name: 'Chip View',
    description: 'Visual chip stacks with 3D representation',
    icon: '🎰'
  },
  {
    id: 'desktop',
    name: 'Pro Mode',
    description: 'Compact desktop-style token selector',
    icon: '💼'
  }
];

// Quick percentage options for token selection
export const QUICK_PERCENTAGES = [0, 25, 50, 75, 100];

// Sample wallet addresses for testing
export const SAMPLE_WALLETS = [
  {
    name: "Rich Whale 🐋",
    address: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
    description: "Jupiter Labs wallet with many tokens"
  },
  {
    name: "DeFi Trader 📈", 
    address: "DyMJhkmE7VTvn8RTPAQ8SBDjJV7Y9UX8pGYMDPuq8CUP",
    description: "Active trader with diverse portfolio"
  },
  {
    name: "NFT Collector 🎨",
    address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", 
    description: "Heavy NFT and token holder"
  }
];