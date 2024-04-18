import { initTRPC, TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { z } from "zod";

import { UTApi } from "uploadthing/server";

const createContext = () => ({ utapi: new UTApi(), userId: "abc123" });
const t = initTRPC.context<typeof createContext>().create();

const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  /**
   * Note to readers: You should do actual auth here to
   * prevent unauthorized access to the UTApi
   */
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next();
});

const router = t.router({
  getFiles: protectedProcedure.query(async ({ ctx }) => {
    /**
     * Note to readers: You're better off storing the files
     * in your database and then querying them from there.
     */
    const files = await ctx.utapi.listFiles();
    const nonDeleted = files.filter((f) => f.status !== "Deletion Pending");
    return nonDeleted.map((f, i) => {
      // Append a date property to each file
      // If you store the files in your database, you'd have this data
      // but I'll generate one here for simplicity
      const date = new Date(+new Date("2024-04-01") - i * 1000 * 60 * 60);

      return { ...f, date: date.toISOString() };
    });
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
