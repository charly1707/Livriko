import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  max = 5,
  size = 'md',
  showValue = false,
  reviewCount,
  className = '',
}) => {
  const iconClass = SIZE_MAP[size];
  const rounded = Math.max(0, Math.min(max, Math.round(rating * 2) / 2));

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="inline-flex items-center gap-0.5">
        {Array.from({ length: max }, (_, index) => {
          const value = index + 1;
          const filled = rounded >= value;
          const half = !filled && rounded >= value - 0.5;
          return (
            <Star
              key={value}
              className={`${iconClass} ${
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : half
                    ? 'fill-amber-200 text-amber-400'
                    : 'text-slate-300'
              }`}
            />
          );
        })}
      </span>
      {showValue && (
        <span className="text-xs font-bold text-slate-700">
          {rating > 0 ? rating.toFixed(1) : '—'}
          {typeof reviewCount === 'number' && (
            <span className="font-medium text-slate-400"> ({reviewCount})</span>
          )}
        </span>
      )}
    </span>
  );
};

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const RatingInput: React.FC<RatingInputProps> = ({ value, onChange, size = 'lg' }) => {
  const iconClass = size === 'lg' ? 'w-7 h-7' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-1 rounded-lg hover:bg-[#f4f0e8] transition"
          aria-label={`${star} étoiles`}
        >
          <Star
            className={`${iconClass} ${
              star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};
