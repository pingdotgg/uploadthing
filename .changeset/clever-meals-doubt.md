---
"@uploadthing/react": major
"@uploadthing/solid": major
"uploadthing": major
---

feat: support returning data from the serverside `onUploadComplete` callback to
the clientside `onClientUploadComplete`. This change also ensures the serverside
callback will **finish** before the clientside one is invoked.