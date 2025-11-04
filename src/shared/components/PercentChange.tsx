import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { formatPercent } from '../utils/formatters';
import { cn } from '@/lib/utils';

interface Props {
  value: number;
  className?: string;
}

export function PercentChange({ value, className }: Props) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const Icon = isPositive ? ArrowUp : isNegative ? ArrowDown : Minus;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        isPositive && 'text-green-600 dark:text-green-400',
        isNegative && 'text-red-600 dark:text-red-400',
        !isPositive && !isNegative && 'text-muted-foreground',
        className
      )}
    >
      <Icon className="h-4 w-4" />
      {formatPercent(Math.abs(value))}
    </span>
  );
}

