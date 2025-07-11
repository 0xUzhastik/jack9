import { motion } from "framer-motion";

interface Deposit {
  id: string;
  user: string;
  token: string;
  amount: number;
  timestamp: Date;
}

interface ChartDataItem {
  value: number;
  color: string;
  deposit?: Deposit;
  isRemaining?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataItem;
  }>;
  solPriceUSD?: number;
}

export function CustomTooltip({ active, payload, solPriceUSD }: CustomTooltipProps) {
  if (!active || !payload || !payload[0]) return null;
  
  const data = payload[0].payload as ChartDataItem;
  
  if (data.isRemaining) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="casino-box casino-box-gold p-3 shadow-lg border-2 border-yellow-400 z-[99999] relative"
      >
        <div className="text-center">
          <p className="text-yellow-300 font-bold text-sm" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
            REMAINING CAPACITY
          </p>
          <p className="text-gold-400 text-lg font-black" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
            ${data.value.toFixed(0)}
          </p>
        </div>
      </motion.div>
    );
  }
  
  if (!data.deposit) return null;
  
  const timeAgo = Math.floor((Date.now() - data.deposit.timestamp.getTime()) / 1000);
  const timeString = timeAgo < 60 ? `${timeAgo}s ago` : 
                   timeAgo < 3600 ? `${Math.floor(timeAgo / 60)}m ago` : 
                   `${Math.floor(timeAgo / 3600)}h ago`;

  // Calculate USD value for SOL deposits
  let usdValue = data.deposit.amount;
  let showSolLine = false;
  // For SOL, always calculate USD value from amount * solPriceUSD
  if (data.deposit.token === 'SOL' && solPriceUSD) {
    usdValue = data.deposit.amount * solPriceUSD;
    showSolLine = true;
  } else if (data.deposit.token === 'SOL' && !solPriceUSD) {
    // If price not loaded, show 0
    usdValue = 0;
    showSolLine = true;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="casino-box casino-box-gold p-3 shadow-lg border-2 border-yellow-400 min-w-[200px] z-[99999] relative"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-yellow-300 font-bold text-xs uppercase" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
            Deposit
          </span>
          <span className="text-pink-400 font-bold text-xs" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
            {timeString}
          </span>
        </div>
        
        <div className="text-center border-t border-yellow-400/30 pt-2">
          {/* Always show USD value on top */}
          <p className="text-gold-400 text-xl font-black" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
            ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {/* For SOL, show SOL amount below. For tokens, show symbol. */}
          {showSolLine ? (
            <p className="text-yellow-300 text-sm font-bold" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
              {data.deposit.amount} SOL
            </p>
          ) : (
            <p className="text-yellow-300 text-sm font-bold" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
              {data.deposit.token}
            </p>
          )}
        </div>
        
        <div className="border-t border-yellow-400/30 pt-2">
          <p className="text-cyan-300 text-sm font-semibold" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
            {data.deposit.user}
          </p>
          <p className="text-gray-400 text-xs" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
            ID: {data.deposit.id.slice(0, 8)}...
          </p>
        </div>
      </div>
    </motion.div>
  );
}