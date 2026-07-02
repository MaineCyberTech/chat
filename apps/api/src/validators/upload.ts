import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const DANGEROUS_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".com",
  ".scr",
  ".pif",
  ".vbs",
  ".js",
  ".jar",
  ".php",
  ".asp",
  ".aspx",
  ".jsp",
  ".py",
  ".rb",
  ".pl",
  ".sh",
  ".ps1",
  ".msi",
  ".dll",
  ".so",
  ".dylib",
  ".app",
  ".ipa",
  ".apk",
];

function isAllowedContentType(contentType: string): boolean {
  return ALLOWED_CONTENT_TYPES.includes(contentType.toLowerCase());
}

function hasDangerousExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return DANGEROUS_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export const uploadRequestSchema = z.object({
  fileName: z
    .string()
    .min(1)
    .max(255)
    .refine((name) => !hasDangerousExtension(name), { message: "File type not allowed" }),
  contentType: z
    .string()
    .min(1)
    .max(100)
    .refine((type) => isAllowedContentType(type), { message: "Content type not allowed" }),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE).optional(),
});

export const uploadAvatarSchema = z.object({
  contentType: z
    .string()
    .min(1)
    .max(100)
    .refine((type) => type.startsWith("image/"), { message: "Avatar must be an image" }),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(2 * 1024 * 1024)
    .optional(), // 2MB for avatars
});
