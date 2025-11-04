import { formatCurrency } from '../utils/formatters';

interface Props {
  value: number;
  className?: string;
}

export function Currency({ value, className }: Props) {
  return (
    <span className={className}>
      {formatCurrency(value)}
    </span>
  );
}

