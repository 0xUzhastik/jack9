import { Metadata } from 'next';
import { ClientPageContent } from '@/components/ClientPageContent';

export const metadata: Metadata = {
  title: "Jackpot.zip - Play Now",
  description: "Join the thrilling jackpot.zip game and seize your chance to win amazing prizes!",
};

export default function Home() {
  return <ClientPageContent />;
}