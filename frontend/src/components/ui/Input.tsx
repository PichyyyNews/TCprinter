import React from 'react';
import { cn } from '../../lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, id, ...props }, ref) => {
    return (
      <div className="grid gap-1">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-kumo-subtle select-none">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full bg-kumo-control border border-kumo-line rounded-md px-3 py-1.5 text-sm text-kumo-default placeholder:text-kumo-subtle outline-none focus-visible:ring-1 focus-visible:ring-kumo-brand focus-visible:border-kumo-brand disabled:opacity-50 disabled:bg-kumo-recessed',
            className
          )}
          {...props}
        />
        {helperText && (
          <span className="text-xs text-kumo-subtle">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
