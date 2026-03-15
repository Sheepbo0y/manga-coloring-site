import { Link } from 'react-router-dom';
import { HeartIcon, EyeIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { formatNumber, formatDate } from '@/lib/utils';
import type { Artwork } from '@/types';

interface ArtworkCardProps {
  artwork: Artwork;
  liked?: boolean;
  onLike?: () => void;
}

export function ArtworkCard({ artwork, liked = false, onLike }: ArtworkCardProps) {
  const colorizedImage = artwork.colorizations?.[0]?.colorizedImage;
  const displayImage = colorizedImage || artwork.coverImage;

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Image */}
      <Link to={`/artwork/${artwork.id}`} className="block relative aspect-[3/4] overflow-hidden bg-gray-100">
        <img
          src={displayImage}
          alt={artwork.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Status badge */}
        {artwork.status !== 'COMPLETED' && (
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              artwork.status === 'PROCESSING'
                ? 'bg-yellow-100 text-yellow-800'
                : artwork.status === 'FAILED'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {artwork.status === 'PROCESSING' ? '处理中' :
               artwork.status === 'FAILED' ? '失败' : '等待中'}
            </span>
          </div>
        )}

        {/* Featured badge */}
        {artwork.isFeatured && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 bg-primary-600 text-white rounded text-xs font-medium">
              精选
            </span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link to={`/artwork/${artwork.id}`}>
          <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
            {artwork.title}
          </h3>
        </Link>

        {artwork.description && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
            {artwork.description}
          </p>
        )}

        {/* Tags */}
        {artwork.tags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {artwork.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                to={`/gallery?tag=${encodeURIComponent(tag)}`}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded hover:bg-primary-100 hover:text-primary-600 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Meta info */}
        <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
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
                liked ? 'text-red-500' : 'hover:text-red-500'
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
          <span>{formatDate(artwork.createdAt)}</span>
        </div>

        {/* User info */}
        {artwork.user && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center">
            {artwork.user.avatar ? (
              <img
                src={artwork.user.avatar}
                alt={artwork.user.username}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 text-xs font-medium">
                  {artwork.user.username[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <span className="ml-2 text-sm text-gray-600">
              {artwork.user.username}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ArtworkCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-gray-200" />
      <div className="p-4">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="mt-2 h-4 bg-gray-200 rounded w-full" />
        <div className="mt-1 h-4 bg-gray-200 rounded w-2/3" />
        <div className="mt-3 flex gap-2">
          <div className="h-5 w-10 bg-gray-200 rounded-full" />
          <div className="h-5 w-10 bg-gray-200 rounded-full" />
        </div>
        <div className="mt-3 flex justify-between">
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}
