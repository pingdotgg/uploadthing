# Integrating UploadThing with Novel

<a href="https://stackblitz.com/github/pingdotgg/uploadthing/tree/main/examples/with-novel">
  <img height="64" src="https://github.com/pingdotgg/uploadthing/assets/51714798/45907a4e-aa64-401a-afb3-b6c6df6eb71f" />
</a>

This is a stripped down version of the Novel Web app. See the original full
source code at: https://github.com/steven-tey/novel/tree/main/apps/web

For the UploadThing specific code in this example, see
[uploadthing/novel-plugin.ts](./uploadthing/novel-plugin.ts).

## QuickStart

1. Grab an API key from the UploadThing dashboard:
   https://uploadthing.com/dashboard
2. `cp .env.example .env` and paste in your API key in the newly created `.env`
   file
3. `pnpm i && pnpm dev`
4. Use the editor and upload files!

## Further reference

Check out the docs at:

- https://docs.uploadthing.com/getting-started/appdir
- https://novel.sh/docs
