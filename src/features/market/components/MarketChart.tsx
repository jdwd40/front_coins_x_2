import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatDate } from '@/shared/utils/formatters';
import type { MarketHistoryResponse } from '../schemas';

interface Props {
  data: MarketHistoryResponse['history'];
}

export function MarketChart({ data }: Props) {
  // Convert string total_value to number for chart
  const chartData = data.map((item) => ({
    timestamp: item.timestamp,
    value: parseFloat(item.total_value),
    label: formatDate(item.created_at),
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(value) => new Date(value).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
          })}
          stroke="hsl(var(--muted-foreground))"
        />
        <YAxis
          tickFormatter={(value) => formatCurrency(value)}
          stroke="hsl(var(--muted-foreground))"
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.[0]) return null;
            return (
              <div className="bg-popover border border-border p-3 rounded-lg shadow-lg">
                <p className="text-sm text-muted-foreground">{payload[0].payload.label}</p>
                <p className="text-lg font-bold">{formatCurrency(payload[0].value as number)}</p>
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#colorValue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

