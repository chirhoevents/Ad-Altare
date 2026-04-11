import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

type Schema = typeof schema;

let _db: NeonHttpDatabase<Schema> | null = null;

function getDb(): NeonHttpDatabase<Schema> {
  if (!_db) {
    const sql = neon(process.env.DATABASE_URL!);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = new Proxy({} as NeonHttpDatabase<Schema>, {
  get(_target, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getDb() as any)[prop];
  },
});

export * from './schema';
