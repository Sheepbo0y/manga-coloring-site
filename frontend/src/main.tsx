import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { PageTransition } from '@/components/PageTransition';
import { HomePage } from '@/pages/HomePage';
import { GalleryPage } from '@/pages/GalleryPage';
import { UploadPage } from '@/pages/UploadPage';
import { ArtworkDetailPage } from '@/pages/ArtworkDetailPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import './index.css';

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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/manga-coloring-site">
      <Routes>
        <Route path="/" element={<PageLayout><HomePage /></PageLayout>} />
        <Route path="/gallery" element={<PageLayout><GalleryPage /></PageLayout>} />
        <Route path="/upload" element={<PageLayout><ProtectedRoute><UploadPage /></ProtectedRoute></PageLayout>} />
        <Route path="/artwork/:id" element={<PageLayout><ArtworkDetailPage /></PageLayout>} />
        <Route path="/login" element={<PlainLayout><LoginPage /></PlainLayout>} />
        <Route path="/register" element={<PlainLayout><RegisterPage /></PlainLayout>} />
        <Route path="/profile" element={<PageLayout><ProtectedRoute><ProfilePage /></ProtectedRoute></PageLayout>} />
      </Routes>
    </BrowserRouter>
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
  </React.StrictMode>
);
