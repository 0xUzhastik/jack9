// hooks/useWebSocketChat.ts
"use client";
import { useEffect } from "react";
import { useChatStore } from "@/stores/chatStore";
import { socketBus } from "@/lib/socketBus";
import { parseMessageWithEmojis } from "@/lib/emoji-map";
import { usePrivy } from '@privy-io/react-auth';

// Helper function to check if a string is a wallet address and truncate it
const formatUsername = (username: string) => {
  // Check if it looks like a wallet address (long alphanumeric string)
  if (username && username.length > 20 && /^[A-Za-z0-9]+$/.test(username)) {
    return `${username.slice(0, 4)}...${username.slice(-4)}`;
  }
  return username;
};

export function useWebSocketChat() {
  const { addMessage, setMessages } = useChatStore();
  const { user } = usePrivy();
  
  // Get the active wallet address
  const walletAddress = user?.wallet?.address;

  /* history once on first WS open */
  useEffect(() => {
    const fetchHistory = async () => {
      const h = await fetch('https://webhooks-production-2e4f.up.railway.app/chat/history').then(r => r.json());
      console.log({h});
      setMessages(
        h.map((d: any) => ({
          id: d._id ?? String(d.ts),
          user: formatUsername(d.username),
          message: d.text,
          timestamp: new Date(d.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          messageSegments: parseMessageWithEmojis(d.text),
        }))
      );
    };

    fetchHistory();

    // socketBus.on("open", fetchHistory);
    // return () => socketBus.off("open", fetchHistory);
  }, [setMessages]);

  /* incoming live messages */
  useEffect(() => {
    const handler = (d: any) =>
      addMessage({
        id: d._id ?? String(d.ts),
        user: formatUsername(d.username),
        message: d.text,
        timestamp: new Date(d.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        messageSegments: parseMessageWithEmojis(d.text),
      });

    socketBus.on("chat_message", handler);
    return () => socketBus.off("chat_message", handler);
  }, [addMessage]);

  return {
    send: (text: string) =>
      socketBus.send("chat_send", { 
        user: walletAddress, 
        text, 
        address: walletAddress 
      }),
  };
}