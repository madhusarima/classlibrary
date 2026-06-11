import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { transactions, students, books } from "@db/schema";
import { eq, and, desc, sql, gte, lt } from "drizzle-orm";

export const transactionRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        studentId: z.number().optional(),
        bookId: z.number().optional(),
        status: z.enum(["issued", "returned"]).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.studentId) conditions.push(eq(transactions.studentId, input.studentId));
      if (input?.bookId) conditions.push(eq(transactions.bookId, input.bookId));
      if (input?.status) conditions.push(eq(transactions.status, input.status));

      if (conditions.length === 0) {
        return db
          .select({
            id: transactions.id,
            studentId: transactions.studentId,
            studentName: students.name,
            studentClass: students.class,
            bookId: transactions.bookId,
            bookTitle: books.title,
            bookAuthor: books.author,
            issueDate: transactions.issueDate,
            returnDate: transactions.returnDate,
            status: transactions.status,
          })
          .from(transactions)
          .innerJoin(students, eq(transactions.studentId, students.id))
          .innerJoin(books, eq(transactions.bookId, books.id))
          .orderBy(desc(transactions.issueDate))
          .limit(200);
      }

      return db
        .select({
          id: transactions.id,
          studentId: transactions.studentId,
          studentName: students.name,
          studentClass: students.class,
          bookId: transactions.bookId,
          bookTitle: books.title,
          bookAuthor: books.author,
          issueDate: transactions.issueDate,
          returnDate: transactions.returnDate,
          status: transactions.status,
        })
        .from(transactions)
        .innerJoin(students, eq(transactions.studentId, students.id))
        .innerJoin(books, eq(transactions.bookId, books.id))
        .where(and(...conditions))
        .orderBy(desc(transactions.issueDate));
    }),

  issue: publicQuery
    .input(z.object({ studentId: z.number(), bookId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(transactions).values({
        studentId: input.studentId,
        bookId: input.bookId,
        issueDate: new Date(),
        status: "issued",
      });
      return { id: Number(result[0].insertId) };
    }),

  return: publicQuery
    .input(z.object({ transactionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(transactions)
        .set({
          returnDate: new Date(),
          status: "returned",
        })
        .where(eq(transactions.id, input.transactionId));
      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(transactions).where(eq(transactions.id, input.id));
      return { success: true };
    }),

  stats: publicQuery.query(async () => {
    const db = getDb();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const issuedTodayResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(gte(transactions.issueDate, todayStart));

    const overdueResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, "issued"),
          lt(transactions.issueDate, new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000))
        )
      );

    const activeReadersResult = await db
      .selectDistinct({ studentId: transactions.studentId })
      .from(transactions)
      .where(eq(transactions.status, "issued"));

    return {
      issuedToday: issuedTodayResult[0]?.count ?? 0,
      overdue: overdueResult[0]?.count ?? 0,
      activeReaders: activeReadersResult.length,
    };
  }),

  overdue: publicQuery
    .input(z.object({ days: z.number().default(15) }))
    .query(async ({ input }) => {
      const db = getDb();
      const cutoff = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
      return db
        .select({
          id: transactions.id,
          studentId: transactions.studentId,
          studentName: students.name,
          studentClass: students.class,
          bookId: transactions.bookId,
          bookTitle: books.title,
          issueDate: transactions.issueDate,
        })
        .from(transactions)
        .innerJoin(students, eq(transactions.studentId, students.id))
        .innerJoin(books, eq(transactions.bookId, books.id))
        .where(
          and(eq(transactions.status, "issued"), lt(transactions.issueDate, cutoff))
        )
        .orderBy(transactions.issueDate);
    }),

  recent: publicQuery
    .input(z.object({ limit: z.number().default(20) }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 20;
      return db
        .select({
          id: transactions.id,
          studentId: transactions.studentId,
          studentName: students.name,
          studentClass: students.class,
          bookId: transactions.bookId,
          bookTitle: books.title,
          issueDate: transactions.issueDate,
          returnDate: transactions.returnDate,
          status: transactions.status,
        })
        .from(transactions)
        .innerJoin(students, eq(transactions.studentId, students.id))
        .innerJoin(books, eq(transactions.bookId, books.id))
        .orderBy(desc(transactions.createdAt))
        .limit(limit);
    }),

  currentlyIssued: publicQuery
    .input(z.object({ studentId: z.number() }))
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
          and(
            eq(transactions.studentId, input.studentId),
            eq(transactions.status, "issued")
          )
        )
        .orderBy(desc(transactions.issueDate));
    }),
});
