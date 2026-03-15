import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PhotoIcon, HeartIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';
import { authApi, collectionApi, artworkApi } from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { TextArea } from '@/components/Input';
import { ArtworkCard } from '@/components/ArtworkCard';
import { formatDate } from '@/lib/utils';
import type { Artwork } from '@/types';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'artworks' | 'collections' | 'settings'>('artworks');
  const [myArtworks, setMyArtworks] = useState<Artwork[]>([]);
  const [collections, setCollections] = useState<Artwork[]>([]);

  // Settings form
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user) {
      setUsername(user.username);
      setBio(user.bio || '');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (activeTab === 'artworks') {
      loadMyArtworks();
    } else if (activeTab === 'collections') {
      loadCollections();
    }
  }, [activeTab]);

  const loadMyArtworks = async () => {
    try {
      const response = await artworkApi.getMyArtworks({ limit: 12 });
      setMyArtworks(response.data.data || []);
    } catch {
      toast.error('加载作品失败');
    }
  };

  const loadCollections = async () => {
    try {
      const response = await collectionApi.getList({ limit: 12 });
      setCollections(response.data.data || []);
    } catch {
      toast.error('加载收藏失败');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await authApi.updateProfile({ username, bio });
      const updatedUser = response.data.user;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('资料更新成功');
    } catch {
      toast.error('更新失败');
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('请填写密码信息');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('新密码至少需要 6 个字符');
      return;
    }

    try {
      await authApi.updatePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      toast.success('密码修改成功');
    } catch {
      toast.error('修改失败，请检查当前密码是否正确');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('已退出登录');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-700" />
          <div className="px-6 pb-6">
            <div className="flex items-end -mt-12 mb-4">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-24 h-24 rounded-full border-4 border-white"
                />
              ) : (
                <div className="w-24 h-24 bg-primary-100 rounded-full border-4 border-white flex items-center justify-center">
                  <span className="text-primary-600 text-3xl font-bold">
                    {user?.username[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div className="ml-4 pb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user?.username}
                </h1>
                <p className="text-gray-500">{user?.email}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              {[
                { id: 'artworks', label: '我的作品', icon: PhotoIcon },
                { id: 'collections', label: '我的收藏', icon: HeartIcon },
                { id: 'settings', label: '账号设置', icon: Cog6ToothIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'artworks' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                我的作品 ({myArtworks.length})
              </h2>
              <Link to="/upload" className="btn-primary">
                上传新作品
              </Link>
            </div>

            {myArtworks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {myArtworks.map((artwork) => (
                  <ArtworkCard key={artwork.id} artwork={artwork} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <PhotoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  还没有作品
                </h3>
                <p className="text-gray-500 mb-4">
                  上传你的第一张漫画作品，体验 AI 上色的魅力
                </p>
                <Link to="/upload" className="btn-primary">
                  去上传
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'collections' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              我的收藏 ({collections.length})
            </h2>

            {collections.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {collections.map((artwork) => (
                  <ArtworkCard key={artwork.id} artwork={artwork} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <HeartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  还没有收藏
                </h3>
                <p className="text-gray-500 mb-4">
                  去画廊发现喜欢的作品并收藏吧
                </p>
                <Link to="/gallery" className="btn-primary">
                  逛画廊
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Profile Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                基本信息
              </h3>
              <div className="space-y-4">
                <Input
                  label="用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={20}
                />
                <TextArea
                  label="个人简介"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={200}
                  rows={3}
                />
                <Button onClick={handleUpdateProfile}>
                  保存修改
                </Button>
              </div>
            </div>

            {/* Password Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                修改密码
              </h3>
              <div className="space-y-4">
                <Input
                  label="当前密码"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Input
                  label="新密码"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                />
                <Button onClick={handleUpdatePassword}>
                  修改密码
                </Button>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                账号信息
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">账号 ID</span>
                  <span className="text-gray-900 font-mono">{user?.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">注册时间</span>
                  <span className="text-gray-900">
                    {user?.createdAt ? formatDate(user.createdAt) : '-'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">账号角色</span>
                  <span className="text-gray-900">
                    {user?.role === 'ADMIN' ? '管理员' :
                     user?.role === 'MODERATOR' ? '版主' : '普通用户'}
                  </span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 rounded-xl border border-red-200 p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-4">
                危险区域
              </h3>
              <Button variant="danger" onClick={handleLogout}>
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
                退出登录
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
