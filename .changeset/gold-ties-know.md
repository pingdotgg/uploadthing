---
"@uploadthing/react": minor
---

feat: upload interruption

You can now pass an `AbortSignal` to `uploadFiles` and `useUploadThing` to abort an upload after it starts.
For the built-in components, we control the signal for you.
