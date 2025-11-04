import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Currency } from '@/shared/components/Currency';
import { PercentChange } from '@/shared/components/PercentChange';
import { Skeleton } from '@/shared/components/Skeleton';
import { useCoins, usePrefetchCoin } from '../hooks/useCoins';

export default function CoinsList() {
  const { data: coins, isLoading } = useCoins();
  const prefetchCoin = usePrefetchCoin();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Cryptocurrencies</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">24h Change</TableHead>
            <TableHead className="text-right">Market Cap</TableHead>
            <TableHead className="text-right">Supply</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coins?.map((coin) => (
            <TableRow
              key={coin.coin_id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/coins/${coin.coin_id}`)}
              onMouseEnter={() => prefetchCoin(coin.coin_id)}
            >
              <TableCell className="font-medium">
                <div>
                  <div>{coin.name}</div>
                  <div className="text-sm text-muted-foreground">{coin.symbol}</div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Currency value={coin.current_price} />
              </TableCell>
              <TableCell className="text-right">
                <PercentChange value={coin.price_change_24h} />
              </TableCell>
              <TableCell className="text-right">
                <Currency value={coin.market_cap} />
              </TableCell>
              <TableCell className="text-right">
                {coin.circulating_supply.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
