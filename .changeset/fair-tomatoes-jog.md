---
"@uploadthing/svelte": minor
"@uploadthing/react": minor
"@uploadthing/solid": minor
"@uploadthing/vue": minor
"uploadthing": patch
"@uploadthing/shared": patch
---

feat: add `uploadProgressGranularity` option to control how granular progress events
are fired at

You can now set `uploadProgressGranularity` to `all`, `fine`, or `coarse` to control
how granular progress events are fired at.

- `all` will forward every event from the XHR upload
- `fine` will forward events for every 1% of progress
- `coarse` (default) will forward events for every 10% of progress
