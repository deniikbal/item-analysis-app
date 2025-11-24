import { pgTable, serial, varchar, text, timestamp } from 'drizzle-orm/pg-core';

// Table untuk menyimpan data form ulangan (info sekolah, guru, dll)
export const testInfo = pgTable('test_info', {
  id: serial('id').primaryKey(),
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
  testDate: varchar('test_date', { length: 50 }),
  kkm: varchar('kkm', { length: 10 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type TestInfo = typeof testInfo.$inferSelect;
export type NewTestInfo = typeof testInfo.$inferInsert;
