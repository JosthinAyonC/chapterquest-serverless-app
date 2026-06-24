export interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
}

export interface UserProfile {
  pk: string;
  sk: string;
  username: string;
  type: 'guest' | 'registered';
  createdAt: string;
  lastSeenAt: string;
}

export interface BookMetadata {
  pk: string;
  sk: string;
  bookId: string;
  title: string;
  ownerId: string;
  createdAt: string;
}

export interface Review {
  pk: string;
  sk: string;
  reviewId: string;
  bookId: string;
  authorId: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface Comment {
  pk: string;
  sk: string;
  commentId: string;
  bookId: string;
  authorId: string;
  content: string;
  createdAt: string;
}
