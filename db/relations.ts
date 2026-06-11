import { relations } from "drizzle-orm";
import { students, books, transactions } from "./schema";

export const studentsRelations = relations(students, ({ many }) => ({
  transactions: many(transactions),
}));

export const booksRelations = relations(books, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  student: one(students, {
    fields: [transactions.studentId],
    references: [students.id],
  }),
  book: one(books, {
    fields: [transactions.bookId],
    references: [books.id],
  }),
}));
