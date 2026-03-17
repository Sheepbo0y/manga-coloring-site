import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: string;
}

export function Spinner({ size = 'md', className, color }: SpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <motion.svg
      className={clsx('animate-spin', sizes[size], className)}
      fill="none"
      viewBox="0 0 24 24"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill={color || 'currentColor'}
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </motion.svg>
  );
}

export function LoadingOverlay({ text = '加载中...' }: { text?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl px-8 py-6 flex flex-col items-center space-y-4 shadow-soft-lg"
      >
        <Spinner size="lg" className="text-primary-600" />
        <span className="text-gray-700 dark:text-gray-300 font-medium">{text}</span>
      </motion.div>
    </motion.div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg',
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-800" />
      <div className="p-5">
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
        <div className="mt-2 h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
        <div className="mt-1 h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
        <div className="mt-3 flex gap-2">
          <div className="h-5 w-10 bg-gray-200 dark:bg-gray-800 rounded-full" />
          <div className="h-5 w-10 bg-gray-200 dark:bg-gray-800 rounded-full" />
        </div>
        <div className="mt-3 flex justify-between">
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <Spinner size="xl" className="text-primary-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">加载中...</p>
      </div>
    </div>
  );
}
