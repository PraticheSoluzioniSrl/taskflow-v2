import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

function getDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set');
  }
  const sql = neon(process.env.DATABASE_URL);
  return drizzle(sql, { schema });
}

// Lazy initialization per evitare errori durante il build
export const db = new Proxy({} as ReturnType<typeof getDatabase>, {
  get(target, prop) {
    const dbInstance = getDatabase();
    return (dbInstance as any)[prop];
  }
});
