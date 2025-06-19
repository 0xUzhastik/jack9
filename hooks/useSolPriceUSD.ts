import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useSolPriceUSD() {
    const { data, error } = useSWR(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
        fetcher,
        { refreshInterval: 60000 } // Changed to 60 seconds to sync with token prices
    );

    return {
        price: data?.solana?.usd,
        isLoading: !error && !data,
        isError: error
    };
}