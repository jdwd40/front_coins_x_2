import { Button } from '@/shared/components/ui/button';
import { TIME_RANGES, type TimeRange } from '../schemas';

interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '10M': '10m',
  '30M': '30m',
  '1H': '1h',
  '2H': '2h',
  '12H': '12h',
  '24H': '24h',
  'ALL': 'All',
};

export function TimeRangeSelector({ selectedRange, onRangeChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TIME_RANGES.map((range) => (
        <Button
          key={range}
          variant={selectedRange === range ? 'default' : 'secondary'}
          size="sm"
          onClick={() => onRangeChange(range)}
          className="min-w-[60px]"
        >
          {TIME_RANGE_LABELS[range]}
        </Button>
      ))}
    </div>
  );
}


