import { createMcpServer, type McpMeta } from "@juliusmarminge/trpc-mcp";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { initTRPC } from "@trpc/server";
import { Schema } from "effect";
import { z } from "zod";

import { UTApi } from "uploadthing/server";
import { UploadThingToken } from "uploadthing/types";

import { version } from "../package.json";

export function createServer(tokenstr: string) {
  const utapi = new UTApi({ token: tokenstr });
  const token = Schema.decodeUnknownSync(UploadThingToken)(tokenstr);

  const t = initTRPC.meta<McpMeta>().create();

  const toolRouter = t.router({
    listFiles: t.procedure
      .meta({
        mcp: {
          enabled: true,
          name: "listFiles",
          description: "List all files in the UploadThing app",
        },
      })
      .input(
        z.object({
          cursor: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const offset = input.cursor ? Number.parseInt(input.cursor) : 0;
        const files = await utapi.listFiles({
          offset,
        });

        return files.files.map((file) => ({
          uri: `https://${token.appId}.ufs.sh/f/${file.key}`,
          ...file,
        }));
      }),
  });

  const server = createMcpServer({ name: "uploadthing", version }, toolRouter);

  // Haven't added resource capabilities to trpc-mcp yet
  server.setRequestHandler(ListResourcesRequestSchema, async (req) => {
    const offset = req.params?.cursor ? Number.parseInt(req.params.cursor) : 0;
    const files = await utapi.listFiles({
      offset,
    });

    const nextCursor = files.hasMore
      ? String(offset + files.files.length)
      : null;

    return {
      nextCursor,
      resources: await Promise.all(
        files.files.map((file) => {
          return {
            uri: `https://${token.appId}.utfs.io/f/${file.key}`,
            name: file.name,
            // mimeType: file.type
          };
        }),
      ),
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
    const key = new URL(req.params.uri).pathname.slice(1);
    const { ufsUrl } = await utapi.generateSignedURL(key);
    const response = await fetch(ufsUrl);

    return {
      content: {
        uri: req.params.uri,
        mimeType: response.headers.get("Content-Type"),
        blob: response.blob(),
      },
    };
  });

  return server;
}
