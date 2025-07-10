"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Volume1 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAudioStore } from "@/stores/audioStore";

export function UnifiedAudioControl() {
  const { isMuted, volume, toggleMute, setVolume } = useAudioStore();
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [popupPosition, setPopupPosition] = useState<{top: number, left: number, appearsAbove: boolean} | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculate popup position when showing
  useEffect(() => {
    if (showVolumeSlider && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Calculate initial position
      let top = rect.bottom + 10; // 10px below the button
      let left = rect.left + rect.width / 2; // Center horizontally
      let appearsAbove = false;
      
      // Check if menu would go off the bottom of the viewport
      const menuHeight = 120; // Approximate height of the menu
      if (top + menuHeight > viewportHeight) {
        // Position above the button instead
        top = rect.top - menuHeight - 10;
        appearsAbove = true;
      }
      
      // Check if menu would go off the sides
      const menuWidth = 160; // Approximate width of the menu
      if (left - menuWidth / 2 < 0) {
        left = menuWidth / 2;
      } else if (left + menuWidth / 2 > viewportWidth) {
        left = viewportWidth - menuWidth / 2;
      }
      
      setPopupPosition({
        top,
        left,
        appearsAbove,
      });
    } else {
      setPopupPosition(null);
    }
  }, [showVolumeSlider]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showVolumeSlider && 
        buttonRef.current && 
        !buttonRef.current.contains(e.target as Node)
      ) {
        // Check if the click is inside the popup
        const popupElements = document.querySelectorAll('.volume-popup');
        let clickedInside = false;
        
        popupElements.forEach(popup => {
          if (popup.contains(e.target as Node)) {
            clickedInside = true;
          }
        });
        
        if (!clickedInside) {
          setShowVolumeSlider(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVolumeSlider]);

  // Volume slider popup content
  const volumePopup = showVolumeSlider && popupPosition && (
    <motion.div
      initial={{ opacity: 0, y: popupPosition.appearsAbove ? 20 : -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: popupPosition.appearsAbove ? 20 : -20, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="casino-box casino-box-gold p-3 rounded-lg min-w-[160px] shadow-2xl pointer-events-auto volume-popup"
      style={{
        position: 'fixed',
        top: popupPosition.top,
        left: popupPosition.left,
        transform: 'translate(-50%, 0)', // Center horizontally and position below
        zIndex: 999999, // Extremely high z-index to ensure it's above everything
      }}
    >
      {/* Mute/Unmute Toggle Button */}
      <div className="mb-3">
        <Button
          onClick={toggleMute}
          className={`w-full py-2 px-4 rounded-full transition-all duration-200 border-2 flex items-center justify-center gap-2 shadow-md text-base font-bold ${
            isMuted 
              ? 'border-[#FF1493] casino-box-pink' 
              : 'border-[#FFD700] casino-box-gold'
          }`}
          style={{
            background: isMuted 
              ? 'linear-gradient(145deg, #FF1493, #DC143C)' 
              : 'linear-gradient(145deg, #FFD700, #DAA520)',
            boxShadow: isMuted 
              ? `
                  0 0 15px rgba(255, 20, 147, 0.6),
                  0 2px 8px rgba(0,0,0,0.15),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.3)
                `
              : `
                  0 0 15px rgba(255, 215, 0, 0.6),
                  0 2px 8px rgba(0,0,0,0.15),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.3)
                `
          }}
        >
          {isMuted ? (
            <>
              <VolumeX className="h-4 w-4 text-white" />
              <span className="text-white">Unmute</span>
            </>
          ) : (
            <>
              <Volume1 className="h-4 w-4 text-black" />
              <span className="text-black">Mute</span>
            </>
          )}
        </Button>
      </div>

      {/* Volume Slider */}
      <div className="flex items-center gap-2">
        <VolumeX className="h-3 w-3 casino-text-gold" />
        <div className="flex-1 relative flex items-center" style={{height: 24}}>
          {/* Custom track background */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-3 rounded-full bg-[#2d193a] opacity-60 z-0" />
          {/* Custom progress bar */}
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-3 rounded-full bg-gradient-to-r from-[#FFD700] to-[#DAA520] z-10 transition-all duration-200"
            style={{ width: `${volume * 100}%` }}
          />
          {/* Native slider (transparent track, only thumb visible) */}
          <Slider
            value={[volume * 100]}
            onValueChange={([value]) => setVolume(value / 100)}
            max={100}
            step={5}
            className="w-full relative z-20 bg-transparent"
            style={{ background: 'transparent' }}
          />
        </div>
        <Volume2 className="h-3 w-3 casino-text-gold" />
      </div>
      <div className="text-center mt-2">
        <span className="text-xs casino-text-gold font-bold">
          {Math.round(volume * 100)}%
        </span>
      </div>
      
      {/* Popup arrow - dynamically positioned */}
      <div 
        className={`absolute left-1/2 transform -translate-x-1/2 ${
          popupPosition.appearsAbove ? 'top-full' : 'bottom-full'
        }`}
        style={{
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          [popupPosition.appearsAbove ? 'borderTop' : 'borderBottom']: '8px solid #FFD700',
        }}
      />
    </motion.div>
  );

  return (
    <div>
      {/* Portal the popup to document body */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {volumePopup}
        </AnimatePresence>,
        document.body
      )}

      {/* Unified Audio Control Button */}
      <motion.div 
        whileHover={{ scale: 1.05 }} 
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: isMuted 
            ? '0 0 20px rgba(255, 20, 147, 0.8)' 
            : '0 0 20px rgba(255, 215, 0, 0.8)'
        }}
      >
        <Button
          ref={buttonRef}
          onClick={(e) => {
            e.preventDefault();
            // Click opens the volume menu
            setShowVolumeSlider(!showVolumeSlider);
          }}
          className="casino-box casino-box-gold p-3 rounded-xl border-2 border-[#FFD700] hover:border-[#FFFF00] transition-all duration-200"
          style={{
            background: 'linear-gradient(145deg, #4A0E4E, #2D0A30)',
            boxShadow: `
              0 0 15px rgba(255, 215, 0, 0.6),
              inset 0 1px 0 rgba(255, 215, 0, 0.3),
              inset 0 -1px 0 rgba(0, 0, 0, 0.3)
            `
          }}
        >
          <motion.div
            animate={{
              rotate: isMuted ? [0, -10, 10, 0] : 0,
              scale: isMuted ? [1, 1.1, 1] : 1
            }}
            transition={{
              duration: 0.5,
              repeat: isMuted ? Infinity : 0,
              repeatDelay: 1
            }}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 casino-text-gold" />
            ) : (
              <Volume2 className="h-4 w-4 casino-text-gold" />
            )}
          </motion.div>
        </Button>
      </motion.div>
    </div>
  );
}