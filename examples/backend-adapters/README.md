# Minimal example for using UploadThing with backend adapters

<a href="https://stackblitz.com/github/pingdotgg/uploadthing/tree/main/examples/minimal-hono-react">
  <img height="64" src="https://github.com/pingdotgg/uploadthing/assets/51714798/45907a4e-aa64-401a-afb3-b6c6df6eb71f" />
</a>

This example contains a vite-react app in the [/client](./client/) directory, as
well as multiple backend servers in the [/server](./server/) directory. Servers
that are included here are:

- [Elysia](./server/src/elysia.ts)
- [Express](./server/src/express.ts)
- [Fastify](./server/src/fastify.ts)
- [Hono](./server/src/hono.ts)
- [H3](./server/src/h3.ts)

You can start the Vite frontend as well as any of your preferred server using
the `pnpm dev:<your-server>` command. The Vite app will then be available on
`http://localhost:5173` and the server at `http://localhost:3000`.

## QuickStart

1. Grab an API key from the UploadThing dashboard:
   https://uploadthing.com/dashboard
2. `cp server/.env.example server/.env` and paste in your API key in the newly
   created `.env` file
3. `pnpm dev:<server>`, e.g. `pnpm dev:hono`
4. Go to [http://localhost:3000](http://localhost:3000) and upload files!

## Further reference

Check out the docs at: https://docs.uploadthing.com/backend-adapters
