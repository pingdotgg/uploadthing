import { initTRPC, TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { z } from "zod";

import { UTApi } from "uploadthing/server";

const createContext = () => ({
  utapi: new UTApi({ logLevel: "Info" }),
  userId: "abc123",
});
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
    const { files } = await ctx.utapi.listFiles();

    const nonDeleted = files.filter((f) => f.status !== "Deletion Pending");
    return nonDeleted.map((f) => {
      // Append a date property to each file
      // If you store the files in your database, you'd have this data
      // but I'll generate one here for simplicity
      const randomButDeterministicNumber = JSON.stringify(f)
        .split("")
        .reduce((a, b) => a + Math.pow(b.charCodeAt(0), 4), 0);
      const date = new Date(
        +new Date("2024-01-01") + randomButDeterministicNumber,
      ).toISOString();

      return { ...f, date: date };
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
    onError({ error, path }) {
      console.error(`>>> tRPC Error on '${path}'`, error);
    },
  });
};

export { handler as GET, handler as POST };
