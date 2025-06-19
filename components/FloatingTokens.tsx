"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Token {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  symbol: string;
  rotation: number;
  glow: string;
}

export function FloatingTokens() {
  const [tokens, setTokens] = useState<Token[]>([]);
  
  useEffect(() => {
    const tokensArray: Token[] = [];
    const symbols = ["$", "★", "♦", "♠", "♥", "♣", "777"];
    const glowColors = ["#FFD700", "#FF8C00", "#FF1493", "#FFFF00"];
    
    for (let i = 0; i < 12; i++) {
      tokensArray.push({
        id: i,
        x: Math.random() * 100,
        y: -20 - Math.random() * 100,
        size: 20 + Math.random() * 25,
        speed: 25 + Math.random() * 50,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        rotation: Math.floor(Math.random() * 360),
        glow: glowColors[Math.floor(Math.random() * glowColors.length)]
      });
    }
    
    setTokens(tokensArray);
  }, []);
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {tokens.map((token) => (
        <motion.div
          key={token.id}
          className="absolute font-bold"
          style={{
            fontSize: token.size,
            left: `${token.x}%`,
            color: token.glow,
            fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
            fontWeight: 700,
            textShadow: `
              2px 2px 0 #000000,
              -1px -1px 0 #000000,
              1px -1px 0 #000000,
              -1px 1px 0 #000000,
              0 0 10px ${token.glow},
              0 0 20px ${token.glow}
            `,
            filter: `drop-shadow(0 0 5px ${token.glow})`,
          }}
          initial={{ 
            y: token.y + "vh",
            rotate: token.rotation
          }}
          animate={{ 
            y: "120vh",
            rotate: [token.rotation, token.rotation + 60, token.rotation - 60, token.rotation]
          }}
          transition={{ 
            duration: token.speed,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
            times: [0, 0.25, 0.75, 1]
          }}
        >
          {token.symbol}
        </motion.div>
      ))}
    </div>
  );
}