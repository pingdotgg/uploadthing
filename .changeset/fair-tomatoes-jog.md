---
"@uploadthing/svelte": minor
"@uploadthing/react": minor
"@uploadthing/solid": minor
"@uploadthing/vue": minor
"uploadthing": patch
"@uploadthing/shared": patch
---

feat: add `progressGranularity` option to control how granular progress events
are fired at

You can now set `progressGranularity` to `all`, `find`, or `coarse` to control
how granular progress events are fired at.

`all` will forward every event from the XHR upload
`find` will forward events for every 1% of progress
`coarse` will forward events for every 10% of progress

The default is `coarse`.
