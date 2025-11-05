# Plan: Interactive Price History Chart for Coin Details Page

## Overview
Add a dynamically scaled, interactive price history chart to the coin details page (`/coins/:id`) with time range selection capabilities and mobile-friendly responsive design.

---

## Current State Analysis

### Existing Implementation
- **Location**: `src/features/coins/pages/CoinDetail.tsx`
- **Current Chart**: Basic LineChart from Recharts library
- **Data Source**: `useCoinHistory(coinId, 1, 50)` - fetches first page with 50 items
- **Limitations**:
  - Fixed data range (page 1, limit 50)
  - No time range selection
  - Static height (400px)
  - Basic interactivity (tooltip only)
  - Not optimized for mobile devices

### Reference Implementation
- **Market Dashboard** (`src/features/market/pages/Dashboard.tsx`) has:
  - TimeRangeSelector component
  - MarketChart with AreaChart (gradient fill)
  - Responsive design
  - 30-second polling for real-time updates

### Available Components & Patterns
- `TimeRangeSelector` - Button group for time ranges (10M, 30M, 1H, 2H, 12H, 24H, ALL)
- `MarketChart` - Example of AreaChart with gradient styling
- Recharts library already in use (LineChart, AreaChart, ResponsiveContainer)
- Dark theme styling with CSS variables

---

## Requirements

### Functional Requirements
1. **Time Range Selection**
   - Allow users to select time ranges: 10M, 30M, 1H, 2H, 12H, 24H, ALL
   - Update chart data based on selected range
   - Persist selection during navigation (optional enhancement)

2. **Dynamic Scaling**
   - Chart Y-axis should auto-scale based on price range in data
   - X-axis should adapt to time range (fewer ticks for shorter ranges, more for longer)
   - Responsive to container size changes
   - Handle edge cases (single data point, no data, extreme price swings)

3. **Interactivity**
   - Enhanced tooltips showing:
     - Formatted date/time
     - Price value (GBP formatted)
     - Price change percentage (if available)
     - Visual indicator (crosshair or highlight)
   - Smooth hover effects
   - Optional: Zoom functionality (future enhancement)
   - Optional: Pan/drag functionality (future enhancement)

4. **Mobile Friendliness**
   - Responsive chart height (smaller on mobile, larger on desktop)
   - Touch-friendly time range selector (horizontal scroll or dropdown on mobile)
   - Optimized tooltip placement for mobile screens
   - Proper spacing and padding for touch targets
   - Chart should be readable on small screens (minimum 320px width)

### Technical Requirements
1. **API Integration**
   - Determine if API supports time range filtering for coin history
   - If not supported, implement client-side filtering based on timestamp
   - Maintain pagination support if needed for "ALL" range
   - Consider polling/refetching strategy for real-time updates

2. **Performance**
   - Efficient data transformation for chart
   - Memoization of chart data calculations
   - Debounce time range changes if needed
   - Lazy loading for "ALL" range (if large dataset)

3. **Code Organization**
   - Create reusable `CoinPriceChart` component (similar to `MarketChart`)
   - Extract time range logic to shared hook or component
   - Maintain consistency with existing MarketChart styling
   - Follow feature-based architecture pattern

---

## Implementation Plan

### Phase 1: API & Data Layer Updates

#### 1.1 Check API Support for Time Range
**Task**: Verify if `/api/coins/:id/history` endpoint supports `timeRange` parameter
- **Action**: Check API documentation or test endpoint
- **Fallback**: If not supported, filter data client-side based on timestamp

#### 1.2 Update API Client (if needed)
**File**: `src/features/coins/api/index.ts`
- **Current**: `getHistory(id: number, page = 1, limit = 50)`
- **Update**: Add optional `timeRange` parameter
- **If API supports it**:
  ```typescript
  getHistory: (id: number, page = 1, limit = 50, timeRange?: TimeRange) => 
    apiCall(
      () => apiClient.get(`/api/coins/${id}/history`, { 
        params: { page, limit, timeRange } 
      }),
      coinHistoryResponseSchema
    )
  ```
- **If client-side filtering**:
  - Keep API call as-is
  - Filter results in hook/component

#### 1.3 Update Hooks
**File**: `src/features/coins/hooks/useCoins.ts`
- **Current**: `useCoinHistory(id: number, page = 1, limit = 50)`
- **Update**: Add `timeRange` parameter
- **Considerations**:
  - Update query key to include timeRange for proper caching
  - Determine appropriate `limit` based on timeRange (e.g., larger limit for "ALL")
  - Implement client-side filtering if API doesn't support timeRange

