---
"uploadthing": major
---

feat!: change signature of `genUploader` to return an object with 2 functions, `uploadFiles` and `createUpload`

`createUpload` can be used to create a resumable upload which you can pause and resume as you wish.
See example: https://github.com/pingdotgg/uploadthing/blob/v7/examples/backend-adapters/client-vanilla/src/resumable-upload.ts