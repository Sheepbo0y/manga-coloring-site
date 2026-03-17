import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FireIcon } from '@heroicons/react/24/solid';
import { artworkApi } from '@/lib/api';
import { ArtworkCard } from '@/components/ArtworkCard';
import type { Artwork } from '@/types';

export function HomePage() {
  const [featuredArtworks, setFeaturedArtworks] = useState<Artwork[]>([]);
  const [latestArtworks, setLatestArtworks] = useState<Artwork[]>([]);
  const [popularArtworks, setPopularArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [featured, latest, popular] = await Promise.all([
          artworkApi.getFeatured(6),
          artworkApi.getList({ limit: 8, sortBy: 'createdAt', order: 'desc' }),
          artworkApi.getPopular(8),
        ]);

        setFeaturedArtworks(featured.data.data || []);
        setLatestArtworks(latest.data.data || []);
        setPopularArtworks(popular.data.data || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Carousel */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                精选作品
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">发现最精彩的漫画上色作品</p>
            </div>
            <Link
              to="/gallery?featured=true"
              className="group flex items-center text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              查看更多
              <motion.span
                className="ml-1"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </Link>
          </div>
          <div className="HeroCarousel-wrapper">
            {featuredArtworks.length > 0 ? (
              <motion.div
                className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-soft-lg"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.3 }}
              >
                {featuredArtworks.map((artwork, index) => (
                  <motion.div
                    key={artwork.id}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: index === 0 ? 1 : 0, scale: index === 0 ? 1 : 1.05 }}
                    transition={{ duration: 0.8, delay: index * 0.2 }}
                    className="absolute inset-0"
                  >
                    <Link to={`/artwork/${artwork.id}`} className="block h-full">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <motion.img
                        src={artwork.colorizations?.[0]?.colorizedImage || artwork.coverImage}
                        alt={artwork.title}
                        className="w-full h-full object-cover"
                        animate={{ scale: index === 0 ? 1.05 : 1 }}
                        transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                        <motion.h2
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.6 }}
                          className="text-3xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg"
                        >
                          {artwork.title}
                        </motion.h2>
                        {artwork.description && (
                          <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="text-gray-200 text-sm md:text-base line-clamp-2 max-w-2xl drop-shadow"
                          >
                            {artwork.description}
                          </motion.p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="relative h-[400px] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 rounded-3xl animate-pulse" />
            )}
          </div>
        </motion.section>

        {/* Latest Uploads */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                最新上传
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">探索最新 uploaded 的作品</p>
            </div>
            <Link
              to="/gallery?sort=createdAt"
              className="group flex items-center text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              查看更多
              <motion.span
                className="ml-1"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
                ))
              : latestArtworks.map((artwork, index) => (
                  <motion.div
                    key={artwork.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ duration: 0.5, delay: index * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <ArtworkCard artwork={artwork} index={index} />
                  </motion.div>
                ))}
          </div>
        </motion.section>

        {/* Popular Rankings */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-2.5">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <FireIcon className="w-7 h-7 text-gradient-accent bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                  热门排行
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">最受欢迎的作品排行榜</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
                ))
              : popularArtworks.map((artwork, index) => (
                  <motion.div
                    key={artwork.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ duration: 0.5, delay: index * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
                    className="relative"
                  >
                    <ArtworkCard artwork={artwork} index={index} />
                    {index < 3 && (
                      <motion.div
                        initial={{ scale: 0, rotate: -15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.6 + index * 0.15, type: 'spring', stiffness: 500, damping: 15 }}
                        className={`absolute -top-3 -left-3 w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow-lg shadow-black/20 z-10 ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                          'bg-gradient-to-br from-amber-500 to-amber-700'
                        }`}
                      >
                        <span className="drop-shadow">{index + 1}</span>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