**Query Key Update**:
```typescript
history: (id: number, page: number, limit: number, timeRange?: TimeRange) =>
  [...coinKeys.detail(id), 'history', page, limit, timeRange] as const,
```

#### 1.4 Data Transformation Logic
**Considerations**:
- Calculate time boundaries based on selected range
- Filter historical data by timestamp
- Handle timezone conversions consistently
- Optimize for large datasets (use efficient filtering)

**Time Range Calculations**:
```typescript
function getTimeRangeBoundary(timeRange: TimeRange): Date {
  const now = new Date();
  const ranges = {
    '10M': 10 * 60 * 1000,
    '30M': 30 * 60 * 1000,
    '1H': 60 * 60 * 1000,
    '2H': 2 * 60 * 60 * 1000,
    '12H': 12 * 60 * 60 * 1000,
    '24H': 24 * 60 * 60 * 1000,
    'ALL': Infinity,
  };
  return new Date(now.getTime() - ranges[timeRange]);
}
```

---

### Phase 2: Component Development

#### 2.1 Create CoinPriceChart Component
**File**: `src/features/coins/components/CoinPriceChart.tsx` (new)

**Features**:
- Reusable chart component for coin price history
- Accepts chart data and configuration props
- Handles empty states and loading states
- Responsive container with dynamic height
- Enhanced tooltips with formatted data

**Props Interface**:
```typescript
interface CoinPriceChartProps {
  data: Array<{
    timestamp: number | string;
    price: number;
    price_change_percentage?: number;
    label?: string;
  }>;
  isLoading?: boolean;
  height?: number; // Optional, defaults to responsive
}
```

**Chart Type Decision**:
- **Option A**: AreaChart (like MarketChart) - gradient fill, more visual appeal
- **Option B**: LineChart (current) - cleaner, more traditional
- **Recommendation**: AreaChart for consistency with MarketChart and better visual impact

**Styling**:
- Match MarketChart gradient styling
- Use theme CSS variables for colors
- Dark theme optimized
- Responsive design with mobile breakpoints

#### 2.2 Create or Reuse TimeRangeSelector
**Decision**: Reuse existing `TimeRangeSelector` from market feature
- **File**: `src/features/market/components/TimeRangeSelector.tsx`
- **Option A**: Import directly (coupling between features)
- **Option B**: Move to shared components (better architecture)
- **Recommendation**: Move to `src/shared/components/TimeRangeSelector.tsx` for reusability

**Mobile Optimization**:
- For mobile: Consider horizontal scroll or dropdown variant
- Touch-friendly button sizes (min 44x44px)
- Ensure proper spacing for touch targets

#### 2.3 Update CoinDetail Page
**File**: `src/features/coins/pages/CoinDetail.tsx`

**Changes**:
1. Add state for selected time range
2. Import and render TimeRangeSelector
3. Replace inline chart with CoinPriceChart component
4. Update useCoinHistory hook call with timeRange
5. Update chart data transformation to handle time range filtering
6. Add responsive height logic (mobile vs desktop)

**Layout Updates**:
- Position TimeRangeSelector above or beside chart title
- Ensure proper spacing and alignment
- Mobile: Stack TimeRangeSelector and chart vertically
- Desktop: Consider side-by-side layout for selector and title

---

### Phase 3: Mobile Optimization

#### 3.1 Responsive Chart Height
**Implementation**:
- Use `useState` + `useEffect` with window resize listener, OR
- Use CSS media queries with container queries, OR
- Use ResponsiveContainer with percentage-based height

**Recommendation**: 
```typescript
const chartHeight = window.innerWidth < 768 ? 300 : 400;
// Or use CSS: h-[300px] md:h-[400px] lg:h-[500px]
```

#### 3.2 TimeRangeSelector Mobile Enhancement
**Options**:
- **A**: Horizontal scroll wrapper for button group
- **B**: Dropdown/select on mobile (< 640px)
- **C**: Collapsible button group

**Recommendation**: Horizontal scroll with snap points for best UX

**Implementation**:
```tsx
<div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
  {/* buttons */}
</div>
```

#### 3.3 Touch Interactions
- Ensure tooltips work on touch devices
- Increase touch target sizes
- Test on actual mobile devices or responsive mode

