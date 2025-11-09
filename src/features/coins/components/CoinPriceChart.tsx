import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCoinHistoryWithRange } from '../hooks/useCoinHistoryWithRange';
import { TimeRangeSelector } from '@/shared/components/TimeRangeSelector';
import { Skeleton } from '@/shared/components/Skeleton';
import { formatCurrency } from '@/shared/utils/formatters';
import type { TimeRange, PriceHistoryPoint } from '@/shared/types/chart';

// Time range limits for display in error messages
const TIME_RANGE_LIMITS: Record<TimeRange, number> = {
  '10M': 10,
  '30M': 30,
  '1H': 60,
  '2H': 120,
  '12H': 720,
  '24H': 1440,
  'ALL': 5000,
};

interface Props {
  coinId: number;
  coinName: string;
}

// X-axis formatter based on time range
function getXAxisFormatter(timeRange: TimeRange) {
  return (timestamp: number | string) => {
    // Handle both numeric (milliseconds) and string timestamps
    const date = typeof timestamp === 'number' 
      ? new Date(timestamp) 
      : new Date(timestamp);

    switch (timeRange) {
      case '10M':
      case '30M':
        // Show time with minutes (HH:MM)
        return date.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        });
      case '1H':
      case '2H':
        // Show time (HH:MM)
        return date.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        });
      case '12H':
      case '24H':
        // Show time (HH:MM) - may span multiple days
        return date.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        });
      case 'ALL':
        // Show date with day (DD/MM/YY or DD MMM)
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
        });
      default:
        return date.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        });
    }
  };
}

// Calculate appropriate tick interval based on time range and data span
function getXAxisTickInterval(timeRange: TimeRange, dataLength: number): number | undefined {
  // For very short ranges, show more ticks
  // For longer ranges, show fewer ticks
  // Recharts will auto-calculate if undefined, but we can guide it
  
  if (dataLength === 0) return undefined;
  
  // Target: show 5-8 ticks for readability
  const targetTicks = 6;
  const interval = Math.max(1, Math.floor(dataLength / targetTicks));
  
  switch (timeRange) {
    case '10M':
      return Math.max(1, Math.floor(interval / 2)); // More ticks for short range
    case '30M':
      return Math.max(1, Math.floor(interval / 1.5));
    case '1H':
    case '2H':
      return interval;
    case '12H':
    case '24H':
      return Math.max(1, Math.floor(interval * 1.5)); // Fewer ticks for longer range
    case 'ALL':
      return Math.max(1, Math.floor(interval * 2)); // Even fewer for all time
    default:
      return interval;
  }
}

// Calculate Y-axis domain with padding for better visualization
function getYAxisDomain(data: PriceHistoryPoint[]): [number, number] {
  if (!data || data.length === 0) {
    return [0, 100];
  }

  const prices = data.map(d => d.price).filter(p => typeof p === 'number' && !isNaN(p));
  if (prices.length === 0) {
    return [0, 100];
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice;
  
  // Add 10% padding above and below for better visualization
  const padding = Math.max(range * 0.1, (maxPrice * 0.01)); // At least 1% padding
  
  return [
    Math.max(0, minPrice - padding), // Don't go below 0
    maxPrice + padding
  ];
}

// Enhanced tooltip with price change percentage
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload as PriceHistoryPoint;
  const price = data.price;
  const priceChangePercent = data.priceChangePercent;

  return (
    <div
      className="bg-popover border border-border p-3 rounded-lg shadow-lg"
      role="tooltip"
    >
      <p className="text-xs text-muted-foreground mb-1">
        {data.label}
      </p>
      <p className="text-lg font-bold mb-1">
        {formatCurrency(price)}
      </p>
      {priceChangePercent !== null && priceChangePercent !== undefined && (
        <p className={`text-sm ${
          priceChangePercent > 0
            ? 'text-green-500'
            : priceChangePercent < 0
            ? 'text-red-500'
            : 'text-muted-foreground'
        }`}>
          {priceChangePercent > 0 ? '↑' : priceChangePercent < 0 ? '↓' : '—'}
          {' '}
          {Math.abs(priceChangePercent).toFixed(2)}%
        </p>
      )}
    </div>
  );
}

