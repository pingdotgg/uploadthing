---
"uploadthing": patch
"@uploadthing/react": patch
---

chore: log out error if it's an unknown (not UploadThingError)

This log should not ever happen, but if it does we want it to be easy
to provide the error when reporting the bug to us.

"Normal" errors are never logged and you have full control over how to handle
them in your `onUploadError` handler.