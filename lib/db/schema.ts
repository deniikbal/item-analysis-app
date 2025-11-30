import { pgTable, serial, varchar, text, timestamp, date, integer, boolean, primaryKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Table untuk menyimpan data form ulangan (info sekolah, guru, dll)
export const testInfo = pgTable('test_info', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  schoolName: varchar('school_name', { length: 255 }),
  subject: varchar('subject', { length: 255 }),
  classInfo: varchar('class_info', { length: 100 }),
  testName: varchar('test_name', { length: 255 }),
  competencyBasis: text('competency_basis'),
  teacherName: varchar('teacher_name', { length: 255 }),
  teacherNip: varchar('teacher_nip', { length: 50 }),
  principalName: varchar('principal_name', { length: 255 }),
  principalNip: varchar('principal_nip', { length: 50 }),
  academicYear: varchar('academic_year', { length: 20 }),
  testDate: date('test_date'),
  kkm: varchar('kkm', { length: 10 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Table untuk menyimpan data pengguna
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('user'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Table untuk menyimpan sesi pengguna
export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 128 }).primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
});

// Table untuk menyimpan token reset password
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export type TestInfo = typeof testInfo.$inferSelect;
export type NewTestInfo = typeof testInfo.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
