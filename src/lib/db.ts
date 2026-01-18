
import { drizzle } from 'drizzle-orm/better-sqlite3';

let dbInstance;

// Check if we are running in a Bun test environment
// Bun defines `Bun` global.
const isBunTest = typeof Bun !== 'undefined' && process.env.NODE_ENV === 'test';

if (isBunTest) {
    // In test mode, we expect this module to be mocked or unused.
    // If it is loaded, we return a dummy or rely on the mock.
    // However, to avoid 'better-sqlite3' load, we must not require it.
    dbInstance = {} as any;
} else {
    // Use require to avoid top-level import being hoisted/evaluated immediately
    // if the bundler supports it (Next.js does).
    const Database = require('better-sqlite3');
    const sqlite = new Database('sqlite.db');
    dbInstance = drizzle(sqlite);
}

export const db = dbInstance;
