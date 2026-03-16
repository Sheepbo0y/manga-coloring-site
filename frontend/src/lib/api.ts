import axios from 'axios';

const API_BASE_URL =
  (import.meta as unknown as { env: { VITE_API_URL?: string } }).env.VITE_API_URL ||
  'https://manga-coloring-backend-production.up.railway.app/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证相关 API
export const authApi = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  getMe: () => api.get('/auth/me'),

  updateProfile: (data: { username?: string; bio?: string; avatar?: string }) =>
    api.put('/auth/profile', data),

  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/password', data),
};

// 作品相关 API
export const artworkApi = {
  getList: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    tag?: string;
    sortBy?: string;
    order?: string;
    isFeatured?: boolean;
  }) => api.get('/artworks', { params }),

  getPopular: (limit?: number) =>
    api.get('/artworks/popular', { params: { limit } }),

  getFeatured: (limit?: number) =>
    api.get('/artworks/featured', { params: { limit } }),

  getById: (id: string) => api.get(`/artworks/${id}`),

  upload: (data: FormData) =>
    api.post('/artworks', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  like: (id: string) => api.post(`/artworks/${id}/like`),

  getMyArtworks: (params?: { page?: number; limit?: number }) =>
    api.get('/artworks/user/me', { params }),
};

// 收藏相关 API
export const collectionApi = {
  getList: (params?: { page?: number; limit?: number }) =>
    api.get('/collections', { params }),

  check: (artworkId: string) => api.get(`/collections/check/${artworkId}`),

  add: (artworkId: string) => api.post(`/collections/${artworkId}`),

  remove: (artworkId: string) => api.delete(`/collections/${artworkId}`),
};

// 上色任务相关 API
export const colorizationApi = {
  getStatus: (id: string) => api.get(`/colorizations/${id}/status`),

  getUserList: (userId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/colorizations/user/${userId}/list`, { params }),
};

// 管理员 API
export const adminApi = {
  getQueueStats: () => api.get('/admin/queue/stats'),

  clearQueue: () => api.post('/admin/queue/clear'),

  getComfyUIHealth: () => api.get('/admin/comfyui/health'),

  getTasks: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/admin/tasks', { params }),

  getUsers: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/users', { params }),

  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  deleteArtwork: (id: string) => api.delete(`/admin/artworks/${id}`),

  setFeatured: (id: string, isFeatured: boolean) =>
    api.patch(`/admin/artworks/${id}/featured`, { isFeatured }),
};
