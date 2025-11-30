import { Lucia } from 'lucia';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from './db';
import { users, sessions } from './db/schema';

// Inisialisasi adapter Drizzle untuk PostgreSQL
const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);

// Inisialisasi Lucia dengan konfigurasi untuk integer user IDs
export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === 'production'
    }
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      name: attributes.name,
      role: attributes.role,
    };
  },
});

// Type untuk menyederhanakan penggunaan Lucia
declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      email: string;
      name: string;
      role: string;
    };
  }
}