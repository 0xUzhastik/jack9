'use client';

import { WebSocketProvider } from '@/providers/WebSocketProvider';
import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { useRouter } from 'next/navigation';

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      // clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || ''}
      config={{
        // We only want to show wallet login options
        loginMethods: ['wallet'],
        // Customize the appearance of the Privy modal
        appearance: {
          theme: 'dark',
          accentColor: '#FFD700', // Casino Gold
          logo: 'https://your-logo-url/logo.png', // Optional: Add your app's logo
          walletList: ['phantom'], // Show Solana wallets first
          showWalletLoginFirst: true,
        },
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors(),
          },
        },
        // Configure the Solana cluster
        solanaClusters: [{ name: 'mainnet-beta', rpcUrl: process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.mainnet-beta.solana.com' }],
        // No need for embedded wallets in this dApp
        embeddedWallets: {
          createOnLogin: 'off'
        }
      }}
    // onSuccess={() => router.push('/')} // Or whichever page you want users on after login
    >
      <WebSocketProvider> {/* Wrap children with the WebSocketProvider */}
        {children}
      </WebSocketProvider>
    </PrivyProvider>
  );
}