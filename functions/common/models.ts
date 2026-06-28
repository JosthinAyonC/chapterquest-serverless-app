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

export type SessionStatus = 'draft' | 'running' | 'review' | 'closed';

export interface SessionMetadata {
  pk: string;
  sk: 'METADATA';
  sessionId: string;
  accessCode: string;
  hostToken: string;
  status: SessionStatus;
  bookKey: string;
  timerMinutes: number;
  timerEndsAt?: string;
  createdAt: string;
  updatedAt: string;
  ttl?: number;
}

export interface SessionParticipant {
  pk: string;
  sk: `PARTICIPANT#${number}`;
  slot: number;
  displayName: string;
  role?: string;
  claimedAt?: string;
}

export interface SessionReview {
  pk: string;
  sk: `REVIEW#${number}`;
  slot: number;
  displayName: string;
  content: string;
  createdAt: string;
}

export interface SessionConnection {
  pk: string;
  sk: `CONNECTION#${string}`;
  connectionId: string;
  sessionId: string;
  connectedAt: string;
}

export interface LibraryObjectMeta {
  key: string;
  title?: string;
  author?: string;
  language?: string;
  grade?: string;
  sizeBytes?: number;
  lastModified?: string;
}
