import 'dotenv/config'
import Fastify from 'fastify'
import { FileRouter, createUploadthing, fastifyUploadthingPlugin } from 'uploadthing/fastify'

const f = createUploadthing();

export const fileRouter = {
    imageUploader: f({ image: { maxFileSize: "4MB" } })
        .onUploadComplete(async ({ file }) => {
            console.log("file url", file.url);
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof fileRouter;

const fastify = Fastify({
    logger: true
})

fastify
    .get('/', async () => {
        return { hello: 'world' }
    })
    .register(fastifyUploadthingPlugin, {
        router: fileRouter,
    })

const start = async () => {
    try {
        await fastify.listen({ port: 3001 })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start()