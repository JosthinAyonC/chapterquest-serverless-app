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

export interface PreviewUrlResult {
  url: string;
  expiresIn: number | null;
}

export class LibraryService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly prefix: string;
  private readonly cdnDomain: string | undefined;

  constructor(
    client = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' }),
    bucket = process.env.LIBRARY_BUCKET ??
      `${process.env.ENV ?? 'dev'}-chapterquest-library`,
    prefix = process.env.LIBRARY_PREFIX ?? 'library/',
    cdnDomain = process.env.LIBRARY_CDN_DOMAIN,
  ) {
    this.client = client;
    this.bucket = bucket;
    this.prefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
    this.cdnDomain = normalizeCdnDomain(cdnDomain);
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

  async getPreviewUrl(key: string): Promise<PreviewUrlResult> {
    const objectKey = this.resolveObjectKey(key);
    await this.client.send(
      new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey }),
    );

    if (this.cdnDomain) {
      return {
        url: this.buildCdnUrl(objectKey),
        expiresIn: null,
      };
    }

    return {
      url: await getSignedUrl(
        this.client,
        new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }),
        { expiresIn: 300 },
      ),
      expiresIn: 300,
    };
  }

  private resolveObjectKey(key: string): string {
    const normalized = decodeURIComponent(key).replace(/^\/+/, '');
    if (normalized.startsWith(this.prefix)) {
      return normalized;
    }
    return `${this.prefix}${normalized}`;
  }

  private buildCdnUrl(objectKey: string): string {
    const encodedKey = objectKey
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return `https://${this.cdnDomain}/${encodedKey}`;
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
    const coverUrl = coverKey ? await this.resolveObjectUrl(coverKey) : null;

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

  private async resolveObjectUrl(objectKey: string): Promise<string> {
    if (this.cdnDomain) {
      return this.buildCdnUrl(objectKey);
    }

    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      { expiresIn: 3600 },
    );
  }
}

function normalizeCdnDomain(domain: string | undefined): string | undefined {
  if (!domain) {
    return undefined;
  }

  const trimmed = domain.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return trimmed || undefined;
}

function humanizeSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
