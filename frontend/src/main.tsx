import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { PageTransition } from '@/components/PageTransition';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import './index.css';

// 懒加载页面组件
const HomePage = lazy(() => import('@/pages/HomePage').then(m => ({ default: m.HomePage })));
const GalleryPage = lazy(() => import('@/pages/GalleryPage').then(m => ({ default: m.GalleryPage })));
const UploadPage = lazy(() => import('@/pages/UploadPage').then(m => ({ default: m.UploadPage })));
const ArtworkDetailPage = lazy(() => import('@/pages/ArtworkDetailPage').then(m => ({ default: m.ArtworkDetailPage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const UserProfilePage = lazy(() => import('@/pages/UserProfilePage').then(m => ({ default: m.UserProfilePage })));
const NotificationPage = lazy(() => import('@/pages/NotificationPage').then(m => ({ default: m.NotificationPage })));

// 页面布局组件
function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pb-16 md:pb-0">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

// 空布局组件（用于登录/注册页面）
function PlainLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// 加载Fallback组件
function PageFallback() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/manga-coloring-site">
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<PageLayout><HomePage /></PageLayout>} />
          <Route path="/gallery" element={<PageLayout><GalleryPage /></PageLayout>} />
          <Route path="/upload" element={<PageLayout><ProtectedRoute><UploadPage /></ProtectedRoute></PageLayout>} />
          <Route path="/artwork/:id" element={<PageLayout><ArtworkDetailPage /></PageLayout>} />
          <Route path="/login" element={<PlainLayout><LoginPage /></PlainLayout>} />
          <Route path="/register" element={<PlainLayout><RegisterPage /></PlainLayout>} />
          <Route path="/profile" element={<PageLayout><ProtectedRoute><ProfilePage /></ProtectedRoute></PageLayout>} />
          <Route path="/user/:id" element={<PageLayout><UserProfilePage /></PageLayout>} />
          <Route path="/notifications" element={<PageLayout><ProtectedRoute><NotificationPage /></ProtectedRoute></PageLayout>} />
        </Routes>
      </Suspense>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 2000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
