"use client";

import { useEffect } from "react";
import { usePrivy } from '@privy-io/react-auth';
import { SunburstBackground } from "./SunburstBackground";
import { FloatingTokens } from "./FloatingTokens";
import { DesktopLayout } from "./layouts/DesktopLayout";
import { MobileLayout } from "./layouts/MobileLayout";
import { DepositBar } from "./DepositBar";
import { chatMessages } from "@/lib/mock-data";
import { useUIStore } from "@/stores/uiStore";
import { useGameStore } from "@/stores/gameStore";
import { useTokenStore } from "@/stores/tokenStore";
import { useChatStore } from "@/stores/chatStore";

export function ClientPageContent() {
  // Zustand stores
  const { isMobile, setIsMobile } = useUIStore();
  const { currentRoundDeposits, totalAmount } = useGameStore();
  const { selectedTokens, delayedExpandToken, clearDelayedExpand } = useTokenStore();
  const { setMessages } = useChatStore();

  // Initialize chat messages
  useEffect(() => {
    setMessages(chatMessages);
  }, [setMessages]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  return (
    <main className="h-screen w-screen relative overflow-hidden">
      {/* Background */}
      <SunburstBackground />
      <FloatingTokens />

      {/* Layout based on screen size */}
      {isMobile ? (
        <MobileLayout />
      ) : (
        <DesktopLayout />
      )}

      {/* Deposit Bar - Only show on mobile */}
      {isMobile && <DepositBar selectedTokens={selectedTokens} />}
    </main>
  );
}