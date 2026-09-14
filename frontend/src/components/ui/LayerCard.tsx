import React from 'react';
import { cn } from '../../lib/cn';

export interface LayerCardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

export const LayerCard = React.forwardRef<HTMLDivElement, LayerCardProps>(
  ({ className, as: Component = 'div', children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'bg-kumo-base border border-kumo-line rounded-lg px-5 py-4 text-kumo-default',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

LayerCard.displayName = 'LayerCard';