export function CoinPriceChart({ coinId, coinName }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>('24H');
  const { data, isLoading, error } = useCoinHistoryWithRange(coinId, timeRange);

  console.log('[CoinPriceChart] Render state:', {
    coinId,
    coinName,
    timeRange,
    isLoading,
    isError: !!error,
    error,
    dataLength: data?.length ?? 0,
    dataSample: data?.[0],
  });

  const xAxisFormatter = useMemo(
    () => getXAxisFormatter(timeRange),
    [timeRange]
  );

  // Calculate Y-axis domain for dynamic scaling
  const yAxisDomain = useMemo(() => {
    if (!data || data.length === 0) return undefined;
    return getYAxisDomain(data);
  }, [data]);

  // Calculate X-axis tick interval based on time range
  const xAxisTickInterval = useMemo(() => {
    if (!data || data.length === 0) return undefined;
    return getXAxisTickInterval(timeRange, data.length);
  }, [timeRange, data]);

  // Ensure data is sorted chronologically (oldest to newest, left to right)
  // Also convert timestamps to numbers for Recharts time scale
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    // Sort by timestamp ascending (oldest first) and convert to numbers
    return [...data]
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeA - timeB;
      })
      .map(item => ({
        ...item,
        timestamp: new Date(item.timestamp).getTime(), // Convert to number for time scale
      }));
  }, [data]);

  if (error) {
    console.error('[CoinPriceChart] Error state:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to load price history';
    const is404 = errorMessage.includes('404') || errorMessage.includes('not found');
    
    return (
      <div className="border rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Price History</h2>
        <div className="h-[300px] md:h-[400px] lg:h-[500px] flex flex-col items-center justify-center text-destructive space-y-2">
          <p className="font-semibold">Failed to load price history</p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {is404 ? (
              <>
                The API endpoint may not exist yet. Please verify that the backend endpoint
                <code className="block mt-2 p-2 bg-muted rounded text-xs">
                  GET /api-2/api/coins/{coinId}/price-history?page=1&limit={TIME_RANGE_LIMITS[timeRange]}
                </code>
                is implemented on the server.
              </>
            ) : (
              errorMessage
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="border rounded-lg p-4 md:p-6 mb-8"
      role="region"
      aria-label={`${coinName} price history chart`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-xl md:text-2xl font-bold">
          Price History
        </h2>
        <TimeRangeSelector
          selected={timeRange}
          onSelect={setTimeRange}
          ariaLabel={`Select time range for ${coinName} price chart`}
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-[300px] md:h-[400px] lg:h-[500px] w-full" />
      ) : data && Array.isArray(data) && data.length > 0 ? (
        <div className="relative">
          {/* Data point count indicator (dev info) */}
          {data.length > 100 && (
            <p className="text-xs text-muted-foreground absolute top-0 right-0 z-10">
              Showing {data.length} points
            </p>
          )}

          <div className="h-[300px] md:h-[400px] lg:h-[500px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
            <AreaChart
              data={sortedData}
              margin={{
                top: 20,
                right: 10,
                left: 0,
                bottom: 0
              }}
              role="img"
              aria-label={`Area chart showing ${coinName} price over ${timeRange}`}
            >
              <defs>
                <linearGradient id={`colorPrice-${coinId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />

              <XAxis
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={xAxisFormatter}
                interval={xAxisTickInterval}
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                aria-label="Time axis"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />

              <YAxis
                domain={yAxisDomain}
                tickFormatter={(value) => formatCurrency(value)}
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                width={80}
                aria-label="Price axis"
                allowDataOverflow={false}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill={`url(#colorPrice-${coinId})`}
                isAnimationActive={data.length < 500} // Disable for large datasets
              />
            </AreaChart>
          </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="h-[300px] md:h-[400px] lg:h-[500px] flex items-center justify-center text-muted-foreground">
          No price history available for {coinName}
        </div>
      )}
    </div>
  );
}
