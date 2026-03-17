export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  bio?: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  createdAt: string;
  _count?: {
    artworks: number;
    followers: number;
    follows: number;
    collections: number;
  };
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

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  follower?: Pick<User, 'id' | 'username' | 'avatar' | 'bio' | '_count'>;
  following?: Pick<User, 'id' | 'username' | 'avatar' | 'bio' | '_count'>;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user?: Pick<User, 'id' | 'username' | 'avatar'>;
  artworkId: string;
  artwork?: Artwork;
  parentId?: string;
  parent?: Comment;
  replies?: Comment[];
  _count?: {
    replies: number;
  };
}

export interface Notification {
  id: string;
  type: 'NEW_COMMENT' | 'NEW_FOLLOW' | 'NEW_LIKE' | 'ARTWORK_FEATUREED' | 'SYSTEM';
  content: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
  fromUser?: Pick<User, 'id' | 'username' | 'avatar'>;
  artwork?: Pick<Artwork, 'id' | 'title' | 'coverImage'>;
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
