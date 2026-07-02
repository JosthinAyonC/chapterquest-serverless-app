import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface LibraryBook {
  key: string;
  title: string;
  author: string;
  language: string;
  description: string;
  audience?: string;
  coverUrl: string | null;
}

export class LibraryService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly prefix: string;

  constructor(
    client = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' }),
    bucket = process.env.LIBRARY_BUCKET ??
      `${process.env.ENV ?? 'dev'}-chapterquest-library`,
    prefix = process.env.LIBRARY_PREFIX ?? 'library/',
  ) {
    this.client = client;
    this.bucket = bucket;
    this.prefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
  }

  async listCatalog(): Promise<LibraryBook[]> {
    const listed = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: this.prefix,
      }),
    );

    const pdfKeys =
      listed.Contents?.map((item) => item.Key)
        .filter((key): key is string => Boolean(key))
        .filter((key) => key.toLowerCase().endsWith('.pdf'))
        .filter((key) => !key.includes('/covers/')) ?? [];

    const books = await Promise.all(pdfKeys.map((key) => this.describeBook(key)));
    return books.sort((a, b) => a.title.localeCompare(b.title));
  }

  async getPreviewUrl(key: string): Promise<string> {
    const objectKey = this.resolveObjectKey(key);
    await this.client.send(
      new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey }),
    );

    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      { expiresIn: 300 },
    );
  }

  private resolveObjectKey(key: string): string {
    const normalized = decodeURIComponent(key).replace(/^\/+/, '');
    if (normalized.startsWith(this.prefix)) {
      return normalized;
    }
    return `${this.prefix}${normalized}`;
  }

  private async describeBook(objectKey: string): Promise<LibraryBook> {
    const head = await this.client.send(
      new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey }),
    );

    const metadata = head.Metadata ?? {};
    const filename = objectKey.split('/').pop()?.replace(/\.pdf$/i, '') ?? objectKey;
    const relativeKey = objectKey.startsWith(this.prefix)
      ? objectKey.slice(this.prefix.length)
      : objectKey;

    const coverKey = metadata.cover ?? metadata['cover-key'];
    const coverUrl = coverKey
      ? await getSignedUrl(
          this.client,
          new GetObjectCommand({ Bucket: this.bucket, Key: coverKey }),
          { expiresIn: 3600 },
        )
      : null;

    return {
      key: relativeKey,
      title: metadata.title ?? humanizeSlug(filename),
      author: metadata.author ?? 'Unknown',
      language: metadata.language ?? 'EN',
      description: metadata.description ?? '',
      audience: metadata.audience ?? undefined,
      coverUrl,
    };
  }
}

function humanizeSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
