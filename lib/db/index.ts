import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from './schema';
import { users } from './schema';

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

export async function createOrUpdateUser(
  userId: string,
  email: string,
  name?: string,
  image?: string
) {
  const dbInstance = getDatabase();
  const existing = await dbInstance
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length === 0) {
    await dbInstance.insert(users).values({
      id: userId,
      email,
      name: name || null,
      image: image || null,
    });
  } else {
    await dbInstance
      .update(users)
      .set({
        name: name || existing[0].name,
        image: image || existing[0].image,
      })
      .where(eq(users.id, userId));
  }
}
