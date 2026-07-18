export interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
}

/** Perfil invitado opcional (cookie). No es login ni identidad en Juguemos. */
export interface UserProfile {
  pk: string;
  sk: string;
  username: string;
  type: 'guest' | 'registered';
  createdAt: string;
  lastSeenAt: string;
}

export type ActivityStatus = 'draft' | 'running' | 'review' | 'closed';

/** Actividad de role play — persiste en DynamoDB. API: /sessions */
export interface ActivityMetadata {
  pk: string;
  sk: 'METADATA';
  sessionId: string;
  accessCode: string;
  hostToken: string;
  status: ActivityStatus;
  bookKey: string;
  timerMinutes: number;
  timerEndsAt?: string;
  createdAt: string;
  updatedAt: string;
  ttl?: number;
}

/** Estudiante dentro de una actividad — mostrar displayName + role en UI siempre */
export interface ActivityParticipant {
  pk: string;
  sk: `PARTICIPANT#${number}`;
  slot: number;
  displayName: string;
  role: string;
  claimedAt?: string;
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

/** @deprecated Use ActivityMetadata */
export type SessionStatus = ActivityStatus;
/** @deprecated Use ActivityMetadata */
export type SessionMetadata = ActivityMetadata;
/** @deprecated Use ActivityParticipant */
export type SessionParticipant = ActivityParticipant;
