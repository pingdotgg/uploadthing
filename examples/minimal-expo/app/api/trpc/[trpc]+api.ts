import { initTRPC } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { z } from "zod";

import { UTApi } from "uploadthing/server";

const t = initTRPC.context<{ utapi: UTApi }>().create();

const router = t.router({
  getFiles: t.procedure.query(({ ctx }) => {
    return ctx.utapi.listFiles();
  }),
  deleteFile: t.procedure
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
    createContext: () => ({ utapi: new UTApi() }),
  });
};

export { handler as GET, handler as POST };
