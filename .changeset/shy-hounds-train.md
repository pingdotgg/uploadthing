---
"uploadthing": patch
---

chore(express): add logs for express body parser

Enables easier debugging for a common issue Express users has had when registed other middlewares before UploadThing that processes the body in an incompatible way.
These logs should help track down these cases more easily
