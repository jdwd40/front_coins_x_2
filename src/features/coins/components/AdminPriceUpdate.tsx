import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useUpdateCoinPrice } from '../hooks/useCoins';
import { updatePriceSchema, type UpdatePriceInput } from '../schemas';

interface Props {
  coinId: number;
  currentPrice: number;
}

export function AdminPriceUpdate({ coinId, currentPrice }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const { mutate, isPending } = useUpdateCoinPrice(coinId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdatePriceInput>({
    resolver: zodResolver(updatePriceSchema),
    defaultValues: { price: currentPrice },
  });

  const onSubmit = (data: UpdatePriceInput) => {
    mutate(data, {
      onSuccess: () => {
        setIsOpen(false);
        reset();
      },
    });
  };

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        Update Price (Admin)
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 border p-4 rounded-lg">
      <Label htmlFor="price">New Price (GBP)</Label>
      <Input
        id="price"
        type="number"
        step="0.01"
        {...register('price', { valueAsNumber: true })}
      />
      {errors.price && (
        <p className="text-sm text-destructive">{errors.price.message}</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Updating...' : 'Update'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

