import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createServer } from "../server";

const tokenstr = process.argv[2] ?? process.env.UPLOADTHING_TOKEN;

if (!tokenstr) {
  console.error(
    `
No uploadthing token provided.
Either set it as an environment variable or pass it as an argument.
Usage:
    UPLOADTHING_TOKEN=your-token npx @uploadthing/mcp-server
    npx @uploadthing/mcp-server your-token
    `.trim(),
  );
  process.exit(1);
}

const transport = new StdioServerTransport();
await createServer(tokenstr)
  .connect(transport)
  .catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });
