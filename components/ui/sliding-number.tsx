import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SlidingNumberProps {
  value: number;
}

export function SlidingNumber({ value }: SlidingNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);
  
  // Format number with commas
  const formattedNumber = displayValue.toLocaleString();
  
  return (
    <span className="relative inline-flex">
      <AnimatePresence mode="popLayout">
        {formattedNumber.split("").map((digit, index) => (
          <motion.span
            key={index + digit}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="relative inline-block"
          >
            {digit}
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
}