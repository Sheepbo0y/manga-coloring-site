import { Link } from 'react-router-dom';
import { HeartIcon, EyeIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { formatNumber, formatDate } from '@/lib/utils';
import type { Artwork } from '@/types';

interface ArtworkCardProps {
  artwork: Artwork;
  liked?: boolean;
  onLike?: () => void;
  onQuickView?: () => void;
  index?: number;
}

export function ArtworkCard({ artwork, liked = false, onLike, onQuickView, index = 0 }: ArtworkCardProps) {
  const colorizedImage = artwork.colorizations?.[0]?.colorizedImage;
  const displayImage = colorizedImage || artwork.coverImage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
      className="group bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      onClick={onQuickView}
    >
      {/* Image */}
      <div className="block relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800">
        <motion.img
          src={displayImage}
          alt={artwork.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          loading="lazy"
          whileHover={{ scale: 1.05 }}
        />

        {/* Status badge */}
        {artwork.status !== 'COMPLETED' && (
          <div className="absolute top-3 left-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
              artwork.status === 'PROCESSING'
                ? 'bg-yellow-100/90 dark:bg-yellow-900/80 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700'
                : artwork.status === 'FAILED'
                ? 'bg-red-100/90 dark:bg-red-900/80 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'
                : 'bg-gray-100/90 dark:bg-gray-800/80 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}>
              {artwork.status === 'PROCESSING' ? '处理中' :
               artwork.status === 'FAILED' ? '失败' : '等待中'}
            </span>
          </div>
        )}

        {/* Featured badge */}
        {artwork.isFeatured && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-full text-xs font-semibold shadow-lg shadow-primary-500/30">
              精选
            </span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Quick action buttons on hover */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView?.();
            }}
            className="flex-1 py-2 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 backdrop-blur-md transition-all duration-200 hover:bg-primary-500 hover:text-white font-medium text-sm flex items-center justify-center gap-1"
          >
            <ArrowsPointingOutIcon className="w-4 h-4" />
            快速预览
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onLike?.();
            }}
            className={`p-2 rounded-full backdrop-blur-md transition-all duration-200 ${
              liked
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                : 'bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 hover:bg-red-500 hover:text-white'
            }`}
          >
            {liked ? (
              <HeartSolidIcon className="w-4 h-4" />
            ) : (
              <HeartIcon className="w-4 h-4" />
            )}
          </button>
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Link to={`/artwork/${artwork.id}`} onClick={(e) => e.stopPropagation()}>
          <h3 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {artwork.title}
          </h3>
        </Link>

        {artwork.description && (
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {artwork.description}
          </p>
        )}

        {/* Tags */}
        {artwork.tags?.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {artwork.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                to={`/gallery?tag=${encodeURIComponent(tag)}`}
                className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Meta info */}
        <div className="mt-3.5 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <EyeIcon className="w-4 h-4 mr-1" />
              {formatNumber(artwork.views)}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                onLike?.();
              }}
              className={`flex items-center ${
                liked ? 'text-red-500' : 'hover:text-red-500 dark:hover:text-red-400'
              } transition-colors`}
            >
              {liked ? (
                <HeartSolidIcon className="w-4 h-4 mr-1" />
              ) : (
                <HeartIcon className="w-4 h-4 mr-1" />
              )}
              {formatNumber(artwork.likes)}
            </button>
          </div>
          <span className="text-gray-400 dark:text-gray-500">{formatDate(artwork.createdAt)}</span>
        </div>

        {/* User info */}
        {artwork.user && (
          <div className="mt-3.5 pt-3.5 border-t border-gray-100 dark:border-gray-800 flex items-center">
            {artwork.user.avatar ? (
              <img
                src={artwork.user.avatar}
                alt={artwork.user.username}
                className="w-7 h-7 rounded-full ring-2 ring-gray-100 dark:ring-gray-800"
              />
            ) : (
              <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center ring-2 ring-gray-100 dark:ring-gray-800">
                <span className="text-white text-xs font-bold">
                  {artwork.user.username[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
              {artwork.user.username}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function ArtworkCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-800" />
      <div className="p-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-lg w-3/4" />
        <div className="mt-2 h-4 bg-gray-200 dark:bg-gray-800 rounded-lg w-full" />
        <div className="mt-1 h-4 bg-gray-200 dark:bg-gray-800 rounded-lg w-2/3" />
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
