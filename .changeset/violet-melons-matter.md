---
"uploadthing": major
---

## 🚨 Breaking Changes

### General

- Change `UPLOADTHING_API_KEY` to `UPLOADTHING_TOKEN`. The token contains both your API key and some other metadata required by the SDK. You can get a token from the [UploadThing dashboard](https://uploadthing.com/dashboard). All options related to `uploadthingSecret` / `apiKey` has now been removed and replaced with `token`:

```diff
- createRouteHandler({ router, config: { uploadthingSecret: 'sk_123' } })
+ createRouteHandler({ router, config: { token: 'MY_TOKEN' } })

- new UTApi({ apiKey: 'sk_123' })
+ new UTApi({ token: 'MY_TOKEN' })
```

- If you relied on the `CUSTOM_INFRA_URL` environment variable override, you will have to change this to `UPLOADTHING_API_URL` or `UPLOADTHING_INGEST_URL` depending on your use case.

### `uploadthing/client`

- Change signature of `genUploader` to return an object instead of a single function.

```diff
- const uploadFiles = genUploader(opts)
+ const { uploadFiles } = genUploader(opts)
```

- Remove `uploadFiles.skipPolling` option in favor of a new server-side RouteOption `awaitServerData`. If you want your client callback to run as soon as the file has been uploaded,
without waiting for your server side `onUploadComplete` to run, you can now set `awaitServerData` to `false`.

```diff
  // Client option
  uploadFiles({
-   skipPolling: true 
  })
  // Server option
  const router = {
    myRoute: f(
      { ... }, 
+     { awaitServerData: false }
    )    
  }
```

Read more about the new `RouteOptions` in the [📚 Server API Reference docs](https://docs.uploadthing.com/api-reference/server#route-options)

### Adapters

- Change `config.logLevel` levels. Most are now capitalized to match our new logger. Auto-complete should make migrating trivial.

```diff
- logLevel: 'info'
+ logLevel: 'Info'
```

- `uploadthing/server` adapter now returns a single function instead of individual named functions. The handler accepts a request and will handle routing internally.

```diff
- const { GET, POST } = createRouteHandler({ router, config })
+ const handler = createRouteHandler({ router, config })
```

You can re-export the handler as named functions if your framework requires it.

```ts
const handler = createRouteHandler({ router, config })
export { handler as GET, handler as POST }
```

## Features

### General

- Add new configuration provider. All config options (e.g. `UTApi.constructor` options or `createRouteHandler.config` option can now also be set using an environment variable. Setting the option in the constructor is still supported and takes precedence over the environment variable.

```ts
const api = new UTApi({
  logLevel: 'Info',
})
// is the same as
process.env.UPLOADTHING_LOG_LEVEL = 'Info'
const api = new UTApi()
```