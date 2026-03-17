import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HeartIcon,
  EyeIcon,
  ShareIcon,
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  ArrowsPointingOutIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { artworkApi, collectionApi } from '@/lib/api';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { ImageCompare } from '@/components/ImageCompare';
import { formatDate, formatDuration, formatNumber } from '@/lib/utils';
import type { Artwork } from '@/types';

export function ArtworkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [liked, setLiked] = useState(false);
  const [collected, setCollected] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;

    artworkApi
      .getById(id)
      .then((res) => {
        setArtwork(res.data.data);
      })
      .catch((error) => {
        console.error('Failed to fetch artwork:', error);
        toast.error('获取作品失败');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (artwork?.id) {
      collectionApi.check(artwork.id).then((res) => {
        setCollected(res.data.isCollected);
      });
    }
  }, [artwork?.id]);

  const handleLike = async () => {
    if (!artwork) return;

    try {
      await artworkApi.like(artwork.id);
      setArtwork({ ...artwork, likes: artwork.likes + 1 });
      setLiked(true);
      toast.success('点赞成功');
    } catch {
      toast.error('点赞失败');
    }
  };

  const handleCollect = async () => {
    if (!artwork) return;

    try {
      if (collected) {
        await collectionApi.remove(artwork.id);
        setCollected(false);
        toast.success('已取消收藏');
      } else {
        await collectionApi.add(artwork.id);
        setCollected(true);
        toast.success('收藏成功');
      }
    } catch {
      toast.error('操作失败');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: artwork?.title || '漫画上色作品',
      text: artwork?.description || '快来看看这个精彩的 AI 上色作品！',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('分享成功');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('链接已复制到剪贴板');
      }
    } catch {
      toast.error('分享失败');
    }
  };

  const handleDownload = useCallback(async () => {
    if (!artwork) return;

    const imageUrl = artwork.colorizations?.[0]?.colorizedImage || artwork.coverImage;
    if (!imageUrl) {
      toast.error('没有可下载的图片');
      return;
    }

    setDownloading(true);
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
      toast.success('下载成功');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('下载失败，请重试');
    } finally {
      setDownloading(false);
    }
  }, [artwork]);

  const handleFullscreen = useCallback(() => {
    setFullscreenOpen(true);
  }, []);

  const handleCloseFullscreen = useCallback(() => {
    setFullscreenOpen(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">作品不存在</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">该作品可能已被删除</p>
          <Link to="/gallery" className="btn-primary">
            返回画廊
          </Link>
        </div>
      </div>
    );
  }

  const colorizedImage = artwork.colorizations?.[0]?.colorizedImage;
  const originalImage = artwork.originalImage;
  const isProcessing = artwork.status === 'PROCESSING' || artwork.status === 'PENDING';
  const isFailed = artwork.status === 'FAILED';
  const displayImage = colorizedImage || originalImage;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back button */}
          <div className="mb-6">
            <Link
              to="/gallery"
              className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              返回画廊
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Image */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 overflow-hidden">
                {/* Status Banner */}
                {isProcessing && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-yellow-800 dark:text-yellow-300 font-medium">
                          正在处理中...
                        </span>
                      </div>
                      <Badge variant="warning">
                        {artwork.colorizations?.[0]?.progress || 0}%
                      </Badge>
                    </div>
                  </div>
                )}

                {isFailed && (
                  <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-3">
                    <p className="text-red-800 dark:text-red-300">
                      处理失败：{artwork.colorizations?.[0]?.errorMessage || '未知错误'}
                    </p>
                  </div>
                )}

                {/* Image Container */}
                <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 group">
                  {colorizedImage && !isProcessing && !isFailed ? (
                    compareMode ? (
                      <ImageCompare
                        beforeImage={originalImage}
                        afterImage={colorizedImage}
                        beforeLabel="原图"
                        afterLabel="上色后"
                        className="w-full h-full"
                      />
                    ) : (
                      <img
                        src={colorizedImage}
                        alt={artwork.title}
                        className="w-full h-full object-contain"
                      />
                    )
                  ) : (
                    <img
                      src={originalImage}
                      alt={artwork.title}
                      className="w-full h-full object-contain"
                    />
                  )}

                  {/* Image Actions Overlay */}
                  {displayImage && !isProcessing && !isFailed && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                      <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={handleFullscreen}
                          className="p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full text-gray-700 dark:text-gray-300 hover:bg-primary-500 hover:text-white transition-all shadow-lg"
                          title="全屏查看"
                        >
                          <ArrowsPointingOutIcon className="w-6 h-6" />
                        </button>
                        <button
                          onClick={handleDownload}
                          disabled={downloading}
                          className="p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full text-gray-700 dark:text-gray-300 hover:bg-primary-500 hover:text-white transition-all shadow-lg disabled:opacity-50"
                          title="下载图片"
                        >
                          {downloading ? (
                            <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <ArrowDownTrayIcon className="w-6 h-6" />
                          )}
                        </button>
                        <button
                          onClick={handleShare}
                          className="p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full text-gray-700 dark:text-gray-300 hover:bg-primary-500 hover:text-white transition-all shadow-lg"
                          title="分享"
                        >
                          <ShareIcon className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Compare Toggle */}
                {colorizedImage && !isProcessing && !isFailed && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
                    <button
                      onClick={() => setCompareMode(!compareMode)}
                      className={`text-sm font-medium flex items-center gap-2 transition-colors ${
                        compareMode
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
                      }`}
                    >
                      <PencilIcon className="w-4 h-4" />
                      {compareMode ? '退出对比模式' : '滑动对比原图/上色后'}
                    </button>
                    <button
                      onClick={handleFullscreen}
                      className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-2 transition-colors"
                    >
                      <ArrowsPointingOutIcon className="w-4 h-4" />
                      全屏查看
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Info Panel */}
            <div className="space-y-6">
              {/* Title and Actions */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {artwork.title}
                </h1>

                {artwork.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{artwork.description}</p>
                )}

                {/* Tags */}
                {artwork.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {artwork.tags.map((tag) => (
                      <Link
                        key={tag}
                        to={`/gallery?tag=${encodeURIComponent(tag)}`}
                      >
                        <Badge variant="primary">#{tag}</Badge>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span className="flex items-center">
                    <EyeIcon className="w-4 h-4 mr-1" />
                    {formatNumber(artwork.views)} 次浏览
                  </span>
                  <button
                    onClick={handleLike}
                    className={`flex items-center transition-colors ${
                      liked ? 'text-red-500' : 'hover:text-red-500 dark:hover:text-red-400'
                    }`}
                  >
                    {liked ? (
                      <HeartSolidIcon className="w-4 h-4 mr-1" />
                    ) : (
                      <HeartIcon className="w-4 h-4 mr-1" />
                    )}
                    {formatNumber(artwork.likes)} 次点赞
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleCollect}
                    variant={collected ? 'primary' : 'secondary'}
                    className="flex-1"
                  >
                    {collected ? '已收藏' : '收藏'}
                  </Button>
                  <Button
                    onClick={handleDownload}
                    variant="secondary"
                    disabled={downloading}
                    className="disabled:opacity-50"
                  >
                    {downloading ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowDownTrayIcon className="w-5 h-5" />
                    )}
                  </Button>
                  <Button onClick={handleShare} variant="secondary">
                    <ShareIcon className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Author Info */}
              {artwork.user && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 p-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">作者</h3>
                  <div className="flex items-center space-x-3">
                    {artwork.user.avatar ? (
                      <img
                        src={artwork.user.avatar}
                        alt={artwork.user.username}
                        className="w-12 h-12 rounded-full ring-2 ring-gray-100 dark:ring-gray-800"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 dark:text-primary-400 font-medium">
                          {artwork.user.username[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {artwork.user.username}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Processing Info */}
              {artwork.colorizations?.[0]?.processingTime && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 p-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                    处理信息
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">处理时间</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {formatDuration(artwork.colorizations[0].processingTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">完成时间</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {formatDate(artwork.colorizations[0].updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Time */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 p-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  发布于 {formatDate(artwork.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {fullscreenOpen && displayImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            onClick={handleCloseFullscreen}
          >
            {/* Close button */}
            <button
              onClick={handleCloseFullscreen}
              className="absolute top-4 right-4 p-3 text-white/80 hover:text-white transition-colors z-50 bg-white/10 rounded-full hover:bg-white/20"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>

            {/* Image */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-full max-h-full p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {compareMode && originalImage && colorizedImage ? (
                <ImageCompare
                  beforeImage={originalImage}
                  afterImage={colorizedImage}
                  beforeLabel="原图"
                  afterLabel="上色后"
                  className="max-w-full max-h-[90vh] object-contain"
                />
              ) : (
                <img
                  src={displayImage}
                  alt={artwork.title}
                  className="max-w-full max-h-[90vh] object-contain"
                />
              )}
            </motion.div>

            {/* Bottom actions */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-50">
              <div className="text-white">
                <h3 className="text-lg font-semibold">{artwork.title}</h3>
                {artwork.description && (
                  <p className="text-sm text-white/70 mt-1 line-clamp-1">
                    {artwork.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCompareMode(!compareMode)}
                  className="p-2 text-white/80 hover:text-white transition-colors bg-white/10 rounded-full hover:bg-white/20"
                  title="对比模式"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="p-2 text-white/80 hover:text-white transition-colors bg-white/10 rounded-full hover:bg-white/20 disabled:opacity-50"
                  title="下载"
                >
                  {downloading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowDownTrayIcon className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 text-white/80 hover:text-white transition-colors bg-white/10 rounded-full hover:bg-white/20"
                  title="分享"
                >
                  <ShareIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
