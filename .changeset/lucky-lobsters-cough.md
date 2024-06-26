---
"uploadthing": major
"@uploadthing/shared": major
---

feat!: use ingest server

Multi Part Uplaods hasve been abstracted away and files are now uploaded as a single stream to UploadThing, reducing the manual steps required to upload files and improves performance.

Polling has been removed in favor of a streaming upload process with instant feedback