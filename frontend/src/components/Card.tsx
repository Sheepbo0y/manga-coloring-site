import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  hoverEffect?: boolean;
}

export function Card({
  children,
  className,
  onClick,
  interactive = false,
  hoverEffect = true
}: CardProps) {
  const card = (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white dark:bg-gray-900 rounded-2xl',
        'shadow-soft border border-gray-100 dark:border-gray-800',
        hoverEffect && 'hover:shadow-soft-lg transform transition-all duration-300 ease-in-out hover:-translate-y-1',
        interactive && onClick && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
    >
      {children}
    </div>
  );

  if (interactive && onClick) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={clsx(
          'bg-white dark:bg-gray-900 rounded-2xl cursor-pointer',
          'shadow-soft border border-gray-100 dark:border-gray-800',
          hoverEffect && 'hover:shadow-soft-lg transform transition-all duration-300 ease-in-out hover:-translate-y-1',
          className
        )}
      >
        {children}
      </motion.div>
    );
  }

  return card;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={clsx('px-5 py-4 border-b border-gray-100 dark:border-gray-800', className)}>
      {children}
    </div>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={clsx('p-5', className)}>{children}</div>;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={clsx('px-5 py-4 border-t border-gray-100 dark:border-gray-800', className)}>
      {children}
    </div>
  );
}
