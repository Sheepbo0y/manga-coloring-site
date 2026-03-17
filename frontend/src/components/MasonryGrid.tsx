import { clsx } from 'clsx';

interface MasonryLayoutProps {
  children: React.ReactNode;
  columns?: number;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MasonryLayout({
  children,
  columns = 4,
  gap = 'md',
  className,
}: MasonryLayoutProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const columnClasses: Record<number, string> = {
    1: 'columns-1',
    2: 'columns-2',
    3: 'columns-2 md:columns-3',
    4: 'columns-2 md:columns-3 lg:columns-4',
    5: 'columns-2 md:columns-3 lg:columns-5',
  };

  return (
    <div
      className={clsx(
        gapClasses[gap],
        columnClasses[columns] || 'columns-2 md:columns-3 lg:columns-4',
        className
      )}
      style={{
        columnFill: 'balance',
      }}
    >
      {children}
    </div>
  );
}
