import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Currency } from '@/shared/components/Currency';
import { PercentChange } from '@/shared/components/PercentChange';
import { Skeleton } from '@/shared/components/Skeleton';
import { usePortfolio } from '../hooks/usePortfolio';

export default function Portfolio() {
  const { data: portfolio, isLoading } = usePortfolio();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!portfolio || portfolio.holdings.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Portfolio</h1>
        <p className="text-muted-foreground">You don't have any holdings yet.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Portfolio</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Value</p>
          <p className="text-2xl font-bold">
            <Currency value={portfolio.total_value} />
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Invested</p>
          <p className="text-2xl font-bold">
            <Currency value={portfolio.total_invested} />
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Profit/Loss</p>
          <p className="text-2xl font-bold">
            <Currency value={portfolio.total_profit_loss} />
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">P/L %</p>
          <p className="text-2xl font-bold">
            <PercentChange value={portfolio.total_profit_loss_percentage} />
          </p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Coin</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Avg Buy Price</TableHead>
            <TableHead className="text-right">Current Price</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead className="text-right">P/L</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {portfolio.holdings.map((holding) => (
            <TableRow key={holding.coin_id}>
              <TableCell className="font-medium">
                <div>
                  <div>{holding.coin_name}</div>
                  <div className="text-sm text-muted-foreground">{holding.symbol}</div>
                </div>
              </TableCell>
              <TableCell className="text-right">{holding.quantity}</TableCell>
              <TableCell className="text-right">
                <Currency value={holding.avg_buy_price} />
              </TableCell>
              <TableCell className="text-right">
                <Currency value={holding.current_price} />
              </TableCell>
              <TableCell className="text-right">
                <Currency value={holding.total_value} />
              </TableCell>
              <TableCell className="text-right">
                <div>
                  <Currency value={holding.profit_loss} />
                  <div className="text-sm">
                    <PercentChange value={holding.profit_loss_percentage} />
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
