"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CenterColumn } from "../CenterColumn";
import { LeftColumn } from "../LeftColumn";
import { ChatSection } from "../ChatSection";
import { useUIStore } from "@/stores/uiStore";

export function MobileLayout() {
  const { activeTab, setActiveTab } = useUIStore();

  return (
    <div className="w-full h-full flex flex-col">
      {/* Game Section - Always visible (50vh) */}
      <div className="h-[50vh] p-2">
        <CenterColumn />
      </div>

      {/* Tab Navigation - Clean rounded corners without top indicator */}
      <div className="bg-gradient-to-r from-[#4A0E4E] to-[#2D0A30] border-t-2 border-[#FFD700] border-b-2 border-[#FFD700] flex-shrink-0 rounded-t-xl">
        <div className="flex">
          {[
            { key: 'deposits', label: 'Current Round' },
            { key: 'chat', label: 'Chat' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-3 px-4 text-center transition-all duration-200 relative ${
                activeTab === tab.key
                  ? 'bg-[#FFD700] text-black'
                  : 'text-[#FFD700] bg-[#FFD70020] hover:bg-[#FFD70030]'
              } ${tab.key === 'deposits' ? 'rounded-tl-xl' : ''} ${tab.key === 'chat' ? 'rounded-tr-xl' : ''}`}
              style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}
            >
              {/* Tab label */}
              <div className={`text-sm font-black uppercase tracking-wider ${
                activeTab === tab.key ? 'text-black' : 'text-[#FFD700]'
              }`}>
                {tab.label}
              </div>
              
              {/* Bottom border indicator only - preserves rounded corners */}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeTabBottom"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-[#FFFF00]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Unified Blurred Background Container - Extends to bottom edge */}
      <div className="h-[calc(50vh-4rem)] overflow-hidden">
        <div 
          className="h-full w-full bg-gradient-to-b from-[#4A0E4E]/60 to-[#2D0A30]/60 overflow-hidden"
          style={{ backdropFilter: 'blur(10px)' }}
        >
          <AnimatePresence mode="wait">
            {activeTab === 'deposits' && (
              <motion.div
                key="deposits"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="h-full p-4"
              >
                <LeftColumn isMobile={true} />
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full p-4"
              >
                <ChatSection isMobile={true} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}