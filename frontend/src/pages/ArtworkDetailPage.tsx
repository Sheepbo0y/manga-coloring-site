import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HeartIcon,
  EyeIcon,
  ShareIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
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
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('链接已复制到剪贴板');
    } catch {
      toast.error('复制失败');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">作品不存在</h1>
          <p className="text-gray-600 mb-4">该作品可能已被删除</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Link
            to="/gallery"
            className="inline-flex items-center text-gray-600 hover:text-primary-600"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            返回画廊
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Image */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Status Banner */}
              {isProcessing && (
                <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-yellow-800 font-medium">
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
                <div className="bg-red-50 border-b border-red-200 px-4 py-3">
                  <p className="text-red-800">
                    处理失败：{artwork.colorizations?.[0]?.errorMessage || '未知错误'}
                  </p>
                </div>
              )}

              {/* Image Container */}
              <div className="aspect-[4/3] bg-gray-100">
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
              </div>

              {/* Compare Toggle */}
              {colorizedImage && !isProcessing && !isFailed && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <button
                    onClick={() => setCompareMode(!compareMode)}
                    className={`text-sm font-medium ${
                      compareMode
                        ? 'text-primary-600'
                        : 'text-gray-600 hover:text-primary-600'
                    }`}
                  >
                    {compareMode ? '退出对比模式' : '滑动对比原图/上色后'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Title and Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {artwork.title}
              </h1>

              {artwork.description && (
                <p className="text-gray-600 mb-4">{artwork.description}</p>
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
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center">
                  <EyeIcon className="w-4 h-4 mr-1" />
                  {formatNumber(artwork.views)} 次浏览
                </span>
                <button
                  onClick={handleLike}
                  className={`flex items-center ${
                    liked ? 'text-red-500' : 'hover:text-red-500'
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
              <div className="flex space-x-3">
                <Button
                  onClick={handleCollect}
                  variant={collected ? 'primary' : 'secondary'}
                  className="flex-1"
                >
                  {collected ? '已收藏' : '收藏'}
                </Button>
                <Button onClick={handleShare} variant="secondary">
                  <ShareIcon className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Author Info */}
            {artwork.user && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-4">作者</h3>
                <div className="flex items-center space-x-3">
                  {artwork.user.avatar ? (
                    <img
                      src={artwork.user.avatar}
                      alt={artwork.user.username}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-medium">
                        {artwork.user.username[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {artwork.user.username}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Processing Info */}
            {artwork.colorizations?.[0]?.processingTime && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-4">
                  处理信息
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">处理时间</span>
                    <span className="text-gray-900">
                      {formatDuration(artwork.colorizations[0].processingTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">完成时间</span>
                    <span className="text-gray-900">
                      {formatDate(artwork.colorizations[0].updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Time */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm text-gray-500">
                发布于 {formatDate(artwork.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
