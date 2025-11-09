# 📊 Enhanced Interactive Price History Chart - Implementation Plan v2

> **Refined plan combining detailed implementation steps with architectural best practices**

## 🎯 Objective
Add a dynamically scaled, mobile-friendly, interactive price history chart with time range selection to the Coin Detail page (`/coins/:id`). This implementation emphasizes reusability, accessibility, and performance optimization.

---

## 📋 Current State Analysis

### What We Have
- ✅ Basic LineChart on CoinDetail page using Recharts
- ✅ Static data fetch (last 50 records, no time filtering)
- ✅ Existing TimeRangeSelector component (used in Market Dashboard)
- ✅ AreaChart implementation pattern (MarketChart component)
- ✅ Mobile-responsive layout structure
- ✅ API endpoint: `GET /api/coins/:id/history?page=1&limit=50`

### What's Missing
- ❌ No time range selection for individual coin charts
- ❌ Chart not optimized for mobile interaction
- ❌ Limited visual appeal (simple line vs gradient area)
- ❌ No dynamic scaling based on selected time range
- ❌ No touch-optimized tooltips for mobile
- ❌ Chart doesn't adapt to different data densities
- ❌ No accessibility features (ARIA labels, keyboard nav)
- ❌ No performance optimization for large datasets

---

## 🏗️ Architecture Overview

### Component Structure
```
CoinDetail.tsx (modified)
└── CoinPriceChart.tsx (NEW - dedicated chart component)
    ├── TimeRangeSelector (MOVED to shared/components)
    └── ResponsiveContainer + AreaChart
        ├── Enhanced tooltips (price + change %)
        └── ARIA labels for accessibility
```

### Data Flow
```
User selects time range
    ↓
TimeRangeSelector updates state
    ↓
useCoinHistoryWithRange hook (NEW)
    ↓
API call with dynamic limit/page calculation
    ↓
Data sampling (if >1000 points) ← NEW
    ↓
Data transformation & formatting
    ↓
Responsive AreaChart renders with accessibility
```

---

## 🎨 Design Specifications

### Time Range Options
We'll use the same ranges as the Market Dashboard:
- `10M` - Last 10 minutes
- `30M` - Last 30 minutes
- `1H` - Last 1 hour
- `2H` - Last 2 hours
- `12H` - Last 12 hours
- `24H` - Last 24 hours
- `ALL` - All available history (with smart sampling)

### Chart Features

1. **Visual Style**:
   - AreaChart with gradient fill (like MarketChart)
   - Primary color theme for consistency
   - Clean, minimal grid
   - Professional tooltips with:
     - Formatted date/time
     - Price (GBP formatted)
     - **Price change % from previous point** ← NEW

2. **Responsive Design**:
   - Desktop: 500px height, full width
   - Tablet: 400px height, optimized padding
   - Mobile: 300px height, compact layout
   - Touch-friendly interaction zones (44x44px minimum)

3. **Dynamic Scaling**:
   - Y-axis auto-scales to data range
   - X-axis adjusts tick formatting based on time range
   - Data point density adapts to viewport width
   - **Smart sampling for datasets >1000 points** ← NEW

4. **Accessibility** ← NEW SECTION:
   - ARIA labels for chart elements
   - Keyboard navigation support
   - Screen reader announcements
   - High contrast mode support
   - Focus indicators on interactive elements

5. **Mobile Optimizations**:
   - Larger touch targets for tooltips
   - Horizontal scroll for time range buttons
   - Simplified axis labels on small screens
   - Optimized tooltip positioning to avoid edge overflow

---

## 🔧 Technical Implementation Plan

### Phase 1: Refactor Shared Components (~45 mins)

**Goal**: Move TimeRangeSelector to shared components for cross-feature reusability

#### Step 1.1: Move TimeRangeSelector to Shared (~20 mins)

**Create**: `src/shared/components/TimeRangeSelector.tsx`

