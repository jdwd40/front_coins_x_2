const gbpFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('en-GB', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrency = (value: number): string => gbpFormatter.format(value);

export const formatPercent = (value: number): string => {
  // API returns percentage as number (e.g., 5.25 for 5.25%)
  // Normalize to decimal for formatter
  const normalized = value / 100;
  return percentFormatter.format(normalized);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-GB').format(value);
};

