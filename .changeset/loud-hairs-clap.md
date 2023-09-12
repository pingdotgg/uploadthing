---
"@uploadthing/shared": patch
---

fix: code path that prefers process.env is now safely accessed and falls back to checking import.meta.env
