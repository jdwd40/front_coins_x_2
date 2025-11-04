import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MarketTrend } from '../schemas';

interface Props {
  trend: MarketTrend;
  className?: string;
}

export function MarketStatusPill({ trend, className }: Props) {
  const config: Record<MarketTrend, { icon: typeof TrendingUp; label: string; className: string }> = {
    UP: {
      icon: TrendingUp,
      label: 'Market Up',
      className: 'bg-green-500/10 text-green-600 dark:text-green-400',
    },
    DOWN: {
      icon: TrendingDown,
      label: 'Market Down',
      className: 'bg-red-500/10 text-red-600 dark:text-red-400',
    },
    STABLE: {
      icon: Minus,
      label: 'Market Stable',
      className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
    },
    MILD_BOOM: {
      icon: TrendingUp,
      label: 'Mild Boom',
      className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    STRONG_BOOM: {
      icon: TrendingUp,
      label: 'Strong Boom',
      className: 'bg-green-600/20 text-green-700 dark:text-green-300 font-semibold',
    },
    MILD_BUST: {
      icon: TrendingDown,
      label: 'Mild Bust',
      className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    },
    STRONG_BUST: {
      icon: TrendingDown,
      label: 'Strong Bust',
      className: 'bg-red-600/20 text-red-700 dark:text-red-300 font-semibold',
    },
  };

  const { icon: Icon, label, className: colorClass } = config[trend];

  return (
    <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium', colorClass, className)}>
      <Icon className="h-4 w-4" />
      {label}
    </div>
  );
}