#### 3.4 Chart Responsiveness
- Use ResponsiveContainer from Recharts (already in use)
- Ensure proper min-width constraints
- Test with various screen sizes (320px, 375px, 768px, 1024px, 1920px)

---

### Phase 4: Enhanced Interactivity

#### 4.1 Enhanced Tooltips
**Current**: Basic tooltip with date and price
**Enhancement**: 
- Show price change percentage (if available)
- Better date/time formatting (context-aware: show time for short ranges, date for long ranges)
- Visual styling improvements
- Position optimization for mobile

**Tooltip Content**:
```typescript
- Date/Time (formatted based on range)
- Price: £X,XXX.XX
- Change: +X.XX% (with color coding)
- Optional: Volume or other metrics
```

#### 4.2 Chart Interaction Improvements
- Add crosshair cursor for precise value reading
- Highlight active data point on hover
- Smooth animations on data updates
- Consider adding reference lines (e.g., current price line)

#### 4.3 Dynamic Axis Formatting
**X-Axis**:
- Short ranges (10M, 30M): Show time (HH:MM)
- Medium ranges (1H, 2H, 12H): Show time with date if crosses midnight
- Long ranges (24H, ALL): Show date (DD/MM)

**Y-Axis**:
- Auto-scale based on min/max in visible data
- Format as currency (£)
- Adjust number of ticks based on chart height
- Consider log scale option for extreme ranges (future)

---

### Phase 5: Performance & Polish

#### 5.1 Memoization
- Memoize chart data transformation with `useMemo`
- Memoize filtered data based on timeRange
- Prevent unnecessary re-renders

**Example**:
```typescript
const chartData = useMemo(() => {
  if (!history?.history) return [];
  const filtered = filterByTimeRange(history.history, timeRange);
  return transformForChart(filtered);
}, [history, timeRange]);
```

#### 5.2 Loading States
- Show skeleton loader during data fetch
- Optimistic updates when changing time range
- Smooth transitions between ranges

#### 5.3 Error Handling
- Handle API errors gracefully
- Show user-friendly error messages
- Fallback to empty state with message

#### 5.4 Accessibility
- Add ARIA labels to chart
- Ensure keyboard navigation works
- Screen reader friendly tooltips
- High contrast mode support

---

## File Structure Changes

### New Files
```
src/features/coins/components/CoinPriceChart.tsx
src/shared/components/TimeRangeSelector.tsx (moved from market)
```

