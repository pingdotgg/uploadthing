---
"uploadthing": major
"@uploadthing/react": major
"@uploadthing/solid": major
---

feat!: support arbitrary callback URLs (serving router from any endpoint).
clientside requests thereby now requires passing a URL pointing to your
uploadthing endpoint.

## Breaking changes

- `config.callbackUrl` is removed from the serverside API handler. this is now automatically detected from the request

- `generateComponents` and `generateReactHelpers`/`generateSolidHelpers` now take a required parameter where you pass your **absolute** url:

  ```ts
  generateComponents<OurFileRouter>({
    url: getBaseUrl() + "/api/uploadthing" // point this to your API endpoint
  })
  ```

- If you're using the components without generating them, you must pass your `url` as a prop:

  ```tsx
  <UploadButton<OurFileRouter>
    url={getBaseUrl() + "/api/uploadthing"}
  />
  