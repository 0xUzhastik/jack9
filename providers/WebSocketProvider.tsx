// components/WebSocketProvider.tsx
"use client";

import { useWebSocketGameEvents } from "@/hooks/useWebsocketGameEvents";

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  // This hook will run once and manage the WebSocket connection for the entire app
  useWebSocketGameEvents();
  
  return <>{children}</>;
}