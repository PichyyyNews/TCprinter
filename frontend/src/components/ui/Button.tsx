import React from 'react';
import { cn } from '../../lib/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'subtle' | 'destructive' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    // Rule 1: Text 14px (text-sm). Rule 4: font-medium. Rule 7: Immediate hover (no transition-colors)
    const baseStyles =
      'inline-flex items-center justify-center font-medium text-sm rounded-md select-none outline-none focus-visible:ring-2 focus-visible:ring-kumo-brand disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-sm',
    };

    const variantStyles = {
      primary: 'bg-kumo-brand text-white hover:bg-kumo-brandHover border border-transparent shadow-none',
      secondary:
        'bg-kumo-base text-kumo-default border border-kumo-line hover:bg-kumo-tint active:bg-kumo-recessed shadow-none',
      subtle: 'bg-transparent text-kumo-subtle hover:text-kumo-default hover:bg-kumo-tint border border-transparent',
      destructive:
        'bg-kumo-critical text-white hover:opacity-90 border border-transparent active:opacity-100 shadow-none',
      danger:
        'bg-kumo-critical text-white hover:opacity-90 border border-transparent active:opacity-100 shadow-none',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{children}</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
