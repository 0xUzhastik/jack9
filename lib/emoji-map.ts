// Map of emoji shortcodes to GIF URLs
export const emojiMap: Record<string, string> = {
  // Japanese
  "jap": "http://www.mysmiley.net/imgs/smile/japanese/jap.gif",
  
  // Party
  "party": "http://www.mysmiley.net/imgs/smile/party/party0011.gif",
  "party2": "http://www.mysmiley.net/imgs/smile/party/party0014.gif",
  
  // Cool
  "cool": "http://www.mysmiley.net/imgs/smile/cool/cool0012.gif",
  "cool2": "http://www.mysmiley.net/imgs/smile/cool/cool0044.gif",
  
  // Fighting
  "fight": "http://www.mysmiley.net/imgs/smile/fighting/fighting0004.gif",
  
  // Evil grin
  "evil": "http://www.mysmiley.net/imgs/smile/evilgrin/evilgrin0002.gif",
  
  // Happy
  "happy": "http://www.mysmiley.net/imgs/smile/happy/happy0071.gif",
  "happy2": "http://www.mysmiley.net/imgs/smile/happy/happy0126.gif",
  
  // Love
  "love": "http://www.mysmiley.net/imgs/smile/love/love0042.gif",
};

// Reverse lookup map for getting shortcodes from URLs
const reverseEmojiMap: Record<string, string> = {};
Object.entries(emojiMap).forEach(([code, url]) => {
  reverseEmojiMap[url] = code;
});

// Helper function to find emoji code by URL
export function getEmojiCodeByUrl(url: string): string | null {
  const code = reverseEmojiMap[url];
  return code ? `:${code}:` : null;
}

export interface MessageSegment {
  type: 'text' | 'emoji';
  content: string;
}

// Helper function to parse message into segments of text and emojis
export function parseMessageWithEmojis(text: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  const shortcodeRegex = /:([a-z0-9]+):/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = shortcodeRegex.exec(text)) !== null) {
    // Add text before the emoji
    const beforeText = text.substring(lastIndex, match.index);
    if (beforeText) {
      segments.push({ type: 'text', content: beforeText });
    }
    
    // Add the emoji if it exists in our map
    const emojiCode = match[1];
    const emojiUrl = emojiMap[emojiCode];
    if (emojiUrl) {
      segments.push({ type: 'emoji', content: emojiUrl });
    } else {
      // If emoji code doesn't exist, treat it as text
      segments.push({ type: 'text', content: match[0] });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  const remainingText = text.substring(lastIndex);
  if (remainingText) {
    segments.push({ type: 'text', content: remainingText });
  }
  
  return segments;
}

// For backward compatibility
export function replaceShortcodes(text: string): { text: string, gifs: string[] } {
  const shortcodeRegex = /:([a-z0-9]+):/g;
  const foundGifs: string[] = [];
  
  // Replace shortcodes with empty strings and collect the GIFs
  const cleanText = text.replace(shortcodeRegex, (match, code) => {
    const gifUrl = emojiMap[code];
    if (gifUrl) {
      foundGifs.push(gifUrl);
      return "";
    }
    return match; // Keep the text if no match found
  });
  
  return {
    text: cleanText.trim(),
    gifs: foundGifs
  };
}