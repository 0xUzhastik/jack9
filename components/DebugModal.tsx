"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { 
  Trash2, 
  TestTube, 
  Eye, 
  X, 
  Check, 
  Settings, 
  BarChart3, 
  Coins,
  Zap,
  Monitor
} from "lucide-react";
import { useDebugStore } from "@/stores/debugStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { toast } from "@/hooks/use-toast";
import { SAMPLE_WALLETS, TOKEN_SELECTOR_MODES } from "@/lib/tokenSelectorConstants";

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DebugModal({ isOpen, onClose }: DebugModalProps) {
  const { debugWalletAddress, setDebugWalletAddress, clearDebugWalletAddress } = useDebugStore();
  const { 
    tokenSelectorMode, 
    isProModeEnabled, 
    showAdvancedControls,
    autoSelectOptimalAmounts,
    setTokenSelectorMode,
    setProModeEnabled,
    setShowAdvancedControls,
    setAutoSelectOptimalAmounts
  } = useSettingsStore();
  
  const [inputAddress, setInputAddress] = useState(debugWalletAddress);

  const handleApplyDebugAddress = () => {
    const trimmedAddress = inputAddress.trim();
    
    if (!trimmedAddress) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Solana wallet address",
        variant: "destructive"
      });
      return;
    }

    // Basic validation - Solana addresses are typically 44 characters
    if (trimmedAddress.length < 32 || trimmedAddress.length > 44) {
      toast({
        title: "Invalid Address Format",
        description: "Solana addresses should be 32-44 characters long",
        variant: "destructive"
      });
      return;
    }

    setDebugWalletAddress(trimmedAddress);
    toast({
      title: "🔧 Debug Mode Activated",
      description: `Now using tokens from: ${trimmedAddress.slice(0, 8)}...${trimmedAddress.slice(-8)}`,
      duration: 4000
    });
    onClose();
  };

  const handleClearDebugAddress = () => {
    clearDebugWalletAddress();
    setInputAddress("");
    toast({
      title: "Debug Mode Disabled",
      description: "Switched back to your connected wallet",
      duration: 3000
    });
  };

  const handleUseSampleWallet = (address: string, name: string) => {
    setInputAddress(address);
    toast({
      title: "Sample Wallet Loaded",
      description: `Loaded ${name} address - click Apply to use it`,
      duration: 3000
    });
  };

  const handleProModeToggle = (enabled: boolean) => {
    setProModeEnabled(enabled);
    toast({
      title: enabled ? "🚀 Pro Mode Enabled" : "Pro Mode Disabled",
      description: enabled 
        ? "Switched to desktop token selector with advanced features"
        : "Switched back to visual chip selector",
      duration: 3000
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-3xl max-h-[80vh] overflow-y-auto border-4 border-[#FFD700] shadow-2xl"
        style={{
          background: 'linear-gradient(145deg, #4A0E4E, #2D0A30)',
          boxShadow: `
            0 0 40px rgba(255, 215, 0, 1),
            inset 0 2px 0 rgba(255, 215, 0, 0.3),
            inset 0 -2px 0 rgba(0, 0, 0, 0.3)
          `,
          borderRadius: '16px',
          zIndex: 9999
        }}
      >
        <DialogHeader className="border-b-2 border-[#FFD700] pb-4">
          <DialogTitle className="casino-text-gold font-black text-center text-xl flex items-center justify-center gap-2" 
                       style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
            <Settings className="h-5 w-5" />
            Settings & Debug Tools
            <Settings className="h-5 w-5" />
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6 space-y-6">
          {/* Token Selector Mode Section */}
          <div 
            className="p-4 rounded-xl border-2 border-[#FFD700]/60"
            style={{
              background: 'rgba(74, 14, 78, 0.5)',
              boxShadow: '0 0 10px rgba(255, 215, 0, 0.3)'
            }}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 casino-text-gold" />
                <h3 className="casino-text-gold font-black text-lg" 
                    style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                  Token Selector Mode
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TOKEN_SELECTOR_MODES.map((mode) => (
                  <motion.div
                    key={mode.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      tokenSelectorMode === mode.id
                        ? "border-[#FFD700] bg-[#FFD700]/20"
                        : "border-[#FFD700]/40 hover:border-[#FFD700]/80"
                    }`}
                    onClick={() => setTokenSelectorMode(mode.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{mode.icon}</div>
                      <div className="flex-1">
                        <div className="casino-text-gold font-bold" 
                             style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                          {mode.name}
                        </div>
                        <div className="text-xs casino-text-yellow">
                          {mode.description}
                        </div>
                      </div>
                      {tokenSelectorMode === mode.id && (
                        <Check className="h-5 w-5 casino-text-gold" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Pro Mode Settings */}
          <div 
            className="p-4 rounded-xl border-2 border-[#FFD700]/60"
            style={{
              background: 'rgba(74, 14, 78, 0.5)',
              boxShadow: '0 0 10px rgba(255, 215, 0, 0.3)'
            }}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 casino-text-gold" />
                <h3 className="casino-text-gold font-black text-lg" 
                    style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                  Pro Mode Features
                </h3>
              </div>
              
              <div className="space-y-4">
                {/* Pro Mode Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="casino-text-gold font-bold" 
                         style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                      Enable Pro Mode
                    </div>
                    <div className="text-xs casino-text-yellow">
                      Switch to desktop-style token selector with advanced features
                    </div>
                  </div>
                  <Switch
                    checked={isProModeEnabled}
                    onCheckedChange={handleProModeToggle}
                  />
                </div>

                {/* Advanced Controls Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="casino-text-gold font-bold" 
                         style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                      Show Advanced Controls
                    </div>
                    <div className="text-xs casino-text-yellow">
                      Show bulk selection and advanced filtering options
                    </div>
                  </div>
                  <Switch
                    checked={showAdvancedControls}
                    onCheckedChange={setShowAdvancedControls}
                    disabled={!isProModeEnabled}
                  />
                </div>

                {/* Auto-Select Optimal Amounts */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="casino-text-gold font-bold" 
                         style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                      Auto-Select Optimal Amounts
                    </div>
                    <div className="text-xs casino-text-yellow">
                      Automatically select 50% instead of 25% when adding tokens
                    </div>
                  </div>
                  <Switch
                    checked={autoSelectOptimalAmounts}
                    onCheckedChange={setAutoSelectOptimalAmounts}
                    disabled={!isProModeEnabled}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Debug Section */}
          <div 
            className="p-4 rounded-xl border-2 border-[#FFD700]/60"
            style={{
              background: 'rgba(74, 14, 78, 0.5)',
              boxShadow: '0 0 10px rgba(255, 215, 0, 0.3)'
            }}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TestTube className="h-5 w-5 casino-text-gold" />
                <h3 className="casino-text-gold font-black text-lg" 
                    style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                  Debug Tools
                </h3>
              </div>

              {/* Current Status */}
              <div className="text-center">
                {debugWalletAddress ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Eye className="h-4 w-4 casino-text-pink" />
                      <span className="casino-text-pink font-bold">Debug Mode Active</span>
                    </div>
                    <div className="text-xs casino-text-gold font-mono bg-black/40 p-2 rounded border border-[#FFD700]/30">
                      {debugWalletAddress.slice(0, 12)}...{debugWalletAddress.slice(-12)}
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={handleClearDebugAddress}
                        className="px-4 py-2 bg-[#FF1493] hover:bg-[#DC143C] text-white font-black border-2 border-[#FF1493] transition-all duration-200"
                        style={{ 
                          fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                          boxShadow: "0 0 8px rgba(255, 20, 147, 0.6)",
                          borderRadius: "8px"
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Disable Debug Mode
                      </Button>
                    </motion.div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span className="casino-text-gold font-bold">Normal Mode (Connected Wallet)</span>
                  </div>
                )}
              </div>

              {/* Manual Address Input */}
              <div className="space-y-3">
                <Label className="casino-text-gold font-bold" 
                       style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                  Debug Wallet Address
                </Label>
                <Input
                  placeholder="Paste any Solana wallet address here..."
                  value={inputAddress}
                  onChange={(e) => setInputAddress(e.target.value)}
                  className="casino-input font-mono text-sm"
                  style={{ 
                    fontFamily: "monospace",
                    background: 'var(--casino-dark-purple)',
                    border: '2px solid var(--casino-gold)',
                    color: 'var(--casino-gold)'
                  }}
                />
                <div className="flex gap-3">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1"
                  >
                    <Button
                      onClick={handleApplyDebugAddress}
                      disabled={!inputAddress.trim()}
                      className="w-full casino-button border-2 border-[#FFD700] font-black"
                      style={{ 
                        fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                        boxShadow: "0 0 12px rgba(255, 215, 0, 0.8)",
                        borderRadius: "8px"
                      }}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Apply Debug Address
                    </Button>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => setInputAddress("")}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-black border-2 border-gray-500"
                      style={{ 
                        fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                        boxShadow: "0 0 8px rgba(100, 100, 100, 0.6)",
                        borderRadius: "8px"
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Sample Wallets */}
              <div className="space-y-3">
                <Label className="casino-text-gold font-bold" 
                       style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                  Quick Test Wallets
                </Label>
                <div className="grid gap-2">
                  {SAMPLE_WALLETS.map((wallet, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-3 rounded-xl border-2 border-[#FFD700]/40 cursor-pointer hover:border-[#FFFF00] transition-all duration-200"
                      style={{
                        background: 'rgba(74, 14, 78, 0.3)',
                        boxShadow: '0 0 8px rgba(255, 215, 0, 0.3)'
                      }}
                      onClick={() => handleUseSampleWallet(wallet.address, wallet.name)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="casino-text-gold font-bold text-sm mb-1" 
                               style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                            {wallet.name}
                          </div>
                          <div className="text-xs casino-text-yellow mb-1">
                            {wallet.description}
                          </div>
                          <div className="text-xs casino-text-white font-mono bg-black/40 p-1 rounded border border-[#FFD700]/30">
                            {wallet.address.slice(0, 12)}...{wallet.address.slice(-12)}
                          </div>
                        </div>
                        <Eye className="h-4 w-4 casino-text-gold ml-3" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div 
            className="p-4 rounded-xl border-2 border-[#FFD700]/60"
            style={{
              background: 'rgba(74, 14, 78, 0.3)',
              boxShadow: '0 0 8px rgba(255, 215, 0, 0.3)'
            }}
          >
            <div className="casino-text-yellow font-bold mb-3 text-center" 
                 style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
              🔧 How to Use
            </div>
            <ul className="text-sm casino-text-gold space-y-2">
              <li>• <strong>Pro Mode:</strong> Toggle between visual chip stacks and desktop-style token selector</li>
              <li>• <strong>Debug Mode:</strong> View tokens from any Solana wallet for testing</li>
              <li>• <strong>Advanced Controls:</strong> Enable bulk selection and advanced filtering options</li>
              <li>• <strong>Settings persist</strong> across browser sessions</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}