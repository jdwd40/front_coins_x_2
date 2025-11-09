import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCoinHistoryWithRange } from '../hooks/useCoinHistoryWithRange';
import { TimeRangeSelector } from '@/shared/components/TimeRangeSelector';
import { Skeleton } from '@/shared/components/Skeleton';
import { formatCurrency } from '@/shared/utils/formatters';
import type { TimeRange, PriceHistoryPoint } from '@/shared/types/chart';

interface Props {
  coinId: number;
  coinName: string;
}

// X-axis formatter based on time range
function getXAxisFormatter(timeRange: TimeRange) {
  return (timestamp: number | string) => {
    const date = new Date(timestamp);

    switch (timeRange) {
      case '10M':
      case '30M':
      case '1H':
      case '2H':
        // Show time only (HH:MM)
        return date.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        });
      case '12H':
      case '24H':
        // Show time (HH:MM)
        return date.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        });
      case 'ALL':
        // Show date (DD/MM)
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
        });
      default:
        return date.toLocaleTimeString('en-GB');
    }
  };
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

  const xAxisFormatter = useMemo(
    () => getXAxisFormatter(timeRange),
    [timeRange]
  );

  if (error) {
    return (
      <div className="border rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Price History</h2>
        <div className="h-[300px] md:h-[400px] lg:h-[500px] flex items-center justify-center text-destructive">
          Failed to load price history
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
      ) : data.length > 0 ? (
        <div className="relative">
          {/* Data point count indicator (dev info) */}
          {data.length > 100 && (
            <p className="text-xs text-muted-foreground absolute top-0 right-0 z-10">
              Showing {data.length} points
            </p>
          )}

          <ResponsiveContainer
            width="100%"
            height={300}
            className="md:!h-[400px] lg:!h-[500px]"
          >
            <AreaChart
              data={data}
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
                tickFormatter={xAxisFormatter}
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                aria-label="Time axis"
              />

              <YAxis
                tickFormatter={(value) => formatCurrency(value)}
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                width={80}
                aria-label="Price axis"
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
      ) : (
        <div className="h-[300px] md:h-[400px] lg:h-[500px] flex items-center justify-center text-muted-foreground">
          No price history available for {coinName}
        </div>
      )}
    </div>
  );
}
