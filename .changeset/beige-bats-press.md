---
"uploadthing": patch
"@uploadthing/shared": patch
---

fix treeshakeability of `Effect` dependency by avoiding top-level function calls, and falling back to `#__PURE__` directives otherwise

Importing some utility from e.g. `@uploadthing/shared` should not explode bundle if `Effect` isn't used for other stuff
