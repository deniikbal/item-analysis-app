import { lucia } from 'lucia';
import { drizzle } from '@lucia-auth/adapter-drizzle';
import { nextjs } from 'lucia/middleware';
import { db } from './db';
import { users, sessions } from './db/schema';

// Inisialisasi adapter Drizzle
const adapter = drizzle(db, {
  usersTable: users,
  sessionsTable: sessions,
});

// Inisialisasi Lucia
export const auth = lucia({
  adapter,
  middleware: nextjs(),
  getUserAttributes: (userData) => {
    return {
      email: userData.email,
      name: userData.name,
      role: userData.role,
    };
  },
});

// Type untuk menyederhanakan penggunaan Lucia
declare module 'lucia' {
  interface Register {
    Lucia: typeof auth;
    DatabaseUserAttributes: {
      email: string;
      name: string;
      role: string;
    };
  }
}