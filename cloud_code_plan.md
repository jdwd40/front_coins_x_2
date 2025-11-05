# 📊 Enhanced Interactive Price History Chart - Implementation Plan

## 🎯 Objective
Add a dynamically scaled, mobile-friendly, interactive price history chart with time range selection to the Coin Detail page (`/coins/:id`).

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

---

## 🏗️ Architecture Overview

### Component Structure
```
CoinDetail.tsx (modified)
└── CoinPriceChart.tsx (NEW - dedicated chart component)
    ├── TimeRangeSelector (reused from market feature)
    └── ResponsiveContainer + AreaChart
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
Data transformation & formatting
    ↓
Responsive AreaChart renders
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
- `ALL` - All available history

### Chart Features
1. **Visual Style**:
   - AreaChart with gradient fill (like MarketChart)
   - Primary color theme for consistency
   - Clean, minimal grid
   - Professional tooltips with date/time and price

2. **Responsive Design**:
   - Desktop: 500px height, full width
   - Tablet: 400px height, optimized padding
   - Mobile: 300px height, compact layout
   - Touch-friendly interaction zones

3. **Dynamic Scaling**:
   - Y-axis auto-scales to data range
   - X-axis adjusts tick formatting based on time range
   - Data point density adapts to viewport width

4. **Mobile Optimizations**:
   - Larger touch targets for tooltips
   - Simplified axis labels on small screens
   - Smooth pan/zoom gestures (future enhancement)
   - Optimized tooltip positioning to avoid edge overflow

---

## 🔧 Technical Implementation Plan

### Phase 1: Backend Data Strategy (No Backend Changes Required)

Since the API endpoint is already available, we'll work with what we have:

```typescript
// API: GET /api/coins/:id/history?page=1&limit=50
// Current: Fixed 50 records
// Solution: Calculate appropriate limit based on time range
```

**Time Range to Limit Mapping** (assuming 1 price update per minute):
- `10M` → limit=10
- `30M` → limit=30
- `1H` → limit=60
- `2H` → limit=120
- `12H` → limit=720 (or max available)
- `24H` → limit=1440 (or max available)
- `ALL` → limit=5000 (large number to get all records)

### Phase 2: Create New Hook - `useCoinHistoryWithRange`

**File**: `src/features/coins/hooks/useCoinHistoryWithRange.ts`

**Purpose**: Fetch coin price history with time range awareness

**Features**:
- Accepts `coinId` and `timeRange` parameters
- Dynamically calculates limit based on time range
- Uses React Query for caching
- Auto-refetch every 30 seconds (like market data)
- Proper error handling and loading states

**Interface**:
```typescript
export function useCoinHistoryWithRange(
  coinId: number,
  timeRange: TimeRange
): {
  data: PriceHistoryPoint[] | null;
  isLoading: boolean;
  error: ApiError | null;
}
```

**Implementation Strategy**:
```typescript
const limitMap: Record<TimeRange, number> = {
  '10M': 10,
  '30M': 30,
  '1H': 60,
  '2H': 120,
  '12H': 720,
  '24H': 1440,
  'ALL': 5000,
};

const limit = limitMap[timeRange];
```

### Phase 3: Create `CoinPriceChart` Component

**File**: `src/features/coins/components/CoinPriceChart.tsx`

**Purpose**: Dedicated, reusable chart component for coin price history

**Props**:
```typescript
interface CoinPriceChartProps {
  coinId: number;
  coinName: string;
  symbol: string;
}
```

**Features**:
- Time range selector at the top
- Loading skeleton during data fetch
- Empty state for no data
- Responsive AreaChart with gradient
- Custom tooltip with formatted date/price
- Mobile-optimized layout

**Visual Layout**:
```
┌─────────────────────────────────────────────┐
│ Price History             [10M][30M][1H]... │  ← Header + Time Range
├─────────────────────────────────────────────┤
│                                             │
│          📈 Interactive Chart               │
│                                             │
│        (Responsive AreaChart)               │
│                                             │
└─────────────────────────────────────────────┘
```

### Phase 4: Chart Configuration

**X-Axis Formatting** (Dynamic based on time range):
- `10M`, `30M`, `1H`, `2H`: Show time only (HH:MM)
- `12H`, `24H`: Show time with date hint (HH:MM)
- `ALL`: Show date only (DD/MM/YY)

**Y-Axis**:
- Always format as currency (£X,XXX.XX)
- Auto-scale with 10% padding top/bottom
- 5-7 tick marks for readability

**Tooltip**:
```typescript
<Tooltip
  content={({ active, payload }) => {
    if (!active || !payload?.[0]) return null;
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">
          {formatDateTimeFull(payload[0].payload.timestamp)}
        </p>
        <p className="text-lg font-bold">
          {formatCurrency(payload[0].value as number)}
        </p>
      </div>
    );
  }}
