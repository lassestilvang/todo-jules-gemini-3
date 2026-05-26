'use server';

import { writeFile, mkdir } from 'fs/promises';
import { join, basename } from 'path';
import { db } from '@/lib/db';
import { attachments, tasks } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

export async function uploadFile(taskId: number, formData: FormData) {
  // SECURE: Rate limit uploads to 10 per minute per IP to prevent DoS
  const headersList = await headers();
  const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  if (!rateLimit(`uploadFile:${ip}`, 10, 60 * 1000)) {
    throw new Error('Too many requests. Please try again later.');
  }

  const file = formData.get('file') as File;
  if (!file) {
    throw new Error('No file uploaded');
  }

  if (!(file instanceof File)) {
    throw new Error('Invalid file upload');
  }

  // SECURE: Verify that the task exists before uploading to prevent permanently orphaned files and Storage DoS
  const taskExists = db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, taskId)).get();
  if (!taskExists) {
    throw new Error('Task not found');
  }

  // SECURE: Limit file size to 5MB to prevent DoS attacks via disk/memory exhaustion
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds the maximum limit of 5MB');
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // SECURE: Sanitize file name to prevent path traversal
  if (!(file instanceof File)) {
    throw new Error('Invalid file upload');
  }
  // SECURE: Normalize backslashes to forward slashes before calling basename to prevent traversal bypass on Linux runtimes
  const safeName = basename(file.name.replace(/\\/g, '/'));

  // SECURE: Enforce length limit to prevent database/filesystem errors
  if (safeName.length > 255) {
    throw new Error('File name must be 255 characters or less');
  }

  // SECURE: Validate file extension to prevent uploading dangerous files (e.g., Stored XSS via .html, .svg)
  const parts = safeName.split('.');
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : undefined;
  const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'txt', 'csv', 'docx', 'xlsx'];
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('File type not allowed for security reasons');
  }

  const filename = `${crypto.randomUUID()}-${safeName}`;
  const uploadDir = join(process.cwd(), 'public', 'uploads');
  const path = join(uploadDir, filename);

  try {
      await writeFile(path, buffer);
  } catch (err) {
      if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'ENOENT') {
          await mkdir(uploadDir, { recursive: true });
          await writeFile(path, buffer);
      } else {
          // SECURE: Do not leak raw Node.js error objects (like stack traces or internal paths) to the frontend
          console.error('File upload error:', err);
          throw new Error('File upload failed due to a server error.');
      }
  }

  const webPath = `/uploads/${filename}`;

  const newAttachment = db.insert(attachments).values({
      taskId,
      fileName: safeName,
      filePath: webPath
  }).returning().get();

  return newAttachment;
}

export async function getAttachments(taskId: number) {
    return db.select().from(attachments).where(eq(attachments.taskId, taskId)).all();
}
