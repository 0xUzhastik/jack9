"use client";
import { motion } from "framer-motion";
import Image from "next/image";

export function Header() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6,
        ease: "easeOut",
        delay: 0.2
      }}
      whileHover={{ rotate: [0, 10, -10, 10, -10, 0], transition: { duration: 0.5 } }}
      className="flex justify-center items-end relative"
    >
      <Image
        src="/jackpotlogo.png"
        alt="JACKPOT"
        width={120}
        height={36}
        className="object-contain drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] relative"
        priority
      />
    </motion.div>
  );
}


export function HeaderAbsolute() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6,
        ease: "easeOut",
        delay: 0.2
      }}
      whileHover={{ rotate: [0, 10, -10, 10, -10, 0], transition: { duration: 0.5 } }}
      className="flex justify-center items-center absolute inset-0 z-0"
    >
      <Image
        src="/jackpotlogo.png"
        alt="JACKPOT"
        width={120}
        height={36}
        className="object-contain drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]"
        priority
      />
    </motion.div>
  );
}