```typescript
import { Button } from '@/shared/components/ui/button';
import type { TimeRange } from '@/shared/types/chart';

const TIME_RANGES: TimeRange[] = ['10M', '30M', '1H', '2H', '12H', '24H', 'ALL'];

interface Props {
  selected: TimeRange;
  onSelect: (range: TimeRange) => void;
  className?: string;
  // NEW: Accessibility props
  ariaLabel?: string;
}

export function TimeRangeSelector({
  selected,
  onSelect,
  className = '',
  ariaLabel = 'Select time range'
}: Props) {
  return (
    <div
      className={`flex gap-2 overflow-x-auto pb-2 ${className}`}
      role="group"
      aria-label={ariaLabel}
    >
      {TIME_RANGES.map((range) => (
        <Button
          key={range}
          variant={selected === range ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(range)}
          className="min-w-[44px] min-h-[44px] flex-shrink-0" // Touch target
          aria-pressed={selected === range}
        >
          {range}
        </Button>
      ))}
    </div>
  );
}
```

**Why this change?**
- ✅ Reusable across Market Dashboard and Coin Detail pages
- ✅ Reduces code duplication
- ✅ Single source of truth for time range UI
- ✅ Improved accessibility with ARIA attributes

#### Step 1.2: Create Shared Types (~10 mins)

**Create**: `src/shared/types/chart.ts`

```typescript
import { z } from 'zod';

export const timeRangeSchema = z.enum(['10M', '30M', '1H', '2H', '12H', '24H', 'ALL']);
export type TimeRange = z.infer<typeof timeRangeSchema>;

export interface ChartDataPoint {
  timestamp: string | number;
  value: number;
  label: string;
  previousValue?: number; // For calculating change %
}

export interface PriceHistoryPoint extends ChartDataPoint {
  price: number;
  priceChange?: number; // Change from previous point
  priceChangePercent?: number; // % change from previous point
}
```

#### Step 1.3: Update Market Dashboard Imports (~15 mins)

**Update**: `src/features/market/pages/Dashboard.tsx`

```typescript
// OLD
import { TimeRangeSelector } from '../components/TimeRangeSelector';

// NEW
import { TimeRangeSelector } from '@/shared/components/TimeRangeSelector';
import type { TimeRange } from '@/shared/types/chart';
```

**Delete**: `src/features/market/components/TimeRangeSelector.tsx` (no longer needed)

**Update**: `src/features/market/schemas/index.ts`

```typescript
// Remove timeRangeSchema, import from shared instead
import { timeRangeSchema } from '@/shared/types/chart';
export type { TimeRange } from '@/shared/types/chart';
```

---

### Phase 2: Data Layer with Smart Sampling (~60 mins)

#### Step 2.1: Create useCoinHistoryWithRange Hook (~40 mins)

**Create**: `src/features/coins/hooks/useCoinHistoryWithRange.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { coinsApi } from '../api';
import { coinKeys } from './useCoins';
import type { TimeRange } from '@/shared/types/chart';
import type { PriceHistoryPoint } from '@/shared/types/chart';
import { MARKET_POLL_INTERVAL } from '@/lib/constants';

// Time range to API limit mapping
const TIME_RANGE_LIMITS: Record<TimeRange, number> = {
  '10M': 10,
  '30M': 30,
  '1H': 60,
  '2H': 120,
  '12H': 720,
  '24H': 1440,
  'ALL': 5000, // Fetch all, will sample client-side if needed
};

// NEW: Smart data sampling for performance
function sampleData(data: PriceHistoryPoint[], maxPoints: number = 1000): PriceHistoryPoint[] {
  if (data.length <= maxPoints) return data;

  const step = Math.ceil(data.length / maxPoints);
  const sampled: PriceHistoryPoint[] = [];

  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i]);
  }

  // Always include the last point
  if (sampled[sampled.length - 1] !== data[data.length - 1]) {
    sampled.push(data[data.length - 1]);
  }

  return sampled;
}

// NEW: Calculate price changes between points
function enrichWithPriceChanges(data: any[]): PriceHistoryPoint[] {
  return data.map((item, index) => {
    const price = parseFloat(item.price);
    const previousPrice = index > 0 ? parseFloat(data[index - 1].price) : null;

    const priceChange = previousPrice ? price - previousPrice : null;
    const priceChangePercent = previousPrice && previousPrice !== 0
      ? ((price - previousPrice) / previousPrice) * 100
      : null;

    return {
      timestamp: item.timestamp,
      value: price,
      price,
      label: new Date(item.timestamp).toLocaleString('en-GB'),
      previousValue: previousPrice,
      priceChange,
      priceChangePercent,
    };
  });
}

export function useCoinHistoryWithRange(
  coinId: number,
  timeRange: TimeRange
) {
  const limit = TIME_RANGE_LIMITS[timeRange];

  const query = useQuery({
    queryKey: coinKeys.historyByRange(coinId, timeRange),
    queryFn: () => coinsApi.getHistory(coinId, 1, limit),
    select: (data) => data.success ? data.data : null,
    enabled: !!coinId,
    refetchInterval: MARKET_POLL_INTERVAL, // 30s polling
  });

  // Transform and sample data
  const processedData = useMemo(() => {
    if (!query.data?.history) return [];

    // Enrich with price change calculations
    const enriched = enrichWithPriceChanges(query.data.history);

    // Apply sampling for large datasets (>1000 points)
    const sampled = sampleData(enriched, 1000);

    return sampled;
  }, [query.data]);

  return {
    ...query,
    data: processedData,
  };
}
```

