import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";

// S3-compatible object storage (MinIO) — same env contract as
// apps/api/src/lib/storage.ts (the apps do not share code). Kept local and
// minimal: the worker only lists and deletes objects.

const DEFAULT_BUCKET = "chat-uploads";
const DEFAULT_REGION = "us-east-1";
const DELETE_BATCH_SIZE = 1000;
// Upper bound on objects examined per run, so a large mostly-fresh bucket
// cannot make the job scan (and time out) indefinitely.
const MAX_OBJECTS_SCANNED = 10_000;

interface StorageConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  forcePathStyle: boolean;
}

function readConfig(): StorageConfig | null {
  const { S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY } = process.env;
  if (!S3_ENDPOINT || !S3_ACCESS_KEY || !S3_SECRET_KEY) return null;

  return {
    endpoint: S3_ENDPOINT.replace(/\/+$/, ""),
    region: process.env.S3_REGION || DEFAULT_REGION,
    bucket: process.env.S3_BUCKET || DEFAULT_BUCKET,
    accessKey: S3_ACCESS_KEY,
    secretKey: S3_SECRET_KEY,
    // MinIO only speaks path-style addressing unless virtual-host DNS is set up.
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
  };
}

export function isStorageConfigured(): boolean {
  return readConfig() !== null;
}

let cachedClient: S3Client | null = null;
let cachedConfig: StorageConfig | null = null;

function getStorage(): { client: S3Client; config: StorageConfig } {
  const config = cachedConfig ?? readConfig();
  if (!config) {
    throw new Error("Object storage is not configured (S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY)");
  }
  if (!cachedClient) {
    cachedClient = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: config.forcePathStyle,
      credentials: { accessKeyId: config.accessKey, secretAccessKey: config.secretKey },
    });
  }
  cachedConfig = config;
  return { client: cachedClient, config };
}

// Keys last modified before `cutoff`, capped at `maxKeys` (single run bound).
export async function listObjectsOlderThan(cutoff: Date, maxKeys = 1000): Promise<string[]> {
  const { client, config } = getStorage();
  const keys: string[] = [];
  let continuationToken: string | undefined;
  let scanned = 0;

  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: config.bucket,
        ContinuationToken: continuationToken,
        MaxKeys: Math.min(1000, maxKeys - keys.length),
      }),
    );
    for (const object of page.Contents ?? []) {
      scanned++;
      if (object.Key && object.LastModified && object.LastModified < cutoff) {
        keys.push(object.Key);
      }
      if (keys.length >= maxKeys) break;
    }
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken && keys.length < maxKeys && scanned < MAX_OBJECTS_SCANNED);

  return keys;
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
