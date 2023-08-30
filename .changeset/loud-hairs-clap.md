---
"@uploadthing/shared": patch
---

fix: code path that prefers process.env is now wrapped in try-catch and falls
back to import.meta.env
