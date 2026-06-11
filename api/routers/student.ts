import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { students, transactions, books } from "@db/schema";
import { eq, like, or, desc, sql } from "drizzle-orm";

export const studentRouter = createRouter({
  list: publicQuery
    .input(z.object({ classFilter: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.classFilter) {
        conditions.push(eq(students.class, input.classFilter));
      }
      if (conditions.length > 0) {
        return db.select().from(students).where(conditions[0]).orderBy(students.name);
      }
      return db.select().from(students).orderBy(students.name);
    }),

  search: publicQuery
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const searchTerm = `%${input.query}%`;
      return db
        .select()
        .from(students)
        .where(
          or(
            like(students.name, searchTerm),
            like(students.rollNumber, searchTerm)
          )
        )
        .orderBy(students.name);
    }),

  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db.select().from(students).where(eq(students.id, input.id));
      return result[0] ?? null;
    }),

  create: publicQuery
    .input(
      z.object({
        name: z.string().min(1),
        class: z.string().min(1),
        rollNumber: z.string().optional(),
        parentWhatsApp: z.string().optional(),
        studentWhatsApp: z.string().optional(),
        admissionNumber: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(students).values(input);
      return { id: Number(result[0].insertId) };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        class: z.string().min(1).optional(),
        rollNumber: z.string().optional(),
        parentWhatsApp: z.string().optional(),
        studentWhatsApp: z.string().optional(),
        admissionNumber: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(students).set(data).where(eq(students.id, id));
      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(students).where(eq(students.id, input.id));
      return { success: true };
    }),

  readingHistory: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select({
          transactionId: transactions.id,
          bookId: books.id,
          bookTitle: books.title,
          bookAuthor: books.author,
          issueDate: transactions.issueDate,
          returnDate: transactions.returnDate,
          status: transactions.status,
        })
        .from(transactions)
        .innerJoin(books, eq(transactions.bookId, books.id))
        .where(eq(transactions.studentId, input.id))
        .orderBy(desc(transactions.issueDate));
    }),

  currentHoldings: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select({
          transactionId: transactions.id,
          bookId: books.id,
          bookTitle: books.title,
          bookAuthor: books.author,
          issueDate: transactions.issueDate,
        })
        .from(transactions)
        .innerJoin(books, eq(transactions.bookId, books.id))
        .where(
          eq(transactions.studentId, input.id),
        )
        .having(eq(transactions.status, "issued"));
    }),

  classes: publicQuery.query(async () => {
    const db = getDb();
    const result = await db
      .select({ class: students.class })
      .from(students)
      .groupBy(students.class)
      .orderBy(students.class);
    return result.map((r) => r.class);
  }),
});
