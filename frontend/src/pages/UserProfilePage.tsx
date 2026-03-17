import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PhotoIcon, HeartIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';
import { userApi, followApi } from '@/lib/api';
import { ArtworkCard } from '@/components/ArtworkCard';
import { formatDate } from '@/lib/utils';
import type { User, Artwork } from '@/types';
import { Button } from '@/components/Button';

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followingLoading, setFollowingLoading] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [id]);

  async function loadUserProfile() {
    if (!id) return;
    try {
      setLoading(true);
      const response = await userApi.getById(id);
      setUser(response.data.user);
      setIsFollowing(response.data.isFollowing);
      loadArtworks(id);
    } catch (error) {
      console.error('加载用户信息失败:', error);
      toast.error('加载用户信息失败');
    } finally {
      setLoading(false);
    }
  }

  async function loadArtworks(userId: string) {
    try {
      const response = await userApi.getArtworks(userId, { limit: 12 });
      setArtworks(response.data.data || []);
    } catch (error) {
      console.error('加载用户作品失败:', error);
    }
  }

  async function handleFollow() {
    if (!id || !isAuthenticated) {
      toast.error('请先登录');
      return;
    }

    try {
      setFollowingLoading(true);
      if (isFollowing) {
        await followApi.unfollow(id);
        setIsFollowing(false);
        toast.success('已取消关注');
      } else {
        await followApi.follow(id);
        setIsFollowing(true);
        toast.success('关注成功');
      }
      // 更新用户关注数
      if (user) {
        const currentFollowers = user._count?.followers ?? 0;
        const newFollowers = currentFollowers + (isFollowing ? -1 : 1);
        setUser({
          ...user,
          _count: {
            artworks: user._count?.artworks ?? 0,
            followers: newFollowers,
            follows: user._count?.follows ?? 0,
            collections: user._count?.collections ?? 0,
          },
        });
      }
    } catch (error) {
      console.error('关注操作失败:', error);
      toast.error('操作失败');
    } finally {
      setFollowingLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">用户不存在</h2>
          <Link to="/gallery" className="btn-primary">
            返回画廊
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 用户头部 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="h-32 md:h-48 bg-gradient-to-r from-primary-400 via-purple-500 to-pink-500" />
          <div className="px-6 pb-6">
            <div className="flex items-end -mt-12 mb-4">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <span className="text-primary-600 text-3xl md:text-4xl font-bold">
                    {user.username[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div className="ml-4 pb-2 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {user.username}
                    </h1>
                    <p className="text-gray-500 text-sm">
                      加入于 {formatDate(user.createdAt)}
                    </p>
                  </div>
                  {currentUser?.id !== user.id && (
                    <Button
                      onClick={handleFollow}
                      disabled={followingLoading}
                      variant={isFollowing ? 'secondary' : 'primary'}
                    >
                      {followingLoading ? '加载中...' : isFollowing ? '已关注' : '关注'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* 简介 */}
            {user.bio && (
              <p className="text-gray-600 mb-4">{user.bio}</p>
            )}

            {/* 统计数据 */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center text-gray-600">
                <PhotoIcon className="w-5 h-5 mr-2" />
                <span className="font-semibold text-gray-900 mr-1">
                  {user._count?.artworks || 0}
                </span>
                作品
              </div>
              <div className="flex items-center text-gray-600">
                <HeartIcon className="w-5 h-5 mr-2" />
                <span className="font-semibold text-gray-900 mr-1">
                  {user._count?.collections || 0}
                </span>
                收藏
              </div>
              <div className="flex items-center text-gray-600 cursor-pointer hover:text-primary-600">
                <UsersIcon className="w-5 h-5 mr-2" />
                <span className="font-semibold text-gray-900 mr-1">
                  {user._count?.followers || 0}
                </span>
                粉丝
              </div>
              <div className="flex items-center text-gray-600 cursor-pointer hover:text-primary-600">
                <UsersIcon className="w-5 h-5 mr-2" />
                <span className="font-semibold text-gray-900 mr-1">
                  {user._count?.follows || 0}
                </span>
                关注
              </div>
            </div>
          </div>
        </div>

        {/* 用户作品 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            作品 ({artworks.length})
          </h2>

          {artworks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {artworks.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={artwork} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <PhotoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                还没有作品
              </h3>
              <p className="text-gray-500">
                该用户还没有上传任何作品
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
