import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AudioStore {
  // Audio state
  isMuted: boolean;
  volume: number;
  
  // Actions
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  playSound: (soundName: 'deposit' | 'userDeposit' | 'win') => void;
}

export const useAudioStore = create<AudioStore>()(
  devtools(
    persist(
      (set, get) => {
        // Audio references - initialized once
        const audioRefs: { [key: string]: HTMLAudioElement } = {};
        
        // Initialize audio elements
        if (typeof window !== 'undefined') {
          audioRefs.deposit = new Audio('/audio/deposit.wav');
          audioRefs.userDeposit = new Audio('/audio/userDeposit.wav');
          audioRefs.win = new Audio('/audio/win.wav');
          
          Object.values(audioRefs).forEach(audio => {
            audio.preload = 'auto';
          });
        }
        
        // Update audio volumes when state changes
        const updateAudioVolumes = (isMuted: boolean, volume: number) => {
          Object.values(audioRefs).forEach(audio => {
            audio.volume = isMuted ? 0 : volume;
          });
        };
        
        return {
          // Initial state
          isMuted: false,
          volume: 0.7,
          
          // Actions
          toggleMute: () => {
            set((state) => {
              const newMuted = !state.isMuted;
              updateAudioVolumes(newMuted, state.volume);
              return { isMuted: newMuted };
            }, false, 'toggleMute');
          },
          
          setVolume: (volume) => {
            const clampedVolume = Math.max(0, Math.min(1, volume));
            set((state) => {
              updateAudioVolumes(state.isMuted, clampedVolume);
              return { volume: clampedVolume };
            }, false, 'setVolume');
          },
          
          playSound: (soundName) => {
            const state = get();
            if (state.isMuted) return;
            
            const audio = audioRefs[soundName];
            if (audio) {
              audio.currentTime = 0;
              audio.play().catch(error => {
                console.warn('Audio play failed:', error);
              });
            }
          },
        };
      },
      {
        name: 'audio-store',
        partialize: (state) => ({
          isMuted: state.isMuted,
          volume: state.volume,
        }),
      }
    ),
    { name: 'audio-store' }
  )
);