**Why smart sampling?**
- ✅ Prevents browser lag with massive datasets
- ✅ Maintains chart visual fidelity
- ✅ Keeps first and last points for accuracy
- ✅ Improves render performance

#### Step 2.2: Update Query Keys (~10 mins)

**Update**: `src/features/coins/hooks/useCoins.ts`

```typescript
import type { TimeRange } from '@/shared/types/chart';

export const coinKeys = {
  all: ['coins'] as const,
  lists: () => [...coinKeys.all, 'list'] as const,
  details: () => [...coinKeys.all, 'detail'] as const,
  detail: (id: number) => [...coinKeys.details(), id] as const,
  history: (id: number, page: number, limit: number) =>
    [...coinKeys.detail(id), 'history', page, limit] as const,
  // NEW: Time range aware history key
  historyByRange: (id: number, timeRange: TimeRange) =>
    [...coinKeys.detail(id), 'history', 'range', timeRange] as const,
};
```

#### Step 2.3: API Investigation (~10 mins)

**Check**: Does the API support time range filtering?

```bash
# Test the API endpoint
curl "https://jdwd40.com/api-2/api/coins/1/history?page=1&limit=10"
curl "https://jdwd40.com/api-2/api/coins/1/history?page=1&limit=100"
```

**Decision**:
- ✅ If API supports filtering: Use API-side filtering
- ✅ If not: Use client-side approach with dynamic limit (current approach)

---

### Phase 3: Enhanced Chart Component (~90 mins)

#### Step 3.1: Create CoinPriceChart Component (~70 mins)

**Create**: `src/features/coins/components/CoinPriceChart.tsx`

```typescript
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
  symbol: string;
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

export function CoinPriceChart({ coinId, coinName, symbol }: Props) {
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
```

**Key Features**:
- ✅ Enhanced tooltips with price change %
- ✅ Dynamic X-axis formatting
- ✅ ARIA labels for accessibility
- ✅ Smart animation (disabled for >500 points)
- ✅ Responsive height breakpoints
- ✅ Data point counter for debugging
- ✅ Error and empty states

#### Step 3.2: Add Accessibility Styles (~10 mins)

**Update**: `src/index.css`

```css
/* Enhanced focus styles for accessibility */
.recharts-wrapper:focus-within {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .recharts-cartesian-grid line {
    stroke-opacity: 0.5 !important;
  }

  .recharts-area-curve {
    stroke-width: 3px !important;
  }
}

/* Touch-friendly spacing for time range buttons */
@media (max-width: 768px) {
  .time-range-button {
    min-width: 44px;
    min-height: 44px;
  }
}
```

#### Step 3.3: Create Date Formatter Utility (~10 mins)

**Create**: `src/shared/utils/date-formatters.ts`

```typescript
export function formatDateTimeFull(timestamp: string | number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeOnly(timestamp: string | number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateOnly(timestamp: string | number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
```

---

### Phase 4: Update CoinDetail Page (~20 mins)

#### Step 4.1: Replace Chart Section (~15 mins)

**Update**: `src/features/coins/pages/CoinDetail.tsx`

```typescript
// Add import
import { CoinPriceChart } from '../components/CoinPriceChart';

// Remove old chart section (lines 78-118) and replace with:
<CoinPriceChart
  coinId={coin.coin_id}
  coinName={coin.name}
  symbol={coin.symbol}
/>
```

