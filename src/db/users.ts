import { db } from './index';
import { users } from './schema';
import { eq, sql } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string) {
  // Check if this is the first user
  const countRes = await db.select({ count: sql`count(*)` }).from(users);
  const isFirstUser = countRes[0].count === '0' || countRes[0].count === 0;

  const role = isFirstUser || email === 'anyasrivastava57@gmail.com' ? 'admin' : 'user';

  // Use upsert to handle concurrent inserts of the same user ID safely.
  const result = await db.insert(users)
    .values({
      uid,
      email,
      role
    })
    .onConflictDoUpdate({
      target: users.uid,
      set: { email, role },
    })
    .returning();

  return result[0];
}
