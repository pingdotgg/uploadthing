---
"uploadthing": patch
---

chore: add logs for express body parser

A common issue has been that people registed other middlewares before UploadThing that processes the body in an incompatible way.
These logs should help track down these cases more easily
