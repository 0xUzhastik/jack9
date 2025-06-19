import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/Providers'; // Import the new Providers

const inter = Inter({ subsets: ['latin'] });

// ✅ Correct Next.js metadata export
export const metadata = {
  title: "Jackpot.zip",
  description: "Join the thrilling jackpot.zip game and seize your chance to win amazing prizes!",
  keywords: ["jackpot", "zip", "game", "win", "prizes", "solana"],
  authors: [{ name: "Jackpot.zip" }],
  openGraph: {
    title: "Jackpot.zip",
    description: "Join the thrilling jackpot.zip game and seize your chance to win amazing prizes!",
    url: "https://jackpotzip.xyz",
    type: "website",
    images: [
      {
        url: "https://jackpotzip.xyz/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Jackpot.zip Game"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    site: "@jackpotdotzip",
    title: "Jackpot.zip",
    description: "Join the thrilling jackpot.zip game and seize your chance to win amazing prizes!",
    image: "https://jackpotzip.xyz/twitter-image.jpg"
  }
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preload Visby Round font files */}
        <link rel="preload" href="/fonts/VisbyRoundCF-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/VisbyRoundCF-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/VisbyRoundCF-Heavy.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <Providers> {/* Use the new Privy-based Providers component */}
          {children}
        </Providers>
      </body>
    </html>
  );
}