---
"uploadthing": major
---

feat!: change sdk function arguments to be an option object instead of
positional arguments

the signature of `UTApi.uploadFiles` and `UTApi.uploadFilesFromUrl` has 
changed to be easier to add new options in the future.

```diff
- uploadFiles(files, metadata, contentDisposition)
+ uploadFiles(files, { metadata, contentDisposition })

- uploadFilesFromUrl(urls, metadata, contentDisposition)
+ uploadFilesFromUrl(urls, { metadata, contentDisposition })
```