import { TokenRow } from "@/types/token";

export function createTokenSelectors(
  selectedTokens: TokenRow[],
  onSelectedTokensChange: (tokens: TokenRow[]) => void
) {
  const select = (token: TokenRow) => {
    onSelectedTokensChange([
      ...selectedTokens,
      { ...token, selectedAmount: token.amount * 0.5 },
    ]);
  };

  const remove = (mint: string) => {
    onSelectedTokensChange(selectedTokens.filter((t) => t.mint !== mint));
  };

  const update = (mint: string, amount: number) => {
    onSelectedTokensChange(
      selectedTokens.map((t) =>
        t.mint === mint ? { ...t, selectedAmount: amount } : t
      )
    );
  };

  const getAvailableTokens = (allTokens: TokenRow[]) => {
    return allTokens.filter(
      (t) => !selectedTokens.some((s) => s.mint === t.mint)
    );
  };

  return {
    select,
    remove,
    update,
    getAvailableTokens,
  };
}