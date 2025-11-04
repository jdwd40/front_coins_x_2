import { useState } from 'react';
import { useMarketHistory } from '../hooks/useMarketHistory';
import { MarketChart } from '../components/MarketChart';
import { TimeRangeSelector } from '../components/TimeRangeSelector';
import { MarketStatusPill } from '../components/MarketStatusPill';
import { Skeleton } from '@/shared/components/Skeleton';
import type { TimeRange } from '../schemas';

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30M');
  const { data, isLoading } = useMarketHistory(timeRange);

  // Get latest market trend from data
  const latestTrend = data && data.history.length > 0 
    ? data.history[data.history.length - 1]?.market_trend 
    : null;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Market Dashboard</h1>
          {latestTrend && (
            <div className="mt-2">
              <MarketStatusPill trend={latestTrend} />
            </div>
          )}
        </div>
        <TimeRangeSelector selected={timeRange} onSelect={setTimeRange} />
      </div>

      <div className="border rounded-lg p-6">
        {isLoading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : data && data.history.length > 0 ? (
          <MarketChart data={data.history} />
        ) : (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No market data available
          </div>
        )}
      </div>
    </div>
  );
}
