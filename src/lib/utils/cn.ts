// Utility for merging Tailwind classes
import clsx, { ClassValue } from 'clsx';

/**
 * Merge class names with clsx
 * Usage: cn('base-class', condition && 'conditional-class', { 'class': condition })
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
