import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Button } from '@/shared/components/ui/button';
import { Currency } from '@/shared/components/Currency';
import { Skeleton } from '@/shared/components/Skeleton';
import { formatDate } from '@/shared/utils/formatters';
import { useTransactions } from '../hooks/useTransactions';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export default function Transactions() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useTransactions(page);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.transactions.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Transactions</h1>
        <p className="text-muted-foreground">No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Transactions</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Coin</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Price/Coin</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.transactions.map((tx) => (
            <TableRow key={tx.transaction_id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {tx.transaction_type === 'BUY' ? (
                    <ArrowDownCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <ArrowUpCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={tx.transaction_type === 'BUY' ? 'text-green-600' : 'text-red-600'}>
                    {tx.transaction_type}
                  </span>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                <div>
                  <div>{tx.coin_name}</div>
                  <div className="text-sm text-muted-foreground">{tx.symbol}</div>
                </div>
              </TableCell>
              <TableCell className="text-right">{tx.quantity}</TableCell>
              <TableCell className="text-right">
                <Currency value={tx.price_per_coin} />
              </TableCell>
              <TableCell className="text-right">
                <Currency value={tx.total_amount} />
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {formatDate(tx.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center mt-6">
        <p className="text-sm text-muted-foreground">
          Page {data.pagination.currentPage} of {data.pagination.totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= data.pagination.totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
