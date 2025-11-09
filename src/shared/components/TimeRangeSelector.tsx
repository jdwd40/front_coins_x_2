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