### Modified Files
```
src/features/coins/pages/CoinDetail.tsx
src/features/coins/hooks/useCoins.ts
src/features/coins/api/index.ts (possibly)
src/features/market/components/TimeRangeSelector.tsx (remove if moved)
src/features/market/pages/Dashboard.tsx (update import if moved)
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Verify API timeRange support for coin history endpoint
- [ ] Update API client to support timeRange (or plan client-side filtering)
- [ ] Update useCoinHistory hook with timeRange parameter
- [ ] Update query keys to include timeRange
- [ ] Implement time range boundary calculation utility

### Phase 2: Components
- [ ] Create CoinPriceChart component
- [ ] Decide on AreaChart vs LineChart
- [ ] Move TimeRangeSelector to shared components (or import directly)
- [ ] Update CoinDetail page with time range state
- [ ] Integrate TimeRangeSelector into CoinDetail layout
- [ ] Replace inline chart with CoinPriceChart component

### Phase 3: Mobile
- [ ] Implement responsive chart height
- [ ] Optimize TimeRangeSelector for mobile (scroll/dropdown)
- [ ] Test touch interactions
- [ ] Verify tooltip positioning on mobile
- [ ] Test on various screen sizes

### Phase 4: Interactivity
- [ ] Enhance tooltip content and styling
- [ ] Add crosshair/highlight on hover
- [ ] Implement dynamic axis formatting
- [ ] Add smooth animations
- [ ] Test interaction responsiveness

### Phase 5: Polish
- [ ] Add memoization for performance
- [ ] Improve loading states
- [ ] Add error handling
- [ ] Test accessibility
- [ ] Code review and refactoring

---

## Technical Considerations

### API Support Uncertainty
**If API doesn't support timeRange**:
- Fetch all available data (or large limit)
- Filter client-side by timestamp
- Consider pagination for "ALL" range
- Cache full dataset to avoid refetching

**If API supports timeRange**:
- Pass timeRange as query parameter
- Update query keys accordingly
- Optimize limit based on range

### Data Volume
- **Short ranges (10M-2H)**: Small datasets, fast rendering
- **Medium ranges (12H-24H)**: Moderate datasets, may need optimization
- **ALL range**: Potentially large dataset, consider:
  - Server-side pagination
  - Client-side data sampling/aggregation
  - Virtual scrolling for chart data points

### Chart Library Considerations
- **Recharts** is already in use and works well
- **ResponsiveContainer** handles responsive sizing
- Consider **Recharts Brush** component for zoom (future enhancement)
- Alternative: **TradingView Lightweight Charts** (if more advanced features needed later)

### Performance Optimization Strategies
1. **Data Sampling**: For "ALL" range, sample data points if too many (> 1000)
2. **Debouncing**: Debounce time range changes if causing performance issues
3. **Virtualization**: Consider virtualizing chart data points for very large datasets
4. **Web Workers**: Process large datasets in web worker (if needed)

---

## Testing Strategy

### Manual Testing
- [ ] Test all time ranges (10M, 30M, 1H, 2H, 12H, 24H, ALL)
- [ ] Test on mobile devices (iOS Safari, Android Chrome)
- [ ] Test on tablets
- [ ] Test on desktop (various screen sizes)
- [ ] Test with slow network (loading states)
- [ ] Test with no data / empty state
- [ ] Test error scenarios (API failures)

### Visual Testing
- [ ] Verify chart renders correctly in dark theme
- [ ] Check tooltip positioning and styling
- [ ] Verify responsive behavior at breakpoints
- [ ] Ensure accessibility (screen reader, keyboard nav)

### Performance Testing
- [ ] Measure render time with large datasets
- [ ] Check memory usage with "ALL" range
- [ ] Verify smooth animations
- [ ] Test rapid time range switching

---

## Future Enhancements (Out of Scope)

These are potential future improvements but not required for MVP:

1. **Zoom Functionality**
   - Add brush/zoom component from Recharts
   - Allow users to zoom into specific time periods

2. **Multiple Timeframes**
   - Show multiple lines (e.g., price vs volume)
   - Comparison with other coins

3. **Advanced Chart Types**
   - Candlestick charts
   - Volume bars
   - Moving averages overlay

4. **Export Functionality**
   - Export chart as image
   - Export data as CSV

5. **Price Alerts**
   - Set alerts for price thresholds
   - Notifications when price hits target

6. **Real-time Updates**
   - WebSocket integration for live price updates
   - Animated price changes

---

## Risk Assessment

### Low Risk
- ✅ Recharts library already in use and proven
- ✅ TimeRangeSelector component exists and works
- ✅ Similar pattern already implemented in MarketChart

### Medium Risk
- ⚠️ API may not support timeRange parameter (mitigation: client-side filtering)
- ⚠️ Large datasets for "ALL" range may cause performance issues (mitigation: sampling/pagination)
- ⚠️ Mobile responsiveness needs careful testing

### High Risk
- ❌ None identified - feature is well-scoped and uses existing patterns

---

## Success Criteria

### Must Have
- ✅ Chart displays price history with selected time range
- ✅ Time range selector is functional and accessible
- ✅ Chart is responsive and works on mobile devices
- ✅ Chart dynamically scales to data range
- ✅ Enhanced tooltips show relevant information
- ✅ Smooth user experience with proper loading states

### Nice to Have
- ⭐ Real-time updates with polling
- ⭐ Smooth animations between range changes
- ⭐ Advanced interactivity (zoom, pan)
- ⭐ Export functionality

---

## Estimated Timeline

- **Phase 1 (API & Data)**: 1-2 hours
- **Phase 2 (Components)**: 2-3 hours
- **Phase 3 (Mobile)**: 1-2 hours
- **Phase 4 (Interactivity)**: 1-2 hours
- **Phase 5 (Polish)**: 1 hour
- **Testing & Bug Fixes**: 1-2 hours

**Total Estimate**: 7-12 hours

---

## Notes

- Keep consistency with existing MarketChart styling
- Follow existing code patterns and architecture
- Maintain type safety with TypeScript
- Ensure all changes are backward compatible
- Document any API changes or assumptions
- Consider adding unit tests for utility functions

---

*Plan created: 2025*
*Status: Ready for implementation*

