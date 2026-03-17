import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FunnelIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { artworkApi } from '@/lib/api';
import { ArtworkCard, ArtworkCardSkeleton } from '@/components/ArtworkCard';
import { Lightbox } from '@/components/Lightbox';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { MasonryLayout } from '@/components/MasonryGrid';
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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

  // 无限滚动
  const { loaderRef } = useInfiniteScroll({
    onLoadMore: () => fetchArtworks(),
    hasMore,
    loading,
  });

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

  // 打开快速预览
  const handleOpenLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const handleLightboxNavigate = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">画廊</h1>
            <p className="text-gray-600 dark:text-gray-400">探索精彩的 AI 上色作品</p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 space-y-4"
          >
            {/* Tags - 横向滚动 */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedTag === tag
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30'
                      : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-gray-200 dark:border-gray-800'
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {featured ? '精选作品' : selectedTag === '全部' ? '全部作品' : `#${selectedTag}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <ArrowsUpDownIcon className="w-5 h-5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-700 dark:text-gray-300"
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
                  className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  {order === 'desc' ? '↓' : '↑'}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Gallery - Masonry Layout */}
          <MasonryLayout columns={4} gap="md" className="space-y-4">
            {loading && artworks.length === 0
              ? Array.from({ length: 12 }).map((_, i) => (
                  <ArtworkCardSkeleton key={i} />
                ))
              : artworks.map((artwork, index) => (
                  <motion.div
                    key={artwork.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.03, ease: [0.25, 0.1, 0.25, 1] }}
                    className="break-inside-avoid mb-4"
                  >
                    <ArtworkCard
                      artwork={artwork}
                      index={index}
                      onQuickView={() => handleOpenLightbox(index)}
                    />
                  </motion.div>
                ))}
          </MasonryLayout>

          {/* Infinite Scroll Loader */}
          {!loading && hasMore && artworks.length > 0 && (
            <div ref={loaderRef} className="py-8 text-center">
              <div className="inline-block w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">加载中...</p>
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">暂无作品</h3>
              <p className="text-gray-500 dark:text-gray-400">
                还没有符合条件的作品，快去上传第一张吧！
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Lightbox - 快速预览 */}
      <Lightbox
        artworks={artworks}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={handleCloseLightbox}
        onNavigate={handleLightboxNavigate}
      />
    </>
  );
}
