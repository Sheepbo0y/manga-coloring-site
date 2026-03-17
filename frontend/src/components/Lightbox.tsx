import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import type { Artwork } from '@/types';
import { getImageUrl } from '@/lib/utils';

interface LightboxProps {
  artworks: Artwork[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (index: number) => void;
}

export function Lightbox({
  artworks,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: LightboxProps) {
  const [current, setCurrent] = useState(currentIndex);

  useEffect(() => {
    setCurrent(currentIndex);
  }, [currentIndex]);

  const handlePrev = useCallback(() => {
    const newIndex = current > 0 ? current - 1 : artworks.length - 1;
    setCurrent(newIndex);
    onNavigate?.(newIndex);
  }, [current, artworks.length, onNavigate]);

  const handleNext = useCallback(() => {
    const newIndex = current < artworks.length - 1 ? current + 1 : 0;
    setCurrent(newIndex);
    onNavigate?.(newIndex);
  }, [current, artworks.length, onNavigate]);

  const handleDownload = useCallback(async () => {
    const artwork = artworks[current];
    const imageUrl = getImageUrl(artwork.colorizations?.[0]?.colorizedImage) || getImageUrl(artwork.coverImage);

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${artwork.title || 'artwork'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [artworks, current]);

  const handleShare = useCallback(async () => {
    const artwork = artworks[current];
    const shareUrl = `${window.location.origin}/artwork/${artwork.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: artwork.title,
          text: artwork.description || `查看 ${artwork.title}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  }, [artworks, current]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    },
    [onClose, handlePrev, handleNext]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const artwork = artworks[current];
  const imageUrl = getImageUrl(artwork?.colorizations?.[0]?.colorizedImage) || getImageUrl(artwork?.coverImage);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors z-50"
          >
            <XMarkIcon className="w-8 h-8" />
          </button>

          {/* Navigation buttons */}
          {artworks.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-4 p-3 text-white/80 hover:text-white transition-colors z-50 bg-white/10 rounded-full hover:bg-white/20"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 p-3 text-white/80 hover:text-white transition-colors z-50 bg-white/10 rounded-full hover:bg-white/20"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Action buttons */}
          <div className="absolute bottom-4 right-4 flex gap-2 z-50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="p-2 text-white/80 hover:text-white transition-colors bg-white/10 rounded-full hover:bg-white/20"
              title="下载"
            >
              <ArrowDownTrayIcon className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="p-2 text-white/80 hover:text-white transition-colors bg-white/10 rounded-full hover:bg-white/20"
              title="分享"
            >
              <ShareIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Image */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-full max-h-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {imageUrl && (
              <img
                src={imageUrl}
                alt={artwork?.title || 'Artwork'}
                className="max-w-full max-h-[90vh] object-contain"
              />
            )}
          </motion.div>

          {/* Image info */}
          {artwork && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-4 left-4 right-16 text-white z-50"
            >
              <h3 className="text-lg font-semibold">{artwork.title}</h3>
              {artwork.description && (
                <p className="text-sm text-white/70 mt-1 line-clamp-2">
                  {artwork.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-white/50">
                <span>{current + 1} / {artworks.length}</span>
                <span>{artwork.tags?.slice(0, 3).join(' · ') || ''}</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
