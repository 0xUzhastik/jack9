export interface Deposit {
  id: string;
  user: string;
  token: string;
  amount: number;
  timestamp: Date;
}

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

export interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string;
  gif?: string;
  messageSegments?: MessageSegment[];
}

export interface MessageSegment {
  type: 'text' | 'emoji';
  content: string;
}