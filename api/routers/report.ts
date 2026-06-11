import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { transactions, students, books } from "@db/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

export const reportRouter = createRouter({
  byStudent: publicQuery
    .input(z.object({ studentId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select({
          transactionId: transactions.id,
          bookTitle: books.title,
          bookAuthor: books.author,
          issueDate: transactions.issueDate,
          returnDate: transactions.returnDate,
          status: transactions.status,
        })
        .from(transactions)
        .innerJoin(books, eq(transactions.bookId, books.id))
        .where(eq(transactions.studentId, input.studentId))
        .orderBy(desc(transactions.issueDate));
    }),

  byBook: publicQuery
    .input(z.object({ bookId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select({
          transactionId: transactions.id,
          studentName: students.name,
          studentClass: students.class,
          issueDate: transactions.issueDate,
          returnDate: transactions.returnDate,
          status: transactions.status,
        })
        .from(transactions)
        .innerJoin(students, eq(transactions.studentId, students.id))
        .where(eq(transactions.bookId, input.bookId))
        .orderBy(desc(transactions.issueDate));
    }),

  byClass: publicQuery
    .input(z.object({ className: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const totalIssued = await db
        .select({ count: sql<number>`count(*)` })
        .from(transactions)
        .innerJoin(students, eq(transactions.studentId, students.id))
        .where(eq(students.class, input.className));

      const totalReturned = await db
        .select({ count: sql<number>`count(*)` })
        .from(transactions)
        .innerJoin(students, eq(transactions.studentId, students.id))
        .where(
          and(
            eq(students.class, input.className),
            eq(transactions.status, "returned")
          )
        );

      const activeReaders = await db
        .selectDistinct({ studentId: transactions.studentId })
        .from(transactions)
        .innerJoin(students, eq(transactions.studentId, students.id))
        .where(
          and(
            eq(students.class, input.className),
            eq(transactions.status, "issued")
          )
        );

      return {
        className: input.className,
        totalIssued: totalIssued[0]?.count ?? 0,
        totalReturned: totalReturned[0]?.count ?? 0,
        activeReaders: activeReaders.length,
      };
    }),

  byDateRange: publicQuery
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select({
          transactionId: transactions.id,
          studentName: students.name,
          studentClass: students.class,
          bookTitle: books.title,
          issueDate: transactions.issueDate,
          returnDate: transactions.returnDate,
          status: transactions.status,
        })
        .from(transactions)
        .innerJoin(students, eq(transactions.studentId, students.id))
        .innerJoin(books, eq(transactions.bookId, books.id))
        .where(
          and(
            gte(transactions.issueDate, new Date(input.startDate)),
            lte(transactions.issueDate, new Date(input.endDate))
          )
        )
        .orderBy(desc(transactions.issueDate));
    }),

  leaderboard: publicQuery
    .input(z.object({ limit: z.number().default(10), period: z.enum(["week", "month", "all"]).default("all") }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 10;
      let dateFilter;

      if (input?.period === "week") {
        dateFilter = gte(transactions.issueDate, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      } else if (input?.period === "month") {
        dateFilter = gte(transactions.issueDate, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      }

      const conditions = dateFilter ? [dateFilter] : [];

      if (conditions.length > 0) {
        return db
          .select({
            studentId: transactions.studentId,
            studentName: students.name,
            studentClass: students.class,
            booksRead: sql<number>`count(*)`,
          })
          .from(transactions)
          .innerJoin(students, eq(transactions.studentId, students.id))
          .where(and(...conditions))
          .groupBy(transactions.studentId)
          .orderBy(desc(sql`count(*)`))
          .limit(limit);
      }

      return db
        .select({
          studentId: transactions.studentId,
          studentName: students.name,
          studentClass: students.class,
          booksRead: sql<number>`count(*)`,
        })
        .from(transactions)
        .innerJoin(students, eq(transactions.studentId, students.id))
        .groupBy(transactions.studentId)
        .orderBy(desc(sql`count(*)`))
        .limit(limit);
    }),

  popularBooks: publicQuery
    .input(z.object({ limit: z.number().default(10), period: z.enum(["week", "month", "all"]).default("all") }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 10;
      let dateFilter;

      if (input?.period === "week") {
        dateFilter = gte(transactions.issueDate, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      } else if (input?.period === "month") {
        dateFilter = gte(transactions.issueDate, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      }

      const conditions = dateFilter ? [dateFilter] : [];

      if (conditions.length > 0) {
        return db
          .select({
            bookId: transactions.bookId,
            bookTitle: books.title,
            bookAuthor: books.author,
            readCount: sql<number>`count(*)`,
          })
          .from(transactions)
          .innerJoin(books, eq(transactions.bookId, books.id))
          .where(and(...conditions))
          .groupBy(transactions.bookId)
          .orderBy(desc(sql`count(*)`))
          .limit(limit);
      }

      return db
        .select({
          bookId: transactions.bookId,
          bookTitle: books.title,
          bookAuthor: books.author,
          readCount: sql<number>`count(*)`,
        })
        .from(transactions)
        .innerJoin(books, eq(transactions.bookId, books.id))
        .groupBy(transactions.bookId)
        .orderBy(desc(sql`count(*)`))
        .limit(limit);
    }),

  classComparison: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        className: students.class,
        booksRead: sql<number>`count(*)`,
      })
      .from(transactions)
      .innerJoin(students, eq(transactions.studentId, students.id))
      .groupBy(students.class)
      .orderBy(desc(sql`count(*)`));
  }),
});
