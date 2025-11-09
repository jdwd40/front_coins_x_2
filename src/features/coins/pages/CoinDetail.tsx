import { useParams } from 'react-router-dom';
import { useCoin } from '../hooks/useCoins';
import { AdminPriceUpdate } from '../components/AdminPriceUpdate';
import { CoinPriceChart } from '../components/CoinPriceChart';
import { Currency } from '@/shared/components/Currency';
import { PercentChange } from '@/shared/components/PercentChange';
import { Skeleton } from '@/shared/components/Skeleton';

export default function CoinDetail() {
  const { id } = useParams<{ id: string }>();
  const coinId = parseInt(id || '0', 10);

  const { data: coin, isLoading: coinLoading } = useCoin(coinId);

  if (coinLoading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!coin) {
    return <div className="container mx-auto py-8">Coin not found</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-4xl font-bold">{coin.name}</h1>
          <p className="text-xl text-muted-foreground">{coin.symbol}</p>
        </div>
        <AdminPriceUpdate coinId={coin.coin_id} currentPrice={coin.current_price} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Current Price</p>
          <p className="text-2xl font-bold">
            <Currency value={coin.current_price} />
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">24h Change</p>
          <p className="text-2xl font-bold">
            <PercentChange value={coin.price_change_24h} />
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Market Cap</p>
          <p className="text-2xl font-bold">
            <Currency value={coin.market_cap} />
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Circulating Supply</p>
          <p className="text-2xl font-bold">{coin.circulating_supply.toLocaleString()}</p>
        </div>
      </div>

      <CoinPriceChart
        coinId={coin.coin_id}
        coinName={coin.name}
      />

      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Details</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-muted-foreground">Founder</dt>
            <dd className="font-medium">{coin.founder}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
