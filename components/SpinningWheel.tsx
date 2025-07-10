import { motion } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CustomTooltip } from './CustomTooltip';

interface SpinningWheelProps {
  chartData: any[];
  chartDims: { inner: number; outer: number };
  isSpinning: boolean;
  finalSpinAngle: number;
  shouldReset?: boolean;
}

export function SpinningWheel({
  chartData,
  chartDims,
  isSpinning,
  finalSpinAngle,
  shouldReset = false,
}: SpinningWheelProps) {
  return (
    <div className="relative w-full h-full z-5">
      {/* Main spinning wheel container */}
      <motion.div
        className="w-full h-full"
        animate={{ rotate: shouldReset ? 0 : finalSpinAngle }}
        transition={{
          duration: isSpinning ? 6.5 : shouldReset ? 0.5 : 0,
          ease: isSpinning ? [0.25, 0.1, 0.25, 1] : 'easeOut',
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <filter
                id="dropShadow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feDropShadow
                  dx="0"
                  dy="4"
                  stdDeviation="6"
                  floodColor="#000000"
                  floodOpacity="0.3"
                />
              </filter>

              <filter id="wheelGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              startAngle={90}
              endAngle={450}
              innerRadius={chartDims.inner}
              outerRadius={chartDims.outer}
              paddingAngle={0} // 🔥 REMOVED: No gaps between sections
              dataKey="value"
              stroke="none" // 🔥 REMOVED: No borders between sections
              strokeWidth={0} // 🔥 REMOVED: No border width
              isAnimationActive={true} // 🔥 ALWAYS enable animations
              animationBegin={0}
              animationDuration={1200} // 🔥 Longer, smoother animation
              animationEasing="ease-in-out"
              filter={isSpinning ? 'url(#wheelGlow)' : 'url(#dropShadow)'}
            >
              {chartData.map((slice, i) => {
                // 🔥 CRITICAL: Use stable keys from our data structure
                const stableKey = slice.key || (slice.isRemaining ? 'remaining-capacity' : `slice-${i}`);
                
                return (
                  <Cell
                    key={stableKey} // 🔥 This is the magic - stable keys!
                    fill={slice.color}
                    style={{
                      cursor: 'pointer',
                      opacity: isSpinning ? 0.9 : 1,
                      transition: 'opacity 0.3s ease',
                    }}
                  />
                );
              })}
            </Pie>

            {!isSpinning && <Tooltip content={<CustomTooltip />} />}
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Pointer - positioned at the top */}
      <div 
        className="absolute left-1/2 transform -translate-x-1/2 z-30 pointer-events-none"
        style={{ top: '-15px' }}
      >
        <motion.div
          animate={{
            scale: isSpinning ? [1, 1.1, 1] : 1,
            y: isSpinning ? [0, 2, 0] : 0
          }}
          transition={{
            duration: isSpinning ? 0.8 : 0,
            repeat: isSpinning ? Infinity : 0,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
          className="relative flex flex-col items-center"
        >
          {/* Pointer triangle */}
          <div 
            className="relative"
            style={{
              width: 0,
              height: 0,
              borderLeft: '16px solid transparent',
              borderRight: '16px solid transparent',
              borderTop: '28px solid #FFD700',
              filter: `
                drop-shadow(0 0 12px rgba(255, 215, 0, 1))
                drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))
                drop-shadow(0 3px 6px rgba(0, 0, 0, 0.6))
              `,
            }}
          >
            {/* Inner highlight */}
            <div
              className="absolute top-1 left-1/2 transform -translate-x-1/2"
              style={{
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '12px solid #FFFF00',
              }}
            />
          </div>
          
          {/* Pointer base */}
          <div 
            className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 rounded-full border-3"
            style={{
              width: '24px',
              height: '24px',
              backgroundColor: '#FFD700',
              borderColor: '#FFFF00',
              boxShadow: `
                0 0 15px rgba(255, 215, 0, 1),
                inset 0 2px 0 rgba(255, 255, 255, 0.4),
                inset 0 -2px 0 rgba(0, 0, 0, 0.3)
              `,
            }}
          >
            {/* Center dot */}
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: '6px',
                height: '6px',
                backgroundColor: '#000000',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Glowing ring during spinning - properly positioned */}
      {isSpinning && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <motion.div
            className="rounded-full"
            style={{
              width: `${chartDims.outer * 2 + 20}px`,
              height: `${chartDims.outer * 2 + 20}px`,
              border: '3px solid rgba(255, 215, 0, 0.6)',
              boxShadow: `
                0 0 30px rgba(255, 215, 0, 0.8),
                inset 0 0 30px rgba(255, 215, 0, 0.3)
              `,
            }}
            animate={{ 
              opacity: [0.3, 0.8, 0.3], 
              scale: [0.98, 1.02, 0.98] 
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
          />
        </div>
      )}
    </div>
  );
}