**Before** (lines 78-118):
```typescript
<div className="border rounded-lg p-6 mb-8">
  <h2 className="text-2xl font-bold mb-4">Price History</h2>
  {/* ... old chart code ... */}
</div>
```

**After**:
```typescript
<CoinPriceChart
  coinId={coin.coin_id}
  coinName={coin.name}
  symbol={coin.symbol}
/>
```

#### Step 4.2: Clean Up Imports (~5 mins)

Remove unused imports:
```typescript
// Remove these if no longer used elsewhere in the file:
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// import { useCoinHistory } from '../hooks/useCoins';
```

---

### Phase 5: Testing & Refinement (~90 mins)

#### Step 5.1: Functional Testing (~30 mins)

**Desktop Testing**:
- [ ] All time ranges load correct data
- [ ] Chart updates when range changes
- [ ] Tooltips show price and change %
- [ ] Loading skeleton displays correctly
- [ ] Empty state shows when no data
- [ ] Error state handles API failures
- [ ] Data sampling works for large datasets (test with ALL range)

**Mobile Testing** (responsive mode + real device):
- [ ] Chart renders at 300px height
- [ ] Time range buttons are scrollable horizontally
- [ ] Touch targets are 44x44px minimum
- [ ] Tooltips don't overflow viewport edges
- [ ] X-axis labels are readable
- [ ] Chart is interactive on touch

#### Step 5.2: Accessibility Testing (~30 mins)

**Keyboard Navigation**:
- [ ] Tab through time range buttons
- [ ] Enter/Space activates button
- [ ] Focus indicators are visible
- [ ] Escape closes tooltip (if applicable)

**Screen Reader Testing**:
- [ ] Chart has descriptive ARIA label
- [ ] Time range selector announces role
- [ ] Button states are announced (pressed/not pressed)
- [ ] Axis labels are accessible

**Visual Testing**:
- [ ] High contrast mode displays correctly
- [ ] Focus outlines have sufficient contrast
- [ ] Color is not the only differentiator

#### Step 5.3: Performance Testing (~20 mins)

**Chrome DevTools**:
- [ ] Chart renders in < 500ms
- [ ] Time range change in < 200ms
- [ ] No memory leaks on repeated changes
- [ ] FPS stays above 30 during animations
- [ ] Bundle size impact < 50KB

**React DevTools**:
- [ ] Data memoization prevents unnecessary re-renders
- [ ] Query keys properly invalidate cache
- [ ] Component doesn't re-render on unrelated state changes

#### Step 5.4: Browser Compatibility (~10 mins)

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## 📦 Complete File Checklist

### New Files (5)
- [ ] `src/shared/components/TimeRangeSelector.tsx` (~50 lines)
- [ ] `src/shared/types/chart.ts` (~30 lines)
- [ ] `src/features/coins/hooks/useCoinHistoryWithRange.ts` (~120 lines)
- [ ] `src/features/coins/components/CoinPriceChart.tsx` (~200 lines)
- [ ] `src/shared/utils/date-formatters.ts` (~30 lines)

### Modified Files (5)
- [ ] `src/features/market/pages/Dashboard.tsx` (~5 line changes)
- [ ] `src/features/market/schemas/index.ts` (~5 line changes)
- [ ] `src/features/coins/hooks/useCoins.ts` (~5 line additions)
- [ ] `src/features/coins/pages/CoinDetail.tsx` (~10 line changes)
- [ ] `src/index.css` (~20 line additions)

### Deleted Files (1)
- [ ] `src/features/market/components/TimeRangeSelector.tsx` (moved to shared)

### Total Lines of Code: ~450 lines

---

## 🎨 Visual Design Reference

### Desktop View (1200px+)
```
┌────────────────────────────────────────────────────────────┐
│  Bitcoin (BTC)                                  [Admin]    │
├────────────────────────────────────────────────────────────┤
│  Current Price     24h Change      Market Cap    Supply    │
│  £45,234.56        ↑ 5.23%        £890.2B       19.2M      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Price History        [10M] [30M] [1H] [2H] [12H] [24H] [ALL] │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐ │
│   │  50,000 ┼╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  │ │
│   │         │        ╱────╲     Tooltip:              │ │
│   │         │       ╱      ╲    ┌──────────────────┐  │ │
│   │  45,000 ┼──────╱        ╲───│ 14:30, 12 Jan    │  │ │
│   │         │                 ╲ │ £45,234.56       │  │ │
│   │         │                  ╲│ ↑ 2.34%          │  │ │
│   │  40,000 ┼╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌└──────────────────┘  │ │
│   │         └─────────────────────────────────────────┘ │ │
│   │         10:00   12:00   14:00   16:00   18:00      │ │
│   └─────────────────────────────────────────────────────┘ │
│   Showing 847 points                                      │
│                                                             │
├────────────────────────────────────────────────────────────┤
│  Details                                                    │
│  Founder: Satoshi Nakamoto                                 │
└────────────────────────────────────────────────────────────┘
```

