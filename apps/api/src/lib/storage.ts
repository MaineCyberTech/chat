import {
  CreateBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "./logger.js";

// S3-compatible object storage (MinIO) — see docs/adr/0002-postgres-postgrest-custom-auth.md.
// Every setting is optional: a deployment without object storage still boots, and
// `isStorageConfigured()` lets storage-dependent endpoints fail with a clear error.

const DEFAULT_BUCKET = "chat-uploads";
const DEFAULT_REGION = "us-east-1";
const DEFAULT_EXPIRY_SECONDS = 3600;
const DELETE_BATCH_SIZE = 1000;

interface StorageConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  forcePathStyle: boolean;
  publicBaseUrl: string;
  /**
   * Endpoint used *only* when presigning. SigV4 signs the Host header, so a URL
   * presigned against the internal endpoint (`http://minio:9000`) is unusable
   * from a browser. Set this to a host that maps 1:1 to MinIO with no path
   * prefix. Defaults to the internal endpoint, which is fine when uploads are
   * only ever performed server-side.
   */
  presignEndpoint: string;
}

function readConfig(): StorageConfig | null {
  const { S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY } = process.env;
  if (!S3_ENDPOINT || !S3_ACCESS_KEY || !S3_SECRET_KEY) return null;

  const endpoint = S3_ENDPOINT.replace(/\/+$/, "");
  const bucket = process.env.S3_BUCKET || DEFAULT_BUCKET;
  return {
    endpoint,
    region: process.env.S3_REGION || DEFAULT_REGION,
    bucket,
    accessKey: S3_ACCESS_KEY,
    secretKey: S3_SECRET_KEY,
    // MinIO only speaks path-style addressing unless virtual-host DNS is set up.
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
    // Public base URL as reachable from a browser, including the bucket name.
    publicBaseUrl: (process.env.S3_PUBLIC_URL || `${endpoint}/${bucket}`).replace(/\/+$/, ""),
    presignEndpoint: (process.env.S3_PRESIGN_ENDPOINT || endpoint).replace(/\/+$/, ""),
  };
}

export function isStorageConfigured(): boolean {
  return readConfig() !== null;
}

let cachedClient: S3Client | null = null;
let cachedPresignClient: S3Client | null = null;
let cachedConfig: StorageConfig | null = null;

function buildClient(endpoint: string, config: StorageConfig): S3Client {
  return new S3Client({
    endpoint,
    region: config.region,
    forcePathStyle: config.forcePathStyle,
    credentials: { accessKeyId: config.accessKey, secretAccessKey: config.secretKey },
  });
}

function getStorage(): { client: S3Client; config: StorageConfig } {
  const config = cachedConfig ?? readConfig();
  if (!config) {
    throw new Error("Object storage is not configured (S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY)");
  }
  if (!cachedClient) {
    cachedClient = buildClient(config.endpoint, config);
  }
  cachedConfig = config;
  return { client: cachedClient, config };
}

/** Client used for presigning: signs against the browser-reachable host. */
function getPresignClient(config: StorageConfig): S3Client {
  if (config.presignEndpoint === config.endpoint) return getStorage().client;
  if (!cachedPresignClient) {
    cachedPresignClient = buildClient(config.presignEndpoint, config);
  }
  return cachedPresignClient;
}

function encodeKey(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/");
}

// Browser-facing URL for an object. Renders only when the bucket (or prefix) is
// publicly readable; private objects should be fetched through a presigned URL.
export function publicUrl(key: string): string {
  const { config } = getStorage();
  return `${config.publicBaseUrl}/${encodeKey(key)}`;
}

// Presigned PUT for direct browser uploads.
export async function createPresignedUpload(
  key: string,
  contentType: string,
  expiresInSeconds: number = DEFAULT_EXPIRY_SECONDS,
): Promise<string> {
  const { config } = getStorage();
  return getSignedUrl(
    getPresignClient(config),
    new PutObjectCommand({ Bucket: config.bucket, Key: key, ContentType: contentType }),
    { expiresIn: expiresInSeconds },
  );
}

// Presigned GET for private objects (avatars, attachment fetches).
export async function createPresignedDownload(
  key: string,
  expiresInSeconds: number = DEFAULT_EXPIRY_SECONDS,
): Promise<string> {
  const { config } = getStorage();
  return getSignedUrl(
    getPresignClient(config),
    new GetObjectCommand({ Bucket: config.bucket, Key: key }),
    { expiresIn: expiresInSeconds },
  );
}

export async function deleteObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const { client, config } = getStorage();
  for (let i = 0; i < keys.length; i += DELETE_BATCH_SIZE) {
    const batch = keys.slice(i, i + DELETE_BATCH_SIZE);
    await client.send(
      new DeleteObjectsCommand({
        Bucket: config.bucket,
        Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
      }),
    );
  }
}

// Best-effort bucket bootstrap, mirroring the one-shot minio-init compose
// service. Never throws: boot must not depend on storage being reachable.
export async function ensureBucket(): Promise<void> {
  const config = readConfig();
  if (!config) return;
  try {
    const { client } = getStorage();
    try {
      await client.send(new HeadBucketCommand({ Bucket: config.bucket }));
    } catch {
      await client.send(new CreateBucketCommand({ Bucket: config.bucket }));
      logger.info("Object storage bucket created", { bucket: config.bucket });
    }
  } catch (err) {
    logger.warn("Object storage bucket check failed", { error: String(err) });
  }
}
