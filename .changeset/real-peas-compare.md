---
"uploadthing": major
---

chore!: remove deprecated `utapi` object in preference of using constructor

the default UTApi was exported as `utapi` from `uploadthing/server`. this was
deprecated in `v5.7` in favor of using the constructor directly.

```diff
- import { utapi } from 'uploadthing/server'
+ import { UTApi } from 'uploadthing/server'
+
+ export const utapi = new UTApi(opts)
```

> For full API spec of `UTAPI` see [the the server API reference](https://docs.uploadthing.com/api-reference/server#utapi).

This update removes the deprecated `utapi` export.

In conjunction with this, we have moved certain guards to be in the constructor
instead of in individual methods. This means that the constructor will throw
if there is no `apiKey` passed as object or `UPLOADTHING_SECRET` in env, instead
of this error being delayed until the method call.