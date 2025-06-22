export interface PastDraw {
  id: string;
  name: string;
  amount: number;
}

export interface Deposit {
  id: string;
  user: string;
  token?: string;
  tokens?: string[];
  amount: number;
  amountUSD: number;
  color: string;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string;
  gif?: string;
  messageSegments?: MessageSegment[];
}

export interface UserGifs {
  [key: string]: string[];
}

export interface MessageSegment {
  type: 'text' | 'emoji';
  content: string;
}