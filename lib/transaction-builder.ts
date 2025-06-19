import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
} from '@solana/spl-token';

interface TokenRow {
  mint: string;
  amount: number;
  decimals: number;
  symbol: string;
  name: string;
  image: string;
  selected?: boolean;
  selectedAmount?: number;
}

export async function buildDepositTransaction(
  selectedTokens: TokenRow[],
  walletAddress: string,
  jackpotAddress: string,
  connection: Connection
): Promise<Transaction> {
  if (!walletAddress) throw new Error('Wallet not connected');
  
  const publicKey = new PublicKey(walletAddress);
  const tx = new Transaction();

  for (const token of selectedTokens) {
    const amount = token.selectedAmount ?? 0;
    if (amount <= 0) continue;

    if (token.mint === 'So11111111111111111111111111111111111111112') {
      // SOL transfer
      tx.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(jackpotAddress),
          lamports: Math.round(amount * LAMPORTS_PER_SOL),
        }),
      );
    } else {
      // SPL Token transfer
      const mint = new PublicKey(token.mint);
      const fromAta = getAssociatedTokenAddressSync(mint, publicKey);
      const toAta = getAssociatedTokenAddressSync(mint, new PublicKey(jackpotAddress), true);
      
      // Create destination ATA if it doesn't exist
      if (!(await connection.getAccountInfo(toAta))) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            toAta,
            new PublicKey(jackpotAddress),
            mint,
          ),
        );
      }
      
      // Add transfer instruction
      tx.add(
        createTransferInstruction(
          fromAta,
          toAta,
          publicKey,
          BigInt(Math.round(amount * 10 ** token.decimals)),
        ),
      );
    }
  }

  // Set transaction metadata
  tx.feePayer = publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  
  return tx;
}