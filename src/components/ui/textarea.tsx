import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-sm border border-near-black/20 bg-white px-3 py-2 text-sm font-inter text-near-black ring-offset-cream placeholder:text-near-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-800 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
