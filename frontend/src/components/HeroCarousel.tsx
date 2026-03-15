import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { artworkApi } from '@/lib/api';
import type { Artwork } from '@/types';

export function HeroCarousel() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    artworkApi.getFeatured(6).then((res) => {
      setArtworks(res.data.data || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (artworks.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % artworks.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [artworks.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + artworks.length) % artworks.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % artworks.length);
  };

  if (loading || artworks.length === 0) {
    return (
      <div className="relative h-96 bg-gray-200 animate-pulse rounded-2xl overflow-hidden" />
    );
  }

  return (
    <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden shadow-xl">
      {/* Slides */}
      {artworks.map((artwork, index) => (
        <div
          key={artwork.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Link to={`/artwork/${artwork.id}`} className="block h-full">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />
            <img
              src={artwork.colorizations?.[0]?.colorizedImage || artwork.coverImage}
              alt={artwork.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-20">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">
                {artwork.title}
              </h2>
              {artwork.description && (
                <p className="text-gray-200 text-sm md:text-base line-clamp-2 max-w-2xl">
                  {artwork.description}
                </p>
              )}
              <div className="mt-4 flex items-center space-x-4">
                <span className="text-gray-300 text-sm">
                  {artwork.user?.username}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-300 text-sm">
                  {artwork.views} 次观看
                </span>
              </div>
            </div>
          </Link>
        </div>
      ))}

      {/* Navigation buttons */}
      {artworks.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-colors"
          >
            <ChevronLeftIcon className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-colors"
          >
            <ChevronRightIcon className="w-6 h-6 text-white" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
            {artworks.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-8 bg-white'
                    : 'bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
