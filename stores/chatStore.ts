import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface MessageSegment {
  type: 'text' | 'emoji';
  content: string;
}

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string;
  gif?: string;
  messageSegments?: MessageSegment[];
}

interface ChatStore {
  // Chat state
  messages: ChatMessage[];
  newMessage: string;
  isEmojiPickerOpen: boolean;
  
  // Actions
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setNewMessage: (message: string) => void;
  setIsEmojiPickerOpen: (open: boolean) => void;
  clearNewMessage: () => void;
}

export const useChatStore = create<ChatStore>()(
  devtools(
    (set) => ({
      // Initial state
      messages: [],
      newMessage: "",
      isEmojiPickerOpen: false,
      
      // Actions
      addMessage: (message) => {
        set((state) => ({
          messages: [...state.messages.slice(-19), message] // Keep only last 20 messages
        }), false, 'addMessage');
      },
      
      setMessages: (messages) => {
        set({ messages }, false, 'setMessages');
      },
      
      setNewMessage: (newMessage) => {
        set({ newMessage }, false, 'setNewMessage');
      },
      
      setIsEmojiPickerOpen: (isEmojiPickerOpen) => {
        set({ isEmojiPickerOpen }, false, 'setIsEmojiPickerOpen');
      },
      
      clearNewMessage: () => {
        set({ newMessage: "" }, false, 'clearNewMessage');
      },
    }),
    { name: 'chat-store' }
  )
);