/>
```

### Phase 5: Mobile Responsive Breakpoints

**Tailwind Classes**:
```typescript
// Height responsive
"h-[300px] md:h-[400px] lg:h-[500px]"

// Padding adjustments
"p-4 md:p-6"

// Button sizes in TimeRangeSelector
"text-xs md:text-sm"
"px-2 py-1 md:px-3 md:py-2"

// Chart margins
margin={{ top: 10, right: 10, left: 0, bottom: 0 }} // Mobile
margin={{ top: 20, right: 30, left: 0, bottom: 0 }} // Desktop
```

**Media Query Hook** (Optional Enhancement):
```typescript
const isMobile = useMediaQuery('(max-width: 768px)');
```

### Phase 6: Update `CoinDetail.tsx`

**Changes**:
1. Replace current chart section with new `CoinPriceChart` component
2. Remove inline chart code (lines 78-118)
3. Add import for `CoinPriceChart`
4. Pass necessary props (coinId, name, symbol)

**Before**:
```typescript
<div className="border rounded-lg p-6 mb-8">
  <h2 className="text-2xl font-bold mb-4">Price History</h2>
  {/* ... inline chart code ... */}
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

### Phase 7: Add Schemas and Types

**File**: `src/features/coins/schemas/index.ts`

**Add**:
```typescript
// Import TimeRange from market schemas (for reuse)
import type { TimeRange } from '@/features/market/schemas';

// Export for use in coins feature
export type { TimeRange };

// Add to existing price history schema if needed
export interface PriceHistoryPoint {
  timestamp: string;
  price: number;
  formatted_date?: string;
}
```

### Phase 8: Update Query Keys

**File**: `src/features/coins/hooks/useCoins.ts`