### Mobile View (375px)
```
┌──────────────────────────────────┐
│  Bitcoin (BTC)                   │
├──────────────────────────────────┤
│  Current        24h Change       │
│  £45,234.56     ↑ 5.23%         │
├──────────────────────────────────┤
│  Price History                   │
│  ┌────────────────────────────┐ │
│  │[10M][30M][1H][2H]→→→→→→→→│ │ ← Scrollable
│  └────────────────────────────┘ │
│                                  │
│  ┌────────────────────────────┐ │
│  │  50K ┼╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ │ │
│  │      │     ╱╲            │ │
│  │  45K ┼────╱──╲──────────│ │
│  │      │         ╲         │ │
│  │  40K ┼╌╌╌╌╌╌╌╌╌╲╌╌╌╌╌╌╌╌│ │
│  │      └────────────────────┘ │
│  │      10:00        14:00    │ │
│  └────────────────────────────┘ │
│                                  │
│  Tooltip:                        │
│  ┌────────────────────┐         │
│  │ 14:30              │         │
│  │ £45,234.56         │         │
│  │ ↑ 2.34%            │         │
│  └────────────────────┘         │
└──────────────────────────────────┘
```

---

## 🚀 Implementation Timeline

### Realistic Time Estimates

| Phase | Tasks | Time | Total |
|-------|-------|------|-------|
| **Phase 1** | Refactor shared components | 20m + 10m + 15m | **45 mins** |
| **Phase 2** | Data layer with sampling | 40m + 10m + 10m | **60 mins** |
| **Phase 3** | Enhanced chart component | 70m + 10m + 10m | **90 mins** |
| **Phase 4** | Update CoinDetail page | 15m + 5m | **20 mins** |
| **Phase 5** | Testing & refinement | 30m + 30m + 20m + 10m | **90 mins** |

**Total Estimated Time: 5 hours 5 minutes**

**Buffer for unknowns: +1.5 hours**

**Final Estimate: 6-7 hours** (realistic for quality implementation)

---

## 🎯 Success Metrics

### Performance Goals
- ✅ Initial chart render: < 500ms
- ✅ Time range change: < 200ms
- ✅ Smooth 30fps animations (60fps for simple datasets)
- ✅ No memory leaks over 10+ range changes
- ✅ Bundle size increase: < 50KB

### User Experience Goals
- ✅ Mobile touch targets: ≥ 44x44px
- ✅ Chart readable on 320px width
- ✅ Tooltip doesn't overflow viewport
- ✅ All time ranges display meaningful data
- ✅ Loading states are smooth

### Accessibility Goals
- ✅ WCAG AA color contrast compliance
- ✅ Full keyboard navigation
- ✅ Screen reader announces all states
- ✅ Focus indicators clearly visible
- ✅ High contrast mode supported

### Code Quality Goals
- ✅ TypeScript strict mode: 100%
- ✅ No console errors
- ✅ ESLint clean
- ✅ Component size: < 250 lines each
- ✅ Test coverage: > 80% (future)

---

## 🔮 Future Enhancements (Phase 6+)

### Priority 1 (Next Sprint)
1. **Real-time Updates via WebSocket**
   - Live price ticker
   - Animated chart updates
   - Connection status indicator

2. **Export Features**
   - Download chart as PNG
   - Export data as CSV
   - Share chart with selected range URL

### Priority 2 (Future)
3. **Advanced Chart Interactions**
   - Zoom and pan controls
   - Brush for range selection
   - Crosshair for precise values

4. **Comparison Mode**
   - Overlay multiple coins
   - Color-coded legends
   - Synchronized tooltips

5. **Technical Indicators**
   - Moving averages (MA50, MA200)
   - Volume overlay
   - RSI/MACD indicators

---

