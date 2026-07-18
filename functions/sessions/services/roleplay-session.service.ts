import {
  RoleplaySessionRepository,
  type RoleplayParticipantRecord,
  type RoleplaySessionRecord,
} from '../repositories/roleplay-session.repository';
import {
  ReviewsService,
  ReviewsServiceError,
  type SessionVideoItem,
  type VideoUploadUrlResult,
} from './reviews.service';

export class RoleplaySessionService {
  constructor(
    private readonly repository = new RoleplaySessionRepository(),
    private readonly reviewsService = new ReviewsService(),
  ) {}

  publish(input: {
    code: string;
    bookTitle: string | null;
    bookKey: string | null;
    coverUrl: string | null;
    participants: RoleplayParticipantRecord[];
  }): Promise<RoleplaySessionRecord> {
    if (!input.code.trim()) {
      throw new RoleplaySessionError('invalid_request', 'code is required.');
    }
    if (!input.participants.length) {
      throw new RoleplaySessionError('invalid_request', 'participants are required.');
    }
    return this.repository.upsert(input);
  }

  getByAccessCode(code: string): Promise<RoleplaySessionRecord | null> {
    if (!code.trim()) {
      throw new RoleplaySessionError('invalid_request', 'accessCode is required.');
    }
    return this.repository.findByAccessCode(code);
  }

  async createVideoUploadUrl(input: {
    accessCode: string;
    participantName: string;
    contentType: string;
    sizeBytes: number;
  }): Promise<VideoUploadUrlResult> {
    const session = await this.requireSession(input.accessCode);
    this.requireParticipant(session, input.participantName);

    try {
      return await this.reviewsService.createUploadUrl({
        accessCode: session.code,
        participantName: input.participantName,
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
      });
    } catch (error) {
      throw mapReviewsError(error);
    }
  }

  async finalizeParticipant(
    code: string,
    participantName: string,
    videoKey?: string,
  ): Promise<RoleplaySessionRecord | null> {
    if (!code.trim() || !participantName.trim()) {
      throw new RoleplaySessionError(
        'invalid_request',
        'accessCode and participantName are required.',
      );
    }

    const session = await this.requireSession(code);
    this.requireParticipant(session, participantName);

    if (!videoKey?.trim()) {
      throw new RoleplaySessionError(
        'video_required',
        'A review video is required before finishing.',
      );
    }

    const expectedPrefix = `reviews/${session.code.trim().toUpperCase()}/`;
    if (!videoKey.startsWith(expectedPrefix)) {
      throw new RoleplaySessionError(
        'invalid_video_key',
        'Video key does not belong to this session.',
      );
    }

    let videoReview;
    try {
      videoReview = await this.reviewsService.verifyUploadedObject(videoKey);
    } catch (error) {
      throw mapReviewsError(error);
    }

    return this.repository.markParticipantFinalized(
      code,
      participantName.trim(),
      videoReview,
    );
  }

  async listSessionVideos(accessCode: string): Promise<SessionVideoItem[]> {
    const session = await this.requireSession(accessCode);
    if (!session.videoReviews || Object.keys(session.videoReviews).length === 0) {
      return [];
    }

    try {
      return await this.reviewsService.getViewUrls({
        videos: session.videoReviews,
        participants: session.participants,
      });
    } catch (error) {
      throw mapReviewsError(error);
    }
  }

  private async requireSession(code: string): Promise<RoleplaySessionRecord> {
    const session = await this.repository.findByAccessCode(code);
    if (!session) {
      throw new RoleplaySessionError('not_found', 'Role review session not found.');
    }
    return session;
  }

  private requireParticipant(
    session: RoleplaySessionRecord,
    participantName: string,
  ): void {
    const trimmed = participantName.trim();
    const exists = session.participants.some((p) => p.name === trimmed);
    if (!exists) {
      throw new RoleplaySessionError(
        'invalid_participant',
        'Participant is not part of this session.',
      );
    }
  }
}

function mapReviewsError(error: unknown): RoleplaySessionError {
  if (error instanceof ReviewsServiceError) {
    return new RoleplaySessionError(error.code, error.message);
  }
  if (error instanceof RoleplaySessionError) {
    return error;
  }
  return new RoleplaySessionError(
    'internal_error',
    'Could not process the review video.',
  );
}

export class RoleplaySessionError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'RoleplaySessionError';
    this.code = code;
  }
}

export type { RoleplaySessionRecord };
