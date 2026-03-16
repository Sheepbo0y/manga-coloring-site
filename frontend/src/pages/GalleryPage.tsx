import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FunnelIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { artworkApi } from '@/lib/api';
import { ArtworkCard, ArtworkCardSkeleton } from '@/components/ArtworkCard';
import type { Artwork } from '@/types';

const TAGS = ['全部', '风景', '人物', '建筑', '自然', '古风', '现代', '奇幻', '科幻'];
const SORT_OPTIONS = [
  { value: 'createdAt', label: '最新发布' },
  { value: 'views', label: '最多浏览' },
  { value: 'likes', label: '最多点赞' },
];

export function GalleryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const selectedTag = searchParams.get('tag') || '全部';
  const sortBy = searchParams.get('sort') || 'createdAt';
  const order = searchParams.get('order') || 'desc';
  const featured = searchParams.get('featured') === 'true';

  const fetchArtworks = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: reset ? 1 : page,
        limit: 12,
        sortBy,
        order,
      };

      if (selectedTag !== '全部') {
        params.tag = selectedTag;
      }

      if (featured) {
        params.isFeatured = true;
      }

      const response = await artworkApi.getList(params);
      const newArtworks = response.data.data || [];

      if (reset) {
        setArtworks(newArtworks);
      } else {
        setArtworks((prev) => [...prev, ...newArtworks]);
      }

      setHasMore((response.data.pagination?.page || 1) < (response.data.pagination?.totalPages || 1));
      setPage(response.data.pagination?.page || 1);
    } catch (error) {
      console.error('Failed to fetch artworks:', error);
    } finally {
      setLoading(false);
    }
  }, [page, selectedTag, sortBy, order, featured]);

  useEffect(() => {
    fetchArtworks(true);
  }, [selectedTag, sortBy, order, featured]);

  const handleTagClick = (tag: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (tag === '全部') {
      newParams.delete('tag');
    } else {
      newParams.set('tag', tag);
    }
    setSearchParams(newParams);
  };

  const handleSortChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', value);
    setSearchParams(newParams);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchArtworks();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gray-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">画廊</h1>
          <p className="text-gray-600">探索精彩的 AI 上色作品</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 space-y-4"
        >
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedTag === tag
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-primary-50 border border-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Sort and filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FunnelIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {featured ? '精选作品' : selectedTag === '全部' ? '全部作品' : `#${selectedTag}`}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <ArrowsUpDownIcon className="w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() =>
                  setSearchParams(new URLSearchParams({
                    ...Object.fromEntries(searchParams),
                    order: order === 'desc' ? 'asc' : 'desc',
                  }))
                }
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                {order === 'desc' ? '↓ 降序' : '↑ 升序'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Gallery Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {loading && artworks.length === 0
            ? Array.from({ length: 12 }).map((_, i) => (
                <ArtworkCardSkeleton key={i} />
              ))
            : artworks.map((artwork, index) => (
                <motion.div
                  key={artwork.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.03 }}
                >
                  <ArtworkCard artwork={artwork} />
                </motion.div>
              ))}
        </motion.div>

        {/* Load more */}
        {!loading && artworks.length > 0 && hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="btn-secondary"
            >
              {loading ? '加载中...' : '加载更多'}
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && artworks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无作品</h3>
            <p className="text-gray-500">
              还没有符合条件的作品，快去上传第一张吧！
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
