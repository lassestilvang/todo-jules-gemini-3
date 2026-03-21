import { run, bench, group } from 'mitata';
import { rmSync, mkdirSync } from 'fs';
import { writeFile, mkdir, access } from 'fs/promises';
import { join } from 'path';

const uploadDir1 = join(process.cwd(), 'public', 'uploads_bench_1');
const uploadDir2 = join(process.cwd(), 'public', 'uploads_bench_2');
const uploadDir3 = join(process.cwd(), 'public', 'uploads_bench_3');

const buffer = Buffer.alloc(1024);

async function main() {
    try { mkdirSync(uploadDir1, { recursive: true }); } catch(e){}
    try { mkdirSync(uploadDir2, { recursive: true }); } catch(e){}
    try { mkdirSync(uploadDir3, { recursive: true }); } catch(e){}

    group('File Upload - Existing Dir', () => {
      bench('Using try/catch ENOENT (Current Code)', async () => {
        const filename = `${Date.now()}-test.txt`;
        const path = join(uploadDir1, filename);

        try {
          await writeFile(path, buffer);
        } catch (err) {
          if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'ENOENT') {
            await mkdir(uploadDir1, { recursive: true });
            await writeFile(path, buffer);
          } else {
            throw err;
          }
        }
      });

      bench('Using fs/promises access (Proposed)', async () => {
        const filename = `${Date.now()}-test.txt`;
        const path = join(uploadDir2, filename);

        try {
          await access(uploadDir2);
        } catch {
          await mkdir(uploadDir2, { recursive: true });
        }
        await writeFile(path, buffer);
      });

      bench('Using relying on mkdir error handling directly (Proposed)', async () => {
        const filename = `${Date.now()}-test.txt`;
        const path = join(uploadDir3, filename);

        try {
            await mkdir(uploadDir3, { recursive: true });
        } catch (err) {
            if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code !== 'EEXIST') {
                throw err;
            }
        }
        await writeFile(path, buffer);
      });
    });

    await run();

    try {
      rmSync(uploadDir1, { recursive: true, force: true });
      rmSync(uploadDir2, { recursive: true, force: true });
      rmSync(uploadDir3, { recursive: true, force: true });
    } catch (e) {}
}

main().catch(console.error);
