---
"uploadthing": patch
---

refactor: merge `prepareUpload` and `uploadFiles` to a single API endpoint. Drop usage of `POST /v6/uploadFiles` and `GET /v6/serverCallback`

📚 Check out the updated OpenAPI Spec: https://docs.uploadthing.com/api-reference/openapi-spec

> [!NOTE]
>
> While the old endpoints have been removed from the OpenAPI spec, they are still live. We just don't want to keep maintaining documentation for unused endpoints.
