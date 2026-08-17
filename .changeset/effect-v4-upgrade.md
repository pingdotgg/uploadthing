---
"@uploadthing/shared": major
"uploadthing": major
"@example/backend-adapters-server": patch
"next-playground": patch
"next-playground-v6": patch
"@uploadthing/tsconfig": patch
---

feat!: upgrade to Effect v4

- `effect` is bumped from `3.21.0` to `4.0.0-beta.93`. Since `@effect/platform`
  has been merged into the core `effect` package in v4, the separate
  `@effect/platform` dependency is removed and all HTTP modules are now
  imported from `effect/unstable/http`.
- Client-side code previously built on `effect/Micro` (which was removed in v4)
  now uses the core `Effect` module, which is aggressively tree-shakeable in v4.
- The `uploadthing/effect-platform` adapter now returns a plain
  `Effect<HttpServerResponse, unknown, HttpClient | HttpServerRequest | Scope>`
  handler that can be registered on an Effect v4 `HttpRouter` (e.g. via
  `HttpRouter.add("*", "/api/uploadthing", handler)`).
- Public types that referenced Effect v3 concepts follow the v4 renames, e.g.
  `logLevel` options are now typed as `LogLevel.LogLevel` string literals.
