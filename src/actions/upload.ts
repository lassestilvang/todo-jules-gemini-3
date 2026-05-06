'use server';

import { writeFile, mkdir } from 'fs/promises';
import { join, basename } from 'path';
import { db } from '@/lib/db';
import { attachments } from '@/lib/schema';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

export async function uploadFile(taskId: number, formData: FormData) {
  // SECURE: Rate limit uploads to 10 per minute per IP to prevent DoS
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',').pop()?.trim() || '127.0.0.1';
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
  const safeName = basename(file.name);

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
          throw err;
      }
  }

  const webPath = `/uploads/${filename}`;

  const newAttachment = db.insert(attachments).values({
      taskId,
      fileName: safeName,
      filePath: webPath
  }).returning().get();

  try { revalidatePath('/'); } catch { /* empty */ }
  return newAttachment;
}

export async function getAttachments(taskId: number) {
    return db.select().from(attachments).where(eq(attachments.taskId, taskId)).all();
}
