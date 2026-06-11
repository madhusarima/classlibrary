import { createRouter, publicQuery } from "./middleware";
import { studentRouter } from "./routers/student";
import { bookRouter } from "./routers/book";
import { transactionRouter } from "./routers/transaction";
import { reportRouter } from "./routers/report";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  student: studentRouter,
  book: bookRouter,
  transaction: transactionRouter,
  report: reportRouter,
});

export type AppRouter = typeof appRouter;