## 🧪 Testing Strategy

### Unit Tests (Future)
```typescript
// Example test structure
describe('CoinPriceChart', () => {
  it('renders with time range selector', () => {});
  it('loads data for selected range', () => {});
  it('samples data when > 1000 points', () => {});
  it('displays price change percentage in tooltip', () => {});
  it('handles empty data gracefully', () => {});
});

describe('useCoinHistoryWithRange', () => {
  it('fetches correct limit for time range', () => {});
  it('enriches data with price changes', () => {});
  it('samples large datasets', () => {});
  it('polls every 30 seconds', () => {});
});
```

### Integration Tests (Future)
- Test full flow: time range selection → data fetch → chart render
- Test cache invalidation and refetch behavior
- Test responsive breakpoints

---

## 📚 Key Learnings & Best Practices

### Architecture Decisions

**✅ Why move TimeRangeSelector to shared?**
- Single source of truth
- Easier to maintain consistency
- Enables future features (watchlist charts, comparison views)

**✅ Why add price change % to tooltips?**
- Provides context at a glance
- Common user expectation
- Minimal performance impact

**✅ Why implement data sampling?**
- Browser performance degrades with >1000 DOM elements
- Recharts can lag with massive datasets
- Visual fidelity remains high with sampling

**✅ Why explicit accessibility?**
- Legal compliance (WCAG AA)
- Better UX for all users
- Screen readers are common in finance

### Performance Optimizations

1. **Memoization**: Prevents recalculating chart data on unrelated re-renders
2. **Conditional animation**: Disabled for large datasets (>500 points)
3. **Smart sampling**: Keeps performance smooth without sacrificing visuals
4. **Query caching**: React Query caches by time range, reducing API calls

### Mobile-First Approach

1. **Touch targets**: 44x44px minimum (Apple HIG, Material Design)
2. **Horizontal scroll**: Better UX than wrapping buttons
3. **Responsive heights**: Maximize chart visibility within viewport
4. **Tooltip positioning**: Prevent edge overflow

---

## 🎓 What This Implementation Demonstrates

### Technical Skills
- ✅ Advanced React hooks (useQuery, useMemo)
- ✅ Complex state management with React Query
- ✅ TypeScript generics and type safety
- ✅ Recharts advanced configuration
- ✅ Responsive design patterns
- ✅ Performance optimization techniques
- ✅ Accessibility implementation (ARIA, keyboard nav)

### Software Engineering Principles
- ✅ DRY (Don't Repeat Yourself) - Shared components
- ✅ Single Responsibility - Each component has one job
- ✅ Separation of Concerns - Data/UI/Logic separated
- ✅ Progressive Enhancement - Works without JS
- ✅ Mobile-First Design - Start small, scale up
- ✅ Performance First - Optimize before scaling

---

## 📝 Documentation Updates

After implementation, update:

1. **PROJECT_DOCUMENTATION.md**:
   - Add CoinPriceChart to Component Breakdown
   - Update Coins Feature section
   - Document new shared components
   - Add performance optimizations section

2. **README.md**:
   - Update features list
   - Add accessibility notes

3. **Code Comments**:
   - Document sampling algorithm
   - Explain time range calculations
   - Note accessibility considerations

---

## ✅ Pre-Implementation Checklist

Before starting:
- [ ] Review both plans (cursor_plan.md and this plan)
- [ ] Confirm API endpoint behavior (test with curl)
- [ ] Check current bundle size (for comparison)
- [ ] Set up screen reader testing environment
- [ ] Install React DevTools and Chrome Lighthouse

---

## 🎬 Ready to Implement!

This plan provides:
- ✅ **Clear architecture** with shared components
- ✅ **Detailed code examples** for each file
- ✅ **Performance optimizations** (sampling, memoization)
- ✅ **Accessibility first** approach
- ✅ **Mobile-optimized** design
- ✅ **Realistic timeline** (6-7 hours)
- ✅ **Testing strategy** for quality assurance

**The v2 plan combines**:
- Cursor plan's architectural wisdom (shared components, accessibility)
- Cloud plan's detailed execution (code examples, mockups, steps)

---

**Estimated Total Implementation Time: 6-7 hours**
**Complexity: Medium-High**
**Impact: High - Core feature for coin analysis**
**Code Quality: Production-ready with accessibility**

Let's build this! 🚀
