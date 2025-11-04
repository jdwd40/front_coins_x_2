import { Button } from '@/shared/components/ui/button';
import type { TimeRange } from '../schemas';

const TIME_RANGES: TimeRange[] = ['10M', '30M', '1H', '2H', '12H', '24H', 'ALL'];

interface Props {
  selected: TimeRange;
  onSelect: (range: TimeRange) => void;
}

export function TimeRangeSelector({ selected, onSelect }: Props) {
  return (
    <div className="flex gap-2">
      {TIME_RANGES.map((range) => (
        <Button
          key={range}
          variant={selected === range ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(range)}
        >
          {range}
        </Button>
      ))}
    </div>
  );
}

