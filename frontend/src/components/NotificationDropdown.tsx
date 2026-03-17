import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BellIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  StarIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';
import { notificationApi } from '@/lib/api';
import type { Notification } from '@/types';

interface NotificationDropdownProps {
  onClose?: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [isAuthenticated]);

  async function loadNotifications() {
    try {
      setLoading(true);
      const response = await notificationApi.getList({ limit: 10 });
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('加载通知失败:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadUnreadCount() {
    try {
      const response = await notificationApi.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('加载未读数量失败:', error);
    }
  }

  async function handleMarkAsRead(notificationId: string) {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
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

  if (!isAuthenticated) {
    return (
      <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-4 text-center text-gray-500">
          <p>登录后查看通知</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellIcon className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">通知</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            全部已读
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <BellIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p>暂无通知</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleMarkAsRead(notification.id)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.isRead ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        !notification.isRead
                          ? 'font-medium text-gray-900'
                          : 'text-gray-600'
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
                        className="text-xs text-primary-600 hover:text-primary-700 mt-1 block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        查看作品：{notification.artwork.title}
                      </Link>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    className="flex-shrink-0 text-gray-400 hover:text-red-500"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <Link
          to="/notifications"
          className="text-sm text-primary-600 hover:text-primary-700 text-center block"
          onClick={onClose}
        >
          查看全部通知
        </Link>
      </div>
    </div>
  );
}
