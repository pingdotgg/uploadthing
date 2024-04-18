import { initTRPC } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { z } from "zod";

import { UTApi } from "uploadthing/server";

const createContext = () => ({ utapi: new UTApi() });
const t = initTRPC.context<typeof createContext>().create();

const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  /**
   * Note to readers: You should do auth here to prevent unauthorized access
   * to the UTApi
   */
  return next();
});

const router = t.router({
  getFiles: protectedProcedure.query(({ ctx }) => {
    return ctx.utapi.listFiles();
  }),
  deleteFile: protectedProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.utapi.deleteFiles(input.key);
    }),
});

export type TRPCRouter = typeof router;

const handler = (req: Request) => {
  return fetchRequestHandler({
    req,
    endpoint: "/api/trpc",
    router,
    createContext,
  });
};

export { handler as GET, handler as POST };
