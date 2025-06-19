import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut } from 'lucide-react';

export function WalletConnect() {
  const { login, authenticated, logout, user } = usePrivy();

  const handleClick = () => {
    if (authenticated) {
      logout();
    } else {
      login();
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <Button
      onClick={handleClick}
      className="relative group overflow-hidden px-8 py-4 rounded-xl font-black uppercase tracking-wider text-black text-lg shadow-2xl border-3 border-[#FFD700] hover:scale-105 transition-all duration-300 ease-out"
      style={{
        background: 'linear-gradient(145deg, #FFD700, #FFA500)',
        fontFamily: 'Visby Round CF, SF Pro Display, sans-serif',
        fontWeight: 900,
        letterSpacing: '1.2px',
        boxShadow: '0 8px 32px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        borderWidth: '3px',
        borderColor: '#FFD700',
        minHeight: '60px',
        minWidth: '280px'
      }}
    >
      {/* Animated background gradient on hover */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-[#FFD700] via-[#FFFF00] to-[#FFD700] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(45deg, #FFD700, #FFFF00, #FFD700, #FFFF00)',
          backgroundSize: '400% 400%',
          animation: 'gradient 3s ease infinite'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center gap-3">
        {authenticated ? (
          <>
            <LogOut className="h-6 w-6" />
            <div className="flex flex-col items-center leading-tight">
              <span className="text-sm">Connected</span>
              <span className="text-xs font-bold opacity-80">
                {user?.wallet?.address ? formatAddress(user.wallet.address) : 'Wallet'}
              </span>
            </div>
          </>
        ) : (
          <>
            <Wallet className="h-6 w-6" />
            <span>Connect Wallet to Play</span>
          </>
        )}
      </div>

      {/* Shine effect */}
      <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:left-[100%] transition-all duration-700 ease-out" />
      
      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </Button>
  );
}