**Add new query key structure**:
```typescript
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

---

## 📱 Mobile-First Considerations

### Touch Interactions
1. **Tooltip Activation**:
   - Touch anywhere on chart to show tooltip
   - Auto-hide after 3 seconds
   - Snap to nearest data point

2. **Time Range Buttons**:
   - Minimum touch target: 44x44px
   - Clear active state
   - Adequate spacing (8px between buttons)

3. **Chart Readability**:
   - Reduce data point density on small screens
   - Larger stroke width (3px on mobile vs 2px desktop)
   - Simplified axis labels

### Performance Optimizations
1. **Data Memoization**:
   ```typescript
   const chartData = useMemo(() =>
     data?.map(item => ({...})) || [],
     [data]
   );
   ```

2. **Debounced Time Range Changes**:
   - Prevent rapid API calls
   - 300ms debounce on time range selection

3. **Lazy Loading**:
   - Chart component lazy loaded
   - Skeleton shown during load

---

## 🎯 Implementation Steps (Ordered)

### Step 1: Create `useCoinHistoryWithRange` Hook ⏱️ ~20 mins
- [ ] Create new file: `src/features/coins/hooks/useCoinHistoryWithRange.ts`
- [ ] Implement time range to limit mapping
- [ ] Add React Query integration
- [ ] Add 30-second polling
- [ ] Export hook

### Step 2: Create `CoinPriceChart` Component ⏱️ ~45 mins
- [ ] Create new file: `src/features/coins/components/CoinPriceChart.tsx`
- [ ] Set up component structure with props
- [ ] Add state for time range selection
- [ ] Integrate `useCoinHistoryWithRange` hook
- [ ] Add TimeRangeSelector component
- [ ] Implement loading state with Skeleton
- [ ] Add empty state handling

### Step 3: Configure Recharts ⏱️ ~30 mins
- [ ] Set up ResponsiveContainer with mobile breakpoints
- [ ] Configure AreaChart with gradient fill
- [ ] Implement dynamic X-axis formatting
- [ ] Implement Y-axis currency formatting
- [ ] Create custom tooltip component
- [ ] Add CartesianGrid with subtle styling
- [ ] Configure responsive margins

### Step 4: Mobile Optimizations ⏱️ ~20 mins
- [ ] Add Tailwind responsive classes
- [ ] Adjust chart height breakpoints
- [ ] Optimize button sizes for touch
- [ ] Test tooltip positioning on mobile
- [ ] Add touch-friendly spacing

### Step 5: Data Transformation & Formatting ⏱️ ~15 mins
- [ ] Create data transformation logic
- [ ] Implement timestamp formatting function
- [ ] Add currency formatting
- [ ] Handle edge cases (empty data, single point)

### Step 6: Update `CoinDetail` Page ⏱️ ~10 mins
- [ ] Import `CoinPriceChart` component
- [ ] Replace old chart section
- [ ] Pass required props
- [ ] Remove old chart code
- [ ] Clean up unused imports

### Step 7: Update Query Keys ⏱️ ~5 mins
- [ ] Add `historyByRange` to `coinKeys`
- [ ] Update cache invalidation if needed

### Step 8: Testing & Refinement ⏱️ ~25 mins
- [ ] Test on desktop (Chrome, Firefox, Safari)
- [ ] Test on mobile (responsive mode + real device)
- [ ] Test all time ranges
- [ ] Test loading states
- [ ] Test empty states
- [ ] Test error handling
- [ ] Verify chart responsiveness
- [ ] Check tooltip behavior on edges

### Step 9: Documentation ⏱️ ~10 mins
- [ ] Add inline code comments
- [ ] Update PROJECT_DOCUMENTATION.md
- [ ] Document component props
- [ ] Add usage examples

---

## 📦 Files to Create/Modify

### New Files (3)
1. `src/features/coins/hooks/useCoinHistoryWithRange.ts` (~80 lines)
2. `src/features/coins/components/CoinPriceChart.tsx` (~200 lines)
3. `src/shared/utils/date-formatters.ts` (optional, ~30 lines)

### Modified Files (2)
1. `src/features/coins/pages/CoinDetail.tsx` (~5 line changes)
2. `src/features/coins/hooks/useCoins.ts` (~3 line additions)

### Total Estimated Lines of Code: ~320 lines

---

## 🎨 Visual Design Mockup

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
│   │         │        ╱────╲                            │ │
│   │         │       ╱      ╲                           │ │
│   │  45,000 ┼──────╱        ╲─────────────────────    │ │
│   │         │                 ╲                        │ │
│   │         │                  ╲___                    │ │
│   │  40,000 ┼╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  │ │
│   │         └─────────────────────────────────────────┘ │ │
│   │         10:00   12:00   14:00   16:00   18:00      │ │
│   └─────────────────────────────────────────────────────┘ │
│                                                             │
├────────────────────────────────────────────────────────────┤
│  Details                                                    │
│  Founder: Satoshi Nakamoto                                 │
└────────────────────────────────────────────────────────────┘
```

### Mobile View (375px)
```
┌──────────────────────────┐
│  Bitcoin (BTC)           │
├──────────────────────────┤
│  Current      24h Change │
│  £45,234.56   ↑ 5.23%   │
├──────────────────────────┤
│  Price History           │
│  [10M][30M][1H][2H]...  │
│                          │
│  ┌────────────────────┐ │
│  │  50K ┼╌╌╌╌╌╌╌╌╌╌╌│ │
│  │      │     ╱╲     │ │
│  │  45K ┼────╱──╲───│ │
│  │      │         ╲  │ │
│  │  40K ┼╌╌╌╌╌╌╌╌╌╌╌│ │
│  │      └────────────┘ │
│  │      10:00   14:00  │
│  └────────────────────┘ │
│                          │
└──────────────────────────┘
```

