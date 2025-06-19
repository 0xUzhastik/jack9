"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAudioStore } from "@/stores/audioStore";

export function UnifiedAudioControl() {
  const { isMuted, volume, toggleMute, setVolume } = useAudioStore();
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [popupPosition, setPopupPosition] = useState<{top: number, left: number} | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculate popup position when showing
  useEffect(() => {
    if (showVolumeSlider && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopupPosition({
        top: rect.top - 10, // 10px above the button
        left: rect.left + rect.width / 2, // Center horizontally
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
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="casino-box casino-box-gold p-3 rounded-lg min-w-[140px] shadow-2xl pointer-events-auto volume-popup"
      style={{
        position: 'fixed',
        top: popupPosition.top,
        left: popupPosition.left,
        transform: 'translate(-50%, -100%)', // Center horizontally and position above
        zIndex: 999999, // Extremely high z-index to ensure it's above everything
      }}
    >
      <div className="flex items-center gap-2">
        <VolumeX className="h-3 w-3 casino-text-gold" />
        <Slider
          value={[volume * 100]}
          onValueChange={([value]) => setVolume(value / 100)}
          max={100}
          step={5}
          className="flex-1"
        />
        <Volume2 className="h-3 w-3 casino-text-gold" />
      </div>
      <div className="text-center mt-2">
        <span className="text-xs casino-text-gold font-bold">
          {Math.round(volume * 100)}%
        </span>
      </div>
      
      {/* Popup arrow pointing down */}
      <div 
        className="absolute top-full left-1/2 transform -translate-x-1/2"
        style={{
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid #FFD700',
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

      {/* Unified Mute/Volume Button */}
      <motion.div 
        whileHover={{ scale: 1.1 }} 
        whileTap={{ scale: 0.9 }}
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
            // Right click or long press opens volume slider
            if (e.type === 'contextmenu' || e.detail === 0) {
              setShowVolumeSlider(!showVolumeSlider);
            } else {
              // Regular click toggles mute
              toggleMute();
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowVolumeSlider(!showVolumeSlider);
          }}
          onMouseEnter={() => {
            // Show volume slider on hover after a small delay
            setTimeout(() => setShowVolumeSlider(true), 300);
          }}
          className={`p-3 rounded-full border-2 transition-all duration-300 ${
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
                  0 0 25px rgba(255, 20, 147, 0.8),
                  inset 0 2px 0 rgba(255, 255, 255, 0.3),
                  inset 0 -2px 0 rgba(0, 0, 0, 0.3)
                `
              : `
                  0 0 25px rgba(255, 215, 0, 0.8),
                  inset 0 2px 0 rgba(255, 255, 255, 0.3),
                  inset 0 -2px 0 rgba(0, 0, 0, 0.3)
                `
          }}
          title={`${isMuted ? 'Unmute' : 'Mute'} audio (hover for volume)`}
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
              <VolumeX className="h-4 w-4 text-white" />
            ) : (
              <Volume2 className="h-4 w-4 text-black" />
            )}
          </motion.div>
        </Button>
      </motion.div>
    </div>
  );
}