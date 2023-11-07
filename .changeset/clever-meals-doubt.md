---
"@uploadthing/react": major
"@uploadthing/solid": major
"uploadthing": major
---

feat: support returning data from the serverside `onUploadComplete` callback to
the clientside `onClientUploadComplete`. This change also ensures the serverside
callback will **finish** before the clientside one is invoked.

This change has required reworking some types, most notably for people who were
importing the UploadThing components directly from `@uploadthing/react` and `@uploadthing/solid` 
instead of generating their own typesafe components using `generateComponents`. We have always
recommended using `generateComponents`, but now we're emphasising it even more.