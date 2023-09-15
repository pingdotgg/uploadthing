import Fastify from "fastify";

import { fastifyUploadthingPlugin } from "uploadthing/fastify";

import { uploadRouter } from "./router";

const fastify = Fastify({
  logger: true,
});

fastify
  .get("/", async () => {
    return { hello: "world" };
  })
  .register(fastifyUploadthingPlugin, {
    router: uploadRouter,
  });

const start = async () => {
  try {
    await fastify.listen({ port: 3001 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
