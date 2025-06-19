"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { usePrivy } from '@privy-io/react-auth';

export function LogoutButton() {
  const { authenticated, logout } = usePrivy();

  if (!authenticated) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <Button
        onClick={logout}
        variant="outline"
        className="casino-box casino-box-gold px-4 py-3 border-2 border-[#FFD700] hover:border-[#FFFF00] hover:bg-[#FFD70015] transition-all duration-200 group shadow-lg"
        style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}
      >
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            <ArrowRight className="h-5 w-5 casino-text-gold rotate-180" />
          </motion.div>
          <span className="text-sm font-black casino-text-gold uppercase tracking-wider">
            Logout
          </span>
        </div>
      </Button>
    </motion.div>
  );
}