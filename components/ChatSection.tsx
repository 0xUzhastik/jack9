"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { useWebSocketChat } from "@/hooks/useWsChat";
import { EmojiPicker } from "@/components/EmojiPicker";
import { parseMessageWithEmojis, getEmojiCodeByUrl } from "@/lib/emoji-map";
import { ArrowRightIcon, Star } from "lucide-react";
import { usePrivy } from '@privy-io/react-auth';
import { WalletConnect } from './WalletConnect';
import { useChatStore } from "@/stores/chatStore";

interface ChatSectionProps {
  isMobile?: boolean;
}

// Helper function to format wallet address
const formatWalletAddress = (address: string) => {
  if (address && address.length > 20) {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }
  return address;
};

export function ChatSection({ isMobile = false }: ChatSectionProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { authenticated, user } = usePrivy();

  const { send } = useWebSocketChat();
  
  const {
    messages,
    newMessage,
    isEmojiPickerOpen,
    addMessage,
    setNewMessage,
    setIsEmojiPickerOpen,
    clearNewMessage
  } = useChatStore();

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const messageSegments = parseMessageWithEmojis(newMessage);
    const displayName = user?.wallet?.address ? formatWalletAddress(user.wallet.address) : "You";
    
    const userMessage = {
      id: Date.now().toString(),
      user: displayName,
      message: newMessage,
      messageSegments,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    addMessage(userMessage);

    if (authenticated) send(newMessage);
    
    clearNewMessage();
    setIsEmojiPickerOpen(false);
    setTimeout(scrollToBottom, 100);
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(newMessage + emoji);
  };

  if (isMobile) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <ScrollArea 
            className="rounded-lg p-1 min-w-0 h-full" 
            ref={scrollAreaRef}
          >
            <div className="space-y-0 min-w-0">
              {messages.map((message, index) => (
                <motion.div 
                  key={message.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative min-w-0"
                >
                  <div className="text-white min-w-0 overflow-hidden px-2 py-1 mb-1">
                    <span className="font-black casino-text-yellow text-sm" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>{message.user}: </span>
                    {message.messageSegments ? (
                      message.messageSegments.map((segment, i) => (
                        segment.type === 'text' ? (
                          <span key={i} className="casino-text-gold break-words text-sm">{segment.content}</span>
                        ) : (
                          <img 
                            key={i}
                            src={segment.content} 
                            alt="emoji" 
                            className="inline-block mx-1"
                            style={{ height: "1.2em", verticalAlign: "middle" }}
                            title={getEmojiCodeByUrl(segment.content) || "emoji"}
                          />
                        )
                      ))
                    ) : (
                      <>
                        <span className="casino-text-gold break-words text-sm">{message.message}</span>
                        {message.gif && (
                          <img 
                            src={message.gif} 
                            alt="emoji" 
                            className="inline-block mx-1"
                            style={{ height: "1.2em", verticalAlign: "middle" }}
                            title={getEmojiCodeByUrl(message.gif) || "emoji"}
                          />
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>
        
        {authenticated ? (
          <div className="flex-shrink-0 p-2 pb-8 border-t border-[#FFD700]/40 min-w-0 relative">
            <form onSubmit={handleSend} className="w-full flex items-center gap-2 min-w-0 relative">
              <div className="flex-shrink-0 relative">
                <EmojiPicker 
                  onEmojiSelect={handleEmojiSelect} 
                  isOpen={isEmojiPickerOpen}
                  setIsOpen={setIsEmojiPickerOpen}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="casino-input pr-10 text-sm min-w-0"
                  />
                  <Button 
                    type="submit" 
                    className="absolute right-0 top-0 bottom-0 casino-button font-black rounded-r-md border-l-2 border-[#2D0A30] flex items-center justify-center px-2"
                    style={{ borderRadius: "0 6px 6px 0" }}
                  >
                    <ArrowRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-slate-400">
            Please&nbsp;<WalletConnect />&nbsp;to chat.
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="casino-box casino-box-gold overflow-hidden p-0 h-full flex flex-col relative">
      <div className="absolute top-2 left-2 z-10">
        <Star className="h-4 w-4 casino-star" fill="currentColor" />
      </div>
      <div className="absolute top-2 right-2 z-10">
        <Star className="h-4 w-4 casino-star" fill="currentColor" />
      </div>
      
      <CardContent className="p-4 h-full flex flex-col min-w-0 overflow-hidden">
        <h2 className="text-xl font-black uppercase text-center tracking-wide mb-4 casino-text-gold flex-shrink-0" 
            style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
          Chat
        </h2>
        
        <div className="flex-1 min-h-0 overflow-y-auto">
          <ScrollArea 
            className="rounded-lg p-3 min-w-0" 
            ref={scrollAreaRef}
          >
            <div className="space-y-2 min-w-0">
              {messages.map((message, index) => (
                <motion.div 
                  key={message.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative min-w-0"
                >
                  <div className="text-white min-w-0 overflow-hidden">
                    <span className="font-black casino-text-yellow text-sm" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>{message.user}: </span>
                    {message.messageSegments ? (
                      message.messageSegments.map((segment, i) => (
                        segment.type === 'text' ? (
                          <span key={i} className="casino-text-gold break-words text-sm">{segment.content}</span>
                        ) : (
                          <img 
                            key={i}
                            src={segment.content} 
                            alt="emoji" 
                            className="inline-block mx-1"
                            style={{ height: "1.2em", verticalAlign: "middle" }}
                            title={getEmojiCodeByUrl(segment.content) || "emoji"}
                          />
                        )
                      ))
                    ) : (
                      <>
                        <span className="casino-text-gold break-words text-sm">{message.message}</span>
                        {message.gif && (
                          <img 
                            src={message.gif} 
                            alt="emoji" 
                            className="inline-block mx-1"
                            style={{ height: "1.2em", verticalAlign: "middle" }}
                            title={getEmojiCodeByUrl(message.gif) || "emoji"}
                          />
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
      
      <CardFooter className="flex-shrink-0 p-3 border-t border-[#FFD700] min-w-0 relative">
        {authenticated ? (
          <form onSubmit={handleSend} className="w-full flex items-center gap-2 min-w-0 relative">
            <div className="flex-shrink-0 relative">
              <EmojiPicker 
                onEmojiSelect={handleEmojiSelect} 
                isOpen={isEmojiPickerOpen}
                setIsOpen={setIsEmojiPickerOpen}
              />
              {isEmojiPickerOpen && (
                <div className="absolute bottom-full left-0 mb-2 z-50">
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="casino-input pr-10 text-sm min-w-0"
                />
                <Button 
                  type="submit" 
                  className="absolute right-0 top-0 bottom-0 casino-button font-black rounded-r-md border-l-2 border-[#2D0A30] flex items-center justify-center px-2"
                  style={{ borderRadius: "0 6px 6px 0" }}
                >
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        ) : null}
      </CardFooter>
    </Card>
  );
}