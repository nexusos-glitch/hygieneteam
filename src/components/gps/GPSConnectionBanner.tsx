import React from 'react';
import { cn } from '@/lib/utils';

interface GPSStatusIndicatorProps {
  status: 'excellent' | 'good' | 'weak' | 'none';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  excellent: {
    color: 'bg-green-500',
    pulse: 'animate-pulse',
    label: 'Excellent',
    description: 'GPS signal is strong and accurate',
  },
  good: {
    color: 'bg-yellow-500',
    pulse: '',
    label: 'Good',
    description: 'GPS signal is adequate',
  },
  weak: {
    color: 'bg-orange-500',
    pulse: 'animate-pulse',
    label: 'Weak',
    description: 'GPS signal is weak, accuracy may be reduced',
  },
  none: {
    color: 'bg-red-500',
    pulse: 'animate-pulse',
    label: 'No Signal',
    description: 'GPS is unavailable or disabled',
  },
};

const sizeConfig = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

export const GPSStatusIndicator: React.FC<GPSStatusIndicatorProps> = ({
  status,
  showLabel = false,
  size = 'md',
}) => {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={cn(
            'rounded-full',
            sizeConfig[size],
            config.color,
            config.pulse
          )}
        />
        {status === 'excellent' && (
          <div
            className={cn(
              'absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75',
              sizeConfig[size]
            )}
          />
        )}
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-foreground">
          {config.label}
        </span>
      )}
    </div>
  );
};

export const getGPSStatus = (accuracy: number | null): 'excellent' | 'good' | 'weak' | 'none' => {
  if (accuracy === null) return 'none';
  if (accuracy <= 10) return 'excellent';
  if (accuracy <= 30) return 'good';
  if (accuracy <= 100) return 'weak';
  return 'none';
};

export const GPSConnectionBanner = (props: any) => <div />;

