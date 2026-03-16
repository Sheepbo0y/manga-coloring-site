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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Carousel */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">精选作品</h1>
            <Link
              to="/gallery?featured=true"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              查看更多 →
            </Link>
          </div>
          <div className="HeroCarousel-wrapper">
            {featuredArtworks.length > 0 ? (
              <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden shadow-xl">
                {featuredArtworks.map((artwork, index) => (
                  <motion.div
                    key={artwork.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: index === 0 ? 1 : 0 }}
                    transition={{ duration: 0.8, delay: index * 0.2 }}
                    className="absolute inset-0"
                  >
                    <Link to={`/artwork/${artwork.id}`} className="block h-full">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <img
                        src={artwork.colorizations?.[0]?.colorizedImage || artwork.coverImage}
                        alt={artwork.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                        <motion.h2
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                          className="text-2xl md:text-4xl font-bold text-white mb-2"
                        >
                          {artwork.title}
                        </motion.h2>
                        {artwork.description && (
                          <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="text-gray-200 text-sm md:text-base line-clamp-2 max-w-2xl"
                          >
                            {artwork.description}
                          </motion.p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="relative h-96 bg-gray-200 animate-pulse rounded-2xl" />
            )}
          </div>
        </motion.section>

        {/* Latest Uploads */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">最新上传</h2>
            <Link
              to="/gallery?sort=createdAt"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              查看更多 →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-gray-200 rounded-xl animate-pulse" />
                ))
              : latestArtworks.map((artwork, index) => (
                  <motion.div
                    key={artwork.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <ArtworkCard artwork={artwork} />
                  </motion.div>
                ))}
          </div>
        </motion.section>

        {/* Popular Rankings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center space-x-2 mb-4">
            <FireIcon className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900">热门排行</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-gray-200 rounded-xl animate-pulse" />
                ))
              : popularArtworks.map((artwork, index) => (
                  <motion.div
                    key={artwork.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="relative"
                  >
                    <ArtworkCard artwork={artwork} />
                    {index < 3 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8 + index * 0.1, type: 'spring', stiffness: 500 }}
                        className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          'bg-amber-600'
                        }`}
                      >
                        {index + 1}
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
