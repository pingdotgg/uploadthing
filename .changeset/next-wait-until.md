---
"uploadthing": minor
---

The Next.js App Router adapter passes `ctx.waitUntil` into `middleware`,
`onUploadComplete`, and `onUploadError`. Work scheduled there runs through
Next.js `after`, so the client receives `onUploadComplete`'s return value
without waiting for it. Requires Next.js 15.1 for the task to outlive the
response. Earlier versions start the task and warn once.
