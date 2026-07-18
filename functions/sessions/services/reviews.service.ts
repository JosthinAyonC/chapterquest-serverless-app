import { randomUUID } from 'node:crypto';
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const ALLOWED_CONTENT_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
]);

const CONTENT_TYPE_TO_EXT: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};

const UPLOAD_URL_EXPIRES_IN = 3600;
const VIEW_URL_EXPIRES_IN = 3600;

export interface VideoReviewRecord {
  key: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface VideoUploadUrlResult {
  uploadUrl: string;
  key: string;
  expiresIn: number;
}

export interface SessionVideoItem {
  participantName: string;
  roleId: string;
  url: string;
  contentType: string;
  uploadedAt: string;
}

export class ReviewsServiceError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ReviewsServiceError';
    this.code = code;
  }
}

export class ReviewsService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly maxBytes: number;

  constructor(
    client = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' }),
    bucket = process.env.REVIEWS_BUCKET ??
      `${process.env.ENV ?? 'dev'}-chapterquest-reviews`,
    maxBytes = Number(process.env.REVIEWS_MAX_BYTES ?? 200 * 1024 * 1024),
  ) {
    this.client = client;
    this.bucket = bucket;
    this.maxBytes = maxBytes;
  }

  createUploadUrl(input: {
    accessCode: string;
    participantName: string;
    contentType: string;
    sizeBytes: number;
  }): Promise<VideoUploadUrlResult> {
    const contentType = input.contentType.trim().toLowerCase();
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      throw new ReviewsServiceError(
        'invalid_content_type',
        'Only MP4, MOV, and WebM videos are allowed.',
      );
    }
    if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0) {
      throw new ReviewsServiceError(
        'invalid_size',
        'Video size must be greater than zero.',
      );
    }
    if (input.sizeBytes > this.maxBytes) {
      throw new ReviewsServiceError(
        'file_too_large',
        `Video must be ${Math.floor(this.maxBytes / (1024 * 1024))} MB or smaller.`,
      );
    }

    const key = this.buildObjectKey(
      input.accessCode,
      input.participantName,
      contentType,
    );

    return getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: input.sizeBytes,
      }),
      { expiresIn: UPLOAD_URL_EXPIRES_IN },
    ).then((uploadUrl) => ({
      uploadUrl,
      key,
      expiresIn: UPLOAD_URL_EXPIRES_IN,
    }));
  }

  async verifyUploadedObject(key: string): Promise<VideoReviewRecord> {
    const head = await this.client.send(
      new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
    );

    const contentType = (head.ContentType ?? '').toLowerCase();
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      throw new ReviewsServiceError(
        'invalid_content_type',
        'Uploaded video has an unsupported format.',
      );
    }

    const sizeBytes = head.ContentLength ?? 0;
    if (sizeBytes <= 0 || sizeBytes > this.maxBytes) {
      throw new ReviewsServiceError(
        'invalid_size',
        'Uploaded video exceeds the allowed size.',
      );
    }

    return {
      key,
      contentType,
      sizeBytes,
      uploadedAt: new Date().toISOString(),
    };
  }

  async getViewUrls(input: {
    videos: Record<string, VideoReviewRecord>;
    participants: Array<{ name: string; roleId: string }>;
  }): Promise<SessionVideoItem[]> {
    const participantByName = new Map(
      input.participants.map((p) => [p.name, p.roleId]),
    );

    const entries = await Promise.all(
      Object.entries(input.videos).map(async ([participantName, video]) => {
        const url = await getSignedUrl(
          this.client,
          new GetObjectCommand({
            Bucket: this.bucket,
            Key: video.key,
          }),
          { expiresIn: VIEW_URL_EXPIRES_IN },
        );

        return {
          participantName,
          roleId: participantByName.get(participantName) ?? '',
          url,
          contentType: video.contentType,
          uploadedAt: video.uploadedAt,
        } satisfies SessionVideoItem;
      }),
    );

    return entries.sort((a, b) =>
      a.participantName.localeCompare(b.participantName),
    );
  }

  private buildObjectKey(
    accessCode: string,
    participantName: string,
    contentType: string,
  ): string {
    const code = accessCode.trim().toUpperCase();
    const slug = slugifyParticipant(participantName);
    const ext = CONTENT_TYPE_TO_EXT[contentType] ?? 'mp4';
    return `reviews/${code}/${slug}-${randomUUID()}.${ext}`;
  }
}

function slugifyParticipant(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'participant';
}
