import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BellIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  StarIcon,
  UserPlusIcon,
  TrashIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { notificationApi } from '@/lib/api';
import { Button } from '@/components/Button';
import type { Notification } from '@/types';

export function NotificationPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  async function loadNotifications() {
    try {
      setLoading(true);
      const response = await notificationApi.getList({
        limit: 50,
        unread: filter === 'unread',
      });
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('加载通知失败:', error);
      toast.error('加载通知失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(notificationId: string) {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      toast.success('已标记为已读');
    } catch (error) {
      console.error('标记已读失败:', error);
      toast.error('操作失败');
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('已标记所有通知为已读');
    } catch (error) {
      console.error('标记全部已读失败:', error);
      toast.error('操作失败');
    }
  }

  async function handleDelete(notificationId: string) {
    try {
      await notificationApi.delete(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success('删除成功');
    } catch (error) {
      console.error('删除通知失败:', error);
      toast.error('删除失败');
    }
  }

  function getNotificationIcon(type: Notification['type']) {
    switch (type) {
      case 'NEW_COMMENT':
        return <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-500" />;
      case 'NEW_FOLLOW':
        return <UserPlusIcon className="w-5 h-5 text-green-500" />;
      case 'NEW_LIKE':
        return <HeartIcon className="w-5 h-5 text-red-500" />;
      case 'ARTWORK_FEATUREED':
        return <StarIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <BellIcon className="w-5 h-5 text-gray-500" />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellIcon className="w-6 h-6 text-gray-600" />
                <h1 className="text-xl font-bold text-gray-900">通知中心</h1>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                <CheckIcon className="w-4 h-4 mr-1" />
                全部已读
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-6 py-3 border-b border-gray-100 flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`pb-2 text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              全部通知
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`pb-2 text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              未读通知
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <BellIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'unread' ? '没有未读通知' : '暂无通知'}
              </h3>
              <p className="text-gray-500">
                {filter === 'unread'
                  ? '所有通知都已读'
                  : '当有新评论、新关注时会在这里显示'}
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow ${
                  !notification.isRead ? 'border-blue-200 bg-blue-50/30' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        !notification.isRead
                          ? 'font-semibold text-gray-900'
                          : 'text-gray-700'
                      }`}
                    >
                      {notification.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.createdAt).toLocaleString('zh-CN')}
                    </p>
                    {notification.artwork && (
                      <Link
                        to={`/artwork/${notification.artwork.id}`}
                        className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-block"
                      >
                        查看作品：{notification.artwork.title}
                      </Link>
                    )}
                    {notification.fromUser && !notification.artwork && (
                      <Link
                        to={`/user/${notification.fromUser.id}`}
                        className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-block"
                      >
                        查看 @{notification.fromUser.username} 的主页
                      </Link>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex gap-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-gray-400 hover:text-primary-600 p-1"
                        title="标记为已读"
                      >
                        <CheckIcon className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="text-gray-400 hover:text-red-600 p-1"
                      title="删除"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
