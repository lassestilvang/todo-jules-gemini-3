'use server';

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { db } from '@/lib/db';
import { attachments } from '@/lib/schema';
import { revalidatePath } from 'next/cache';

export async function uploadFile(taskId: number, formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) {
    throw new Error('No file uploaded');
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = `${Date.now()}-${file.name}`;
  const uploadDir = join(process.cwd(), 'public', 'uploads');
  const path = join(uploadDir, filename);

  try {
      await writeFile(path, buffer);
  } catch (err) {
      const fs = require('fs');
      if (!fs.existsSync(uploadDir)){
          fs.mkdirSync(uploadDir, { recursive: true });
          await writeFile(path, buffer);
      }
  }

  const webPath = `/uploads/${filename}`;

  db.insert(attachments).values({
      taskId,
      fileName: file.name,
      filePath: webPath
  }).run();

  try { revalidatePath('/'); } catch (e) {}
  return { success: true, path: webPath };
}

export async function getAttachments(taskId: number) {
    const { eq } = require('drizzle-orm');
    return db.select().from(attachments).where(eq(attachments.taskId, taskId)).all();
}
