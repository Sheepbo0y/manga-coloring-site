export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  bio?: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  createdAt: string;
}

export interface Artwork {
  id: string;
  title: string;
  description?: string;
  coverImage: string;
  originalImage: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  views: number;
  likes: number;
  isFeatured: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  user?: Pick<User, 'id' | 'username' | 'avatar'>;
  colorizations?: Colorization[];
  _count?: {
    collections: number;
  };
}

export interface Colorization {
  id: string;
  colorizedImage: string;
  version: number;
  progress: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  comfyuiJobId?: string;
  errorMessage?: string;
  processingTime?: number;
  createdAt: string;
  updatedAt: string;
  artworkId: string;
  artwork?: Artwork;
  userId: string;
  user?: Pick<User, 'id' | 'username' | 'avatar'>;
}

export interface Collection {
  id: string;
  createdAt: string;
  userId: string;
  artworkId: string;
  artwork?: Artwork;
}

export interface Task {
  id: string;
  type: 'COLORIZE' | 'THUMBNAIL' | 'WATERMARK' | 'CLEANUP';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  priority: number;
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
