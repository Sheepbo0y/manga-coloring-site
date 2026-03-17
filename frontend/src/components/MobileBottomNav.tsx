import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  PhotoIcon,
  CloudArrowUpIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolidIcon,
  PhotoIcon as PhotoSolidIcon,
  CloudArrowUpIcon as CloudArrowUpSolidIcon,
  UserIcon as UserSolidIcon,
} from '@heroicons/react/24/solid';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  {
    to: '/',
    label: '首页',
    icon: HomeIcon,
    activeIcon: HomeSolidIcon,
  },
  {
    to: '/gallery',
    label: '画廊',
    icon: PhotoIcon,
    activeIcon: PhotoSolidIcon,
  },
  {
    to: '/upload',
    label: '上传',
    icon: CloudArrowUpIcon,
    activeIcon: CloudArrowUpSolidIcon,
  },
  {
    to: '/profile',
    label: '我的',
    icon: UserIcon,
    activeIcon: UserSolidIcon,
    requireAuth: true,
  },
];

export function MobileBottomNav() {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  const filteredItems = navItems.filter((item) => {
    if (item.requireAuth && !isAuthenticated) {
      return false;
    }
    return true;
  });

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 z-40 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className="relative flex flex-col items-center justify-center flex-1 h-full"
            >
              {isActive && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute inset-0 bg-primary-50 dark:bg-primary-900/20"
                  initial={false}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center">
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    isActive
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                />
                <span
                  className={`text-xs mt-0.5 font-medium transition-colors ${
                    isActive
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
