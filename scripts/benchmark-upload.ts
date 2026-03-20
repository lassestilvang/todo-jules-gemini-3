import { join } from 'path';
import { writeFile, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';

const uploadDir = join(process.cwd(), 'public', 'uploads-bench');
const path = join(uploadDir, 'test-file.txt');
const buffer = Buffer.from('benchmark test');

async function withExistsSync() {
  try {
      await writeFile(path, buffer);
  } catch (err) { // eslint-disable-line @typescript-eslint/no-unused-vars
      if (!existsSync(uploadDir)){
          await mkdir(uploadDir, { recursive: true });
          await writeFile(path, buffer);
      }
  }
}

async function optimized() {
  try {
      await writeFile(path, buffer);
  } catch (err) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'ENOENT') {
          await mkdir(uploadDir, { recursive: true });
          await writeFile(path, buffer);
      } else {
          throw err;
      }
  }
}

async function runBenchmark(name: string, fn: () => Promise<void>) {
  const iterations = 1000;

  // Clean up before run
  await rm(uploadDir, { recursive: true, force: true });

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    // We remove the directory periodically to trigger the catch block
    if (i % 10 === 0) {
      await rm(uploadDir, { recursive: true, force: true });
    }
    await fn();
  }
  const end = performance.now();

  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
}

async function main() {
  console.log('Running benchmark...');
  await runBenchmark('withExistsSync', withExistsSync);
  await runBenchmark('optimized', optimized);

  // Cleanup
  await rm(uploadDir, { recursive: true, force: true });
}

main().catch(console.error);