---

## 🚀 Benefits of This Approach

### User Experience
- ✅ **Intuitive**: Familiar time range controls
- ✅ **Fast**: Prefetched data with React Query
- ✅ **Responsive**: Optimized for all screen sizes
- ✅ **Beautiful**: Professional gradient charts
- ✅ **Informative**: Rich tooltips with precise data

### Developer Experience
- ✅ **Maintainable**: Separate concerns (hook, component, page)
- ✅ **Reusable**: Component can be used elsewhere
- ✅ **Type-Safe**: Full TypeScript coverage
- ✅ **Testable**: Isolated units for testing
- ✅ **Consistent**: Follows existing architecture patterns

### Performance
- ✅ **Efficient**: Only fetches needed data range
- ✅ **Cached**: React Query manages cache
- ✅ **Optimized**: Memoized calculations
- ✅ **Fast Loads**: Skeleton loading states

---

## 🔮 Future Enhancements (Post-MVP)

### Phase 10 (Optional)
1. **Comparison Mode**:
   - Overlay multiple coins on one chart
   - Color-coded lines per coin
   - Legend with coin names

2. **Advanced Interactions**:
   - Zoom and pan controls
   - Range selection with brush
   - Crosshair for precise data points

3. **Export Features**:
   - Download chart as PNG
   - Export data as CSV
   - Share chart URL with selected range

4. **Technical Indicators**:
   - Moving averages (MA50, MA200)
   - Volume overlay
   - RSI indicator

5. **Real-time Updates**:
   - WebSocket integration
   - Live price ticker
   - Animated chart updates

---

## 🧪 Testing Checklist

### Functional Testing
- [ ] Time range selection updates chart
- [ ] All time ranges display correct data
- [ ] Chart loads with loading skeleton
- [ ] Empty state displays when no data
- [ ] Error state handles API failures
- [ ] Tooltip shows correct information

### Responsive Testing
- [ ] Desktop (1920x1080)
- [ ] Laptop (1440x900)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667 - iPhone SE)
- [ ] Mobile (390x844 - iPhone 12)
- [ ] Mobile (414x896 - iPhone 11)

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Performance Testing
- [ ] Chart renders in < 500ms
- [ ] Smooth transitions between time ranges
- [ ] No memory leaks on repeated range changes
- [ ] Efficient re-renders (React DevTools)

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader announces chart data
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible

---

## 📊 Success Metrics

### Performance Goals
- Initial render: < 500ms
- Time range change: < 200ms
- Smooth 60fps animations

### User Experience Goals
- Mobile touch targets: ≥ 44x44px
- Chart readable on 320px width
- Tooltip doesn't overflow viewport

### Code Quality Goals
- TypeScript strict mode: 100%
- No console errors
- ESLint clean
- Component size: < 300 lines

---

## 🎓 Learning Opportunities

This implementation demonstrates:
1. **Recharts mastery**: Advanced chart configurations
2. **React Query patterns**: Time-based data fetching
3. **Responsive design**: Mobile-first CSS
4. **Component composition**: Reusable chart components
5. **TypeScript**: Complex type definitions
6. **Performance optimization**: Memoization, efficient re-renders

---

## 📝 Summary

This plan provides a comprehensive, step-by-step approach to adding a production-quality, interactive price history chart to the Coin Detail page. The implementation:

- **Follows existing patterns** from the Market Dashboard
- **Leverages current infrastructure** (Recharts, TanStack Query, Tailwind)
- **Prioritizes mobile experience** with responsive design
- **Maintains code quality** with TypeScript and clean architecture
- **Delivers in ~2.5 hours** of focused development

The result will be a professional, performant chart that enhances the user experience and fits seamlessly into the existing application.

---

**Ready to implement? Let's build this! 🚀**

*Estimated Total Implementation Time: 2.5-3 hours*
*Complexity: Medium*
*Impact: High - Core feature for coin analysis*
