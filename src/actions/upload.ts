'use server';

import { writeFile, mkdir } from 'fs/promises';
import { join, basename } from 'path';
import { db } from '@/lib/db';
import { attachments } from '@/lib/schema';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

export async function uploadFile(taskId: number, formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) {
    throw new Error('No file uploaded');
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // SECURE: Sanitize file name to prevent path traversal
  const safeName = basename(file.name);
  const filename = `${Date.now()}-${safeName}`;
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

  db.insert(attachments).values({
      taskId,
      fileName: safeName,
      filePath: webPath
  }).run();

  try { revalidatePath('/'); } catch { /* empty */ }
  return { success: true, path: webPath };
}

export async function getAttachments(taskId: number) {
    return db.select().from(attachments).where(eq(attachments.taskId, taskId)).all();
}
