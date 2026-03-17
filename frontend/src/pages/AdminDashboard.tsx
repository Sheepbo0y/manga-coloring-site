import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, userApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { User, AdminStats } from '@/types';

interface AdminUser extends User {
  isAdmin: boolean;
  freeCredits: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');

  useEffect(() => {
    loadStats();
    loadUsers();
  }, []);

  const loadStats = async () => {
    try {
      const res = await adminApi.getStats();
      setStats(res.data.data);
    } catch (error: any) {
      toast.error('加载统计数据失败：' + (error.response?.data?.error || '未知错误'));
    }
  };

  const loadUsers = async () => {
    try {
      const res = await adminApi.getUsers({ limit: 50 });
      setUsers(res.data.data);
    } catch (error: any) {
      toast.error('加载用户列表失败：' + (error.response?.data?.error || '未知错误'));
    } finally {
      setUserLoading(false);
    }
  };

  const handleOpenCreditModal = (user: AdminUser) => {
    setSelectedUser(user);
    setCreditAmount('');
    setCreditReason('');
    setShowCreditModal(true);
  };

  const handleUpdateCredits = async () => {
    if (!selectedUser) return;

    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount === 0) {
      toast.error('请输入有效的调整数量');
      return;
    }

    try {
      await adminApi.updateUserCredits(selectedUser.id, {
        amount,
        reason: creditReason || '管理员手动调整',
      });
      toast.success(`成功为用户 ${selectedUser.username} 调整${amount > 0 ? '增加' : '减少'}${Math.abs(amount)}次次数`);
      setShowCreditModal(false);
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || '调整次数失败');
    }
  };

  const statsCards = stats ? [
    { title: '总用户数', value: stats.totalUsers, color: 'bg-blue-500' },
    { title: '总作品数', value: stats.totalArtworks, color: 'bg-green-500' },
    { title: '总上色次数', value: stats.totalColorizations, color: 'bg-purple-500' },
    { title: '总收藏数', value: stats.totalCollections, color: 'bg-yellow-500' },
    { title: '今日上色', value: stats.todayColorizations, color: 'bg-pink-500' },
  ] : [];

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">管理员后台</h1>
            <Link
              to="/"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              返回首页
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 统计卡片 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">系统统计</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {statsCards.map((card) => (
              <div
                key={card.title}
                className={`${card.color} rounded-lg p-4 text-white shadow-lg`}
              >
                <p className="text-sm opacity-80">{card.title}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 用户管理 */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">用户管理</h2>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
            {userLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="mt-2 text-gray-600 dark:text-gray-400">加载用户列表中...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">用户</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">邮箱</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">角色</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">剩余次数</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">作品数</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm">
                                {user.username[0].toUpperCase()}
                              </div>
                            )}
                            <span className="text-gray-900 dark:text-white font-medium">{user.username}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.isAdmin || user.role === 'ADMIN'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}>
                            {user.isAdmin || user.role === 'ADMIN' ? '管理员' : '普通用户'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-green-600 dark:text-green-400 font-medium">{user.freeCredits}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {user._count?.artworks || 0}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleOpenCreditModal(user)}
                            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                          >
                            调整次数
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 调整次数弹窗 */}
      {showCreditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              调整用户次数 - {selectedUser.username}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              当前剩余次数：<span className="text-green-600 dark:text-green-400 font-medium">{selectedUser.freeCredits}</span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  调整数量
                </label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="正数增加，负数减少"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  原因（可选）
                </label>
                <input
                  type="text"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  placeholder="如：新用户奖励、活动赠送等"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateCredits}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                确认调整
              </button>
              <button
                onClick={() => setShowCreditModal(false)}
                className="flex-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
