import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  int,
  bigint,
  timestamp,
} from "drizzle-orm/mysql-core";

export const students = mysqlTable("students", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  class: varchar("class", { length: 20 }).notNull(),
  rollNumber: varchar("roll_number", { length: 20 }),
  parentWhatsApp: varchar("parent_whatsapp", { length: 20 }),
  studentWhatsApp: varchar("student_whatsapp", { length: 20 }),
  admissionNumber: varchar("admission_number", { length: 20 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const books = mysqlTable("books", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  author: varchar("author", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  language: varchar("language", { length: 20 }).notNull().default("English"),
  bookCode: varchar("book_code", { length: 50 }),
  copies: int("copies").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactions = mysqlTable("transactions", {
  id: serial("id").primaryKey(),
  studentId: bigint("student_id", { mode: "number", unsigned: true }).notNull(),
  bookId: bigint("book_id", { mode: "number", unsigned: true }).notNull(),
  issueDate: timestamp("issue_date").notNull().defaultNow(),
  returnDate: timestamp("return_date"),
  status: mysqlEnum("status", ["issued", "returned"]).notNull().default("issued"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
