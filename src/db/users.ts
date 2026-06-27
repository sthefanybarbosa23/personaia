import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, username?: string, avatarUrl?: string) {
  const result = await db.insert(users)
    .values({
      uid,
      email,
      username: username || email.split('@')[0],
      avatarUrl,
    })
    .onConflictDoUpdate({
      target: users.uid,
      set: { email, avatarUrl },
    })
    .returning();

  return result[0];
}
