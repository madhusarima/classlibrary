import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { books, transactions } from "@db/schema";
import { eq, like, or, desc, sql } from "drizzle-orm";

export const bookRouter = createRouter({
  list: publicQuery
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      if (input?.category) {
        return db.select().from(books).where(eq(books.category, input.category)).orderBy(books.title);
      }
      return db.select().from(books).orderBy(books.title);
    }),

  search: publicQuery
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const searchTerm = `%${input.query}%`;
      return db
        .select()
        .from(books)
        .where(
          or(
            like(books.title, searchTerm),
            like(books.author, searchTerm),
            like(books.bookCode, searchTerm)
          )
        )
        .orderBy(books.title);
    }),

  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db.select().from(books).where(eq(books.id, input.id));
      return result[0] ?? null;
    }),

  create: publicQuery
    .input(
      z.object({
        title: z.string().min(1),
        author: z.string().min(1),
        category: z.string().min(1),
        language: z.string().default("English"),
        bookCode: z.string().optional(),
        copies: z.number().int().min(1).default(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(books).values(input);
      return { id: Number(result[0].insertId) };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        author: z.string().min(1).optional(),
        category: z.string().min(1).optional(),
        language: z.string().optional(),
        bookCode: z.string().optional(),
        copies: z.number().int().min(1).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(books).set(data).where(eq(books.id, id));
      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(books).where(eq(books.id, input.id));
      return { success: true };
    }),

  available: publicQuery.query(async () => {
    const db = getDb();
    const allBooks = await db.select().from(books).orderBy(books.title);
    const issued = await db
      .select({
        bookId: transactions.bookId,
        count: sql<number>`count(*)`,
      })
      .from(transactions)
      .where(eq(transactions.status, "issued"))
      .groupBy(transactions.bookId);

    const issuedMap = new Map(issued.map((i) => [i.bookId, i.count]));
    return allBooks.map((book) => ({
      ...book,
      availableCopies: book.copies - (issuedMap.get(book.id) ?? 0),
    }));
  }),

  popular: publicQuery
    .input(z.object({ limit: z.number().default(10) }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 10;
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

  categories: publicQuery.query(async () => {
    const db = getDb();
    const result = await db
      .select({ category: books.category })
      .from(books)
      .groupBy(books.category)
      .orderBy(books.category);
    return result.map((r) => r.category);
  }),
});
