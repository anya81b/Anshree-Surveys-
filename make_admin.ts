import { db } from './src/db/index';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();

async function makeAdmin() {
  const email = 'anyasrivastava57@gmail.com';
  try {
    await db.update(users).set({ role: 'admin' }).where(eq(users.email, email));
    console.log(`Successfully made ${email} an admin!`);
  } catch (error) {
    console.error("Failed to update user", error);
  } finally {
    process.exit(0);
  }
}

makeAdmin();
