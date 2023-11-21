# uploadthing

## 6.0.3

### Patch Changes

- [#487](https://github.com/pingdotgg/uploadthing/pull/487)
  [`afc793e`](https://github.com/pingdotgg/uploadthing/commit/afc793e0635c7c4cee7592262b8aa13e5b2c7d55)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix:
  exponential backoff infinite loop

- Updated dependencies
  [[`afc793e`](https://github.com/pingdotgg/uploadthing/commit/afc793e0635c7c4cee7592262b8aa13e5b2c7d55)]:
  - @uploadthing/shared@6.0.2

## 6.0.2

### Patch Changes

- [#480](https://github.com/pingdotgg/uploadthing/pull/480)
  [`67109c8`](https://github.com/pingdotgg/uploadthing/commit/67109c835f3416d2928c0faa9e2fd99a1bcd2370)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: serverdata
  polling timed out and returned 504

- [#479](https://github.com/pingdotgg/uploadthing/pull/479)
  [`f4270fe`](https://github.com/pingdotgg/uploadthing/commit/f4270fe58a1d685714a19ec420cc7e3eb0aa8266)
  Thanks [@Mr0Bread](https://github.com/Mr0Bread)! - Make Express external
  dependency

- Updated dependencies
  [[`67109c8`](https://github.com/pingdotgg/uploadthing/commit/67109c835f3416d2928c0faa9e2fd99a1bcd2370)]:
  - @uploadthing/shared@6.0.1

## 6.0.1

### Patch Changes

- [#469](https://github.com/pingdotgg/uploadthing/pull/469)
  [`7973a68`](https://github.com/pingdotgg/uploadthing/commit/7973a68c1c417cc0c6297a1be823012552e6efa4)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: fallback
  to null as serverdata to ensure json compatibility

## 6.0.0

### Major Changes

- [#351](https://github.com/pingdotgg/uploadthing/pull/351)
  [`0ef63c6`](https://github.com/pingdotgg/uploadthing/commit/0ef63c6ae43f92f4f1c5a2fee65827495162cb0e)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat: support
  returning data from the serverside `onUploadComplete` callback to the
  clientside `onClientUploadComplete`. This change also ensures the serverside
  callback will **finish** before the clientside one is invoked.

  This change has required reworking some types, most notably for people who
  were importing the UploadThing components directly from `@uploadthing/react`
  and `@uploadthing/solid` instead of generating their own typesafe components
  using `generateComponents`. We have always recommended using
  `generateComponents`, but now we're emphasising it even more.

- [#432](https://github.com/pingdotgg/uploadthing/pull/432)
  [`328f59b`](https://github.com/pingdotgg/uploadthing/commit/328f59b324a5013620dbf9c30023e9d3b0ee6141)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat!:
  multipart uploads

  supports uploading larger files and uploads are now up to 2x faster

- [#310](https://github.com/pingdotgg/uploadthing/pull/310)
  [`7c2ed64`](https://github.com/pingdotgg/uploadthing/commit/7c2ed649f53e97957d6ad0be53d163132612f18b)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat: support
  arbitrary callback URLs (serving router from any endpoint). To use a different
  endpoint than `/api/uploadthing`, you can pass the `url` parameter to
  `generateComponents` and `generateReactHelpers`/`generateSolidHelpers` (or
  pass it as a prop to the components if you're not generating them):

  ```ts
  export const { UploadButton, UploadDropzone } = generateComponents({
    url: "/api/my-upload-endpoint", // if the host is unchanged from default (localhost or VERCEL_URL)
    // url: "https://my-custom-host.com" // if the host is different but path is /api/uploadthing
    // url: "https://my-custom-host.com/my-custom-endpoint" // fully custom url
  });
  ```

- [#459](https://github.com/pingdotgg/uploadthing/pull/459)
  [`f32f5c0`](https://github.com/pingdotgg/uploadthing/commit/f32f5c03da53780c14b4fa32f9b00b2cfeb23797)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat!: change
  sdk function arguments to be an option object instead of positional arguments

  the signature of `UTApi.uploadFiles` and `UTApi.uploadFilesFromUrl` has
  changed to be easier to add new options in the future.

  ```diff
  - uploadFiles(files, metadata, contentDisposition)
  + uploadFiles(files, { metadata, contentDisposition })

  - uploadFilesFromUrl(urls, metadata, contentDisposition)
  + uploadFilesFromUrl(urls, { metadata, contentDisposition })
  ```

- [#459](https://github.com/pingdotgg/uploadthing/pull/459)
  [`f32f5c0`](https://github.com/pingdotgg/uploadthing/commit/f32f5c03da53780c14b4fa32f9b00b2cfeb23797)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - chore!: remove
  deprecated `utapi` object in preference of using constructor

  the default UTApi was exported as `utapi` from `uploadthing/server`. this was
  deprecated in `v5.7` in favor of using the constructor directly.

  ```diff
  - import { utapi } from 'uploadthing/server'
  + import { UTApi } from 'uploadthing/server'
  +
  + export const utapi = new UTApi(opts)
  ```

  > For full API spec of `UTAPI` see
  > [the the server API reference](https://docs.uploadthing.com/api-reference/server#utapi).

  This update removes the deprecated `utapi` export.

  In conjunction with this, we have moved certain guards to be in the
  constructor instead of in individual methods. This means that the constructor
  will throw if there is no `apiKey` passed as object or `UPLOADTHING_SECRET` in
  env, instead of this error being delayed until the method call.

### Minor Changes

- [#453](https://github.com/pingdotgg/uploadthing/pull/453)
  [`0aae926`](https://github.com/pingdotgg/uploadthing/commit/0aae926cc4b4c36e167ac680d5de8522ef282152)
  Thanks [@joelhooks](https://github.com/joelhooks)! - Adds an
  onBeforeUploadBegin callback that is called before startUpload to allow for
  pre-processing of files (ie changing file names etc)

### Patch Changes

- [#451](https://github.com/pingdotgg/uploadthing/pull/451)
  [`1241a16`](https://github.com/pingdotgg/uploadthing/commit/1241a16e23e5040db55eef1f39b133cbd80a0b28)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - chore: log out
  error if it's an unknown (not UploadThingError)

  This log should not ever happen, but if it does we want it to be easy to
  provide the error when reporting the bug to us.

  "Normal" errors are never logged and you have full control over how to handle
  them in your `onUploadError` handler.

- Updated dependencies
  [[`328f59b`](https://github.com/pingdotgg/uploadthing/commit/328f59b324a5013620dbf9c30023e9d3b0ee6141)]:
  - @uploadthing/shared@6.0.0

## 5.7.4

- Updated dependencies
  [[`eb5f96d`](https://github.com/pingdotgg/uploadthing/commit/eb5f96dc06a81ecb4b1f7ee3d0ba259ebdfee7d1)]:
  - @uploadthing/mime-types@0.2.2
  - @uploadthing/shared@5.2.7

## 5.7.3

- Updated dependencies
  [[`da43651`](https://github.com/pingdotgg/uploadthing/commit/da436516a9c1e30268878016a9c1dc930bc384f6)]:
  - @uploadthing/shared@5.2.6

## 5.7.2

### Patch Changes

- [#404](https://github.com/pingdotgg/uploadthing/pull/404)
  [`6bd4ead`](https://github.com/pingdotgg/uploadthing/commit/6bd4ead898c824646c47d4899e3e610283a55c5a)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - better error
  handling of invalid json parsing

- [#415](https://github.com/pingdotgg/uploadthing/pull/415)
  [`1635217`](https://github.com/pingdotgg/uploadthing/commit/16352171ff05e309cd2590a2a236a48de2477860)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - clone res
  before attempting to parse json so that we can fallback to .text()

- [#430](https://github.com/pingdotgg/uploadthing/pull/430)
  [`7a63ab5`](https://github.com/pingdotgg/uploadthing/commit/7a63ab5669dffec5e1ff3f4d837ccff2ae47852b)
  Thanks [@JEK58](https://github.com/JEK58)! - feat: Upload status type added

- Updated dependencies
  [[`6bd4ead`](https://github.com/pingdotgg/uploadthing/commit/6bd4ead898c824646c47d4899e3e610283a55c5a)]:
  - @uploadthing/shared@5.2.5

## 5.7.1

### Patch Changes

- [#410](https://github.com/pingdotgg/uploadthing/pull/410)
  [`1df596a`](https://github.com/pingdotgg/uploadthing/commit/1df596a2507abb9047fd5ad5d4355e3ab52d5044)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: wrong env
  check for sdk

- Updated dependencies
  [[`fd24c9d`](https://github.com/pingdotgg/uploadthing/commit/fd24c9d2b4e8be089bae2c9cb78d8f1b1fa80c16)]:
  - @uploadthing/shared@5.2.4

## 5.7.0

### Minor Changes

- [#388](https://github.com/pingdotgg/uploadthing/pull/388)
  [`440ae1b`](https://github.com/pingdotgg/uploadthing/commit/440ae1bb9de8887b6676b2566413f9e49575304a)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - migrate utapi
  to a class which allows for (optional) custom initialization options to be
  passed in. Below are shown the available options and their default values:

  ```ts
  import { UTApi } from "uploadthing/server";

  const utapi = new UTApi({
    fetch: globalThis.fetch,
    apiKey: process.env.UPLOADTHING_SECRET,
  });

  utapi.deleteFiles;
  utapi.listFiles;
  // ...
  ```

  `utapi` is still exported from `uploadthing/server` for backwards
  compatibility, but will be removed in a future major release.

### Patch Changes

- [#380](https://github.com/pingdotgg/uploadthing/pull/380)
  [`2803c5b`](https://github.com/pingdotgg/uploadthing/commit/2803c5b18962abc1884fe565fa0a3f60c04f2717)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: include
  patterns of withUt now points to existing files

- [#373](https://github.com/pingdotgg/uploadthing/pull/373)
  [`33c67af`](https://github.com/pingdotgg/uploadthing/commit/33c67af34d57e2ea3091ba7d7cdc1ddfaf1bbf97)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat(sdk): add
  usage endpoint to sdk

- [#382](https://github.com/pingdotgg/uploadthing/pull/382)
  [`3b04a8c`](https://github.com/pingdotgg/uploadthing/commit/3b04a8c52cd048bd7ea9e4150787ceb8180ed84a)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - add warning log
  if node < 18

- [#388](https://github.com/pingdotgg/uploadthing/pull/388)
  [`440ae1b`](https://github.com/pingdotgg/uploadthing/commit/440ae1bb9de8887b6676b2566413f9e49575304a)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - include more
  logs for failed `utapi` functions

- Updated dependencies
  [[`ee8533a`](https://github.com/pingdotgg/uploadthing/commit/ee8533a21e82c786537cea5dd7e98fcb71bb5131)]:
  - @uploadthing/shared@5.2.3

## 5.6.1

### Patch Changes

- [#359](https://github.com/pingdotgg/uploadthing/pull/359)
  [`842f3bd`](https://github.com/pingdotgg/uploadthing/commit/842f3bd0f25f7289234f31e80f8d2b6d1599534f)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: don't
  reference external types in internal functions, only in the specific
  entrypoints

- [#360](https://github.com/pingdotgg/uploadthing/pull/360)
  [`a0e1bf9`](https://github.com/pingdotgg/uploadthing/commit/a0e1bf937472b6909530dedd692c98af49470541)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - refactor:
  remove internal indirection for exporting adapers

- [#363](https://github.com/pingdotgg/uploadthing/pull/363)
  [`0612800`](https://github.com/pingdotgg/uploadthing/commit/06128000e90fe7080ebb8cbec1cacbb49c709aeb)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: only run
  JSON.parse if body is a string

- [#361](https://github.com/pingdotgg/uploadthing/pull/361)
  [`4f6949d`](https://github.com/pingdotgg/uploadthing/commit/4f6949db22b36f27d59f2c3dcfc8588f7d033009)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: move
  dev-log into function scope to prevent spam

- [#298](https://github.com/pingdotgg/uploadthing/pull/298)
  [`5e8016b`](https://github.com/pingdotgg/uploadthing/commit/5e8016b32fc7709dcd855da33dbc2ecf18eac0b5)
  Thanks [@Mr0Bread](https://github.com/Mr0Bread)! - refactor: extract some
  theming-related code for easy sharing across frameworks

- [#354](https://github.com/pingdotgg/uploadthing/pull/354)
  [`0a2b1c1`](https://github.com/pingdotgg/uploadthing/commit/0a2b1c16c379271a70742e8ed1917f41d9a4d0d0)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - refactor to
  remove indirection for express package

## 5.6.0

### Minor Changes

- [#297](https://github.com/pingdotgg/uploadthing/pull/297)
  [`4411aa0`](https://github.com/pingdotgg/uploadthing/commit/4411aa0608ab19eeceaf58ddad1e07769f367715)
  Thanks [@Mr0Bread](https://github.com/Mr0Bread)! - feat: Fastify adapter

- [#296](https://github.com/pingdotgg/uploadthing/pull/296)
  [`4dff08c`](https://github.com/pingdotgg/uploadthing/commit/4dff08cb5ec042bb192e607b00cdb90393149b78)
  Thanks [@Mr0Bread](https://github.com/Mr0Bread)! - feat: express support

- [#335](https://github.com/pingdotgg/uploadthing/pull/335)
  [`96736bd`](https://github.com/pingdotgg/uploadthing/commit/96736bd177b520985ea7c7fcf30e3309fe3c7f76)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat: automatic
  ssr hydration helper for next.js appdir. 📚
  [See docs for how to add to your app](https://docs.uploadthing.com/getting-started/appdir#configure-automatic-hydration-during-ssr-recommended)

### Patch Changes

- [#325](https://github.com/pingdotgg/uploadthing/pull/325)
  [`da11434`](https://github.com/pingdotgg/uploadthing/commit/da11434d6b7ce72fedea7a7d81a86e21da487994)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat: accept
  Undici File type in utapi

- [#345](https://github.com/pingdotgg/uploadthing/pull/345)
  [`92c69d5`](https://github.com/pingdotgg/uploadthing/commit/92c69d51325658a9d0a92dd045d13f9c24ca1ced)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix(sdk): await
  error before throwing

- [#327](https://github.com/pingdotgg/uploadthing/pull/327)
  [`b848579`](https://github.com/pingdotgg/uploadthing/commit/b848579eadf1657be3215b9392cae126e53323fb)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: add
  default name to blobs for server uploads

- Updated dependencies
  [[`92fac44`](https://github.com/pingdotgg/uploadthing/commit/92fac447f525be027125004f8cc0607b32375997)]:
  - @uploadthing/shared@5.2.2

## 5.5.3

### Patch Changes

- [#322](https://github.com/pingdotgg/uploadthing/pull/322)
  [`2e8b410`](https://github.com/pingdotgg/uploadthing/commit/2e8b410bb15c2688e9b6938c4a2cd17cf6110289)
  Thanks [@p6l-richard](https://github.com/p6l-richard)! - fix(sdk): prevent
  `uploadFilesInternal` from consuming response body twice on bad response

## 5.5.2

### Patch Changes

- [#319](https://github.com/pingdotgg/uploadthing/pull/319)
  [`8cfdade`](https://github.com/pingdotgg/uploadthing/commit/8cfdade9fee61a636fa1c88bc9380d4ac77e91d9)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - Fix: use correct url in
  client file

## 5.5.1

### Patch Changes

- [#318](https://github.com/pingdotgg/uploadthing/pull/318)
  [`353f6d0`](https://github.com/pingdotgg/uploadthing/commit/353f6d026fbee7480573d735d0406477dcb9e0bc)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - [fix] use correct file host
  on internal endpoint (utfs.io instead of uploadthing.com)

## 5.5.0

### Minor Changes

- [#301](https://github.com/pingdotgg/uploadthing/pull/301)
  [`e0ff7be`](https://github.com/pingdotgg/uploadthing/commit/e0ff7be182fbac5d30fbf3e6b9051e0e19e34a86)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - feat: Handle
  failed uploads (UPL-60)

## 5.4.0

### Minor Changes

- [#264](https://github.com/pingdotgg/uploadthing/pull/264)
  [`0ee8b2b`](https://github.com/pingdotgg/uploadthing/commit/0ee8b2b8f77f7b0e5d0d6fa4896adefe11d03929)
  Thanks [@Mr0Bread](https://github.com/Mr0Bread)! - feat(react;solid):
  onUploadBegin prop

### Patch Changes

- [#281](https://github.com/pingdotgg/uploadthing/pull/281)
  [`86d72be`](https://github.com/pingdotgg/uploadthing/commit/86d72be25c794aadcfe55a08095b487a782e2dc8)
  Thanks [@Mr0Bread](https://github.com/Mr0Bread)! - fix: added settings to
  support cjs imports

- [#278](https://github.com/pingdotgg/uploadthing/pull/278)
  [`a218357`](https://github.com/pingdotgg/uploadthing/commit/a21835750c91df1f30cbf92429c5ea8c3fa4e8b8)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - fix(utapi): no
  caching on utapi functions

- Updated dependencies
  [[`86d72be`](https://github.com/pingdotgg/uploadthing/commit/86d72be25c794aadcfe55a08095b487a782e2dc8)]:
  - @uploadthing/mime-types@0.2.1
  - @uploadthing/shared@5.2.1

## 5.3.3

### Patch Changes

- [#262](https://github.com/pingdotgg/uploadthing/pull/262)
  [`1ad326d`](https://github.com/pingdotgg/uploadthing/commit/1ad326d2a2cdd49ee538bda002f392d1052815ef)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix invalid
  `NextApiResponse` object for pages middleware

## 5.3.2

### Patch Changes

- [#251](https://github.com/pingdotgg/uploadthing/pull/251)
  [`872c8a0`](https://github.com/pingdotgg/uploadthing/commit/872c8a08e01cd2c0f59a837b410bf4b0fc29ce9c)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - fix: coherent
  file info in all methods

  all methods now receives a similarly shaped object as the serverside
  `onUploadComplete` callback:

  ```ts
  export type UploadFileResponse = {
    name: string;
    size: number;
    key: string;
    url: string;
  };
  ```

  Updated methods are:

  - `onClientUploadComplete` in hooks as well as components (The old `fileName`,
    `fileSize`, `fileUrl` and `fileKey` are retained but marked as deprecated
    for backwards compatibility, and will be removed in the next major.)
  - `utapi.uploadFiles` as well as `utapi.uploadFilesFromUrl`

- Updated dependencies
  [[`fe46b81`](https://github.com/pingdotgg/uploadthing/commit/fe46b814aa75646eac0694fdcb3889a3f7f5122b)]:
  - @uploadthing/shared@5.2.0

## 5.3.1

### Patch Changes

- [#247](https://github.com/pingdotgg/uploadthing/pull/247)
  [`84a7b7d`](https://github.com/pingdotgg/uploadthing/commit/84a7b7d9bf3c3f7d7f716ea7506d86a6234dbafa)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: runtime
  return type of `utapi.uploadFiles`

## 5.3.0

### Minor Changes

- [#214](https://github.com/pingdotgg/uploadthing/pull/214)
  [`4191e16`](https://github.com/pingdotgg/uploadthing/commit/4191e1638e911a98984676ae018faedcc7d2be0b)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat: add
  `uploadFilesFromUrl` to utapi for server side uploads via URl

- [#214](https://github.com/pingdotgg/uploadthing/pull/214)
  [`4191e16`](https://github.com/pingdotgg/uploadthing/commit/4191e1638e911a98984676ae018faedcc7d2be0b)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat: add
  `uploadFiles` to the utapi for serverside uplaods

### Patch Changes

- [#228](https://github.com/pingdotgg/uploadthing/pull/228)
  [`e34d46b`](https://github.com/pingdotgg/uploadthing/commit/e34d46b28dc434969b7c642f13b48dc3f752d122)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - chore(utapi):
  add server guard to listFiles

- [#226](https://github.com/pingdotgg/uploadthing/pull/226)
  [`a1e6e3c`](https://github.com/pingdotgg/uploadthing/commit/a1e6e3cf0536fc8a1f0401e13f07e4829a2735b3)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - chore: add
  server only guard

- [#221](https://github.com/pingdotgg/uploadthing/pull/221)
  [`090c8ed`](https://github.com/pingdotgg/uploadthing/commit/090c8edeeef88660b08a61733a47e826994860aa)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: errors
  thrown in middleware causes entire request to throw

- [#224](https://github.com/pingdotgg/uploadthing/pull/224)
  [`c02e99a`](https://github.com/pingdotgg/uploadthing/commit/c02e99a40d20ae37c08564cf4985d74af2bb6495)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - feat(utapi):
  Add listFiles to UTAPI

## 5.2.1

### Patch Changes

- [#219](https://github.com/pingdotgg/uploadthing/pull/219)
  [`a11a7f0`](https://github.com/pingdotgg/uploadthing/commit/a11a7f0f98585acf96220f9f454c74966e6c39b0)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: make sure
  url is absolute in pagedir

## 5.2.0

### Minor Changes

- [#195](https://github.com/pingdotgg/uploadthing/pull/195)
  [`a6c969e`](https://github.com/pingdotgg/uploadthing/commit/a6c969e67c85df490907b121d8e7df41779172b3)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat: improve
  errors and add `errorFormatter` option on the backend

### Patch Changes

- [#215](https://github.com/pingdotgg/uploadthing/pull/215)
  [`e4f650c`](https://github.com/pingdotgg/uploadthing/commit/e4f650ca208f55074460d1eb20a70c15ab34f63b)
  Thanks [@Mr0Bread](https://github.com/Mr0Bread)! - fix(uploadthing): fixed
  incorrect mapping of precise MIME types

- [#205](https://github.com/pingdotgg/uploadthing/pull/205)
  [`8658002`](https://github.com/pingdotgg/uploadthing/commit/8658002ca01e6502f06c2c56f90b353cf5db71df)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - chore(deps):
  update dependency '@uploadthing/shared'

- [#207](https://github.com/pingdotgg/uploadthing/pull/207)
  [`f3640fb`](https://github.com/pingdotgg/uploadthing/commit/f3640fb0872a12fe0ad95e0ac604136113fa6ca4)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - fix(shared):
  Swap order of cases in `getUploadthingUrl()`

- Updated dependencies
  [[`c508868`](https://github.com/pingdotgg/uploadthing/commit/c508868690d3de48094c10a7facb880662d03b6a),
  [`f3640fb`](https://github.com/pingdotgg/uploadthing/commit/f3640fb0872a12fe0ad95e0ac604136113fa6ca4),
  [`a6c969e`](https://github.com/pingdotgg/uploadthing/commit/a6c969e67c85df490907b121d8e7df41779172b3)]:
  - @uploadthing/shared@5.1.0

## 5.1.0

### Minor Changes

- [#176](https://github.com/pingdotgg/uploadthing/pull/176)
  [`9f56c64`](https://github.com/pingdotgg/uploadthing/commit/9f56c646d44bd257d243925d714d69d8f1c1f81d)
  Thanks [@GentikSolm](https://github.com/GentikSolm)! - feat: upload progress

### Patch Changes

- [#155](https://github.com/pingdotgg/uploadthing/pull/155)
  [`9797f51`](https://github.com/pingdotgg/uploadthing/commit/9797f5182351caaaacd88e12f187547937667b44)
  Thanks [@OrJDev](https://github.com/OrJDev)! - fix(solid): make sure running
  info only prints on server & server code doesn't leak

- [#185](https://github.com/pingdotgg/uploadthing/pull/185)
  [`a0cc65c`](https://github.com/pingdotgg/uploadthing/commit/a0cc65c779f81e1455dd5ec14ce9663ff231ea73)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - [fix] Add
  missing `size` to `file` object in simulated callback

- Updated dependencies
  [[`a0cc65c`](https://github.com/pingdotgg/uploadthing/commit/a0cc65c779f81e1455dd5ec14ce9663ff231ea73)]:
  - @uploadthing/shared@5.0.1

## 5.0.0

### Major Changes

- [#157](https://github.com/pingdotgg/uploadthing/pull/157)
  [`5652869`](https://github.com/pingdotgg/uploadthing/commit/56528690adb7b1500c4db53b8f0fa10432d13139)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat!: allow
  client side metadata to be passed along with the files

  ## Summary

  You can now pass input along with the files when uploading.

  In your file route:

  ```ts
    withInput: f(["image"])
      .input(
        z.object({
          foo: z.string(),
        }),
      )
      .middleware((opts) => {
        console.log("input", opts.input);
        // input is typed as { foo: string }
        return {};
      })
      .onUploadComplete((data) => {
        console.log("upload completed", data);
      }),
  ```

  Then, when uploading, attach the input to the component or the `startUpload`
  function:

  ```tsx
  const { useUploadThing } = generateReactHelpers<typeof OurFileRouter>();

  function MyComponent() {
    // Vanilla way
    const { startUpload } = useUploadthing("withInput");
    async function onSubmit(files: File[]) {
      await startUpload(files, { foo: "bar" });
    }

    // Component way
    return (
      <UploadButton<OurFileRouter>
        endpoint="withInput"
        input={{ foo: "bar" }} // or use some state to be dynamic
      />
    );
  }
  ```

  The input is validated on **your** server and only leaves your server if you
  pass it along from the `.middleware` to the `.onUploadComplete`. If you only
  use the input in the middleware without returning it, the Uploadthing server
  won't have any knowledge of it.

  ## Breaking changes

  - Options passed in the `middleware` now comes as an object.

    ```ts
    // before
    route: f(["image"])
      // res only for Next.js pages
      .middleware((req, res) => {
        return {};
      });

    // after
    route: f(["image"])
      // res only for Next.js pages
      .middleware((opts) => {
        opts.req; // Request, NextRequest, NextApiRequest depending on runtime
        opts.res; // NextApiResponse for Next.js pages
        opts.input; // typesafe, validated input
        return {};
      });
    ```

  - The `endpoint` option in the `useUploadthing` hook has been moved out to a
    separate positional argument.

    ```ts
    // before
    useUploadthing({
      endpoint: "withInput"
      onUploadComplete: ...
    })

    // after
    useUploadthing("withInput", {
      onUploadComplete: ...
    })
    ```

  - The signature for `uploadFiles` has changed to object syntax.

    ```ts
    // before
    const { uploadFiles } = generateReactHelpers<OurFileRouter>();
    uploadFiles(files, endpoint, { url: "" })

    // after
    const { uploadFiles } = generateReactHelpers<OurFileRouter>();
    uploadFiles({
      files,
      endpoint,
      input, // <-- new option
      url,
    })
    ```

## 4.1.3

### Patch Changes

- [#136](https://github.com/pingdotgg/uploadthing/pull/136)
  [`23a9e19`](https://github.com/pingdotgg/uploadthing/commit/23a9e19702a51dec2ace869f47211f883d888d74)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - internal
  refactoring to use a new shared package

- Updated dependencies
  [[`23a9e19`](https://github.com/pingdotgg/uploadthing/commit/23a9e19702a51dec2ace869f47211f883d888d74),
  [`23a9e19`](https://github.com/pingdotgg/uploadthing/commit/23a9e19702a51dec2ace869f47211f883d888d74)]:
  - @uploadthing/mime-types@0.2.0
  - @uploadthing/shared@5.0.0

## 4.1.2

### Patch Changes

- [#145](https://github.com/pingdotgg/uploadthing/pull/145)
  [`8e04d97`](https://github.com/pingdotgg/uploadthing/commit/8e04d9782b194feea74fd6abc2312bd105ae0f5d)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - [fix] Correct
  logic for dev server running message

- [#149](https://github.com/pingdotgg/uploadthing/pull/149)
  [`c58b19e`](https://github.com/pingdotgg/uploadthing/commit/c58b19e0367598ec05d928e9526b8092f5a86c46)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - [fix] don't
  prefetch component data on server

## 4.1.1

### Patch Changes

- [#142](https://github.com/pingdotgg/uploadthing/pull/142)
  [`552351b`](https://github.com/pingdotgg/uploadthing/commit/552351b57cce407f5743d55d44a85c6dad7a27f8)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - [fix] Make PDF
  uploads work.

- [#135](https://github.com/pingdotgg/uploadthing/pull/135)
  [`8a23937`](https://github.com/pingdotgg/uploadthing/commit/8a23937ff6c1ac50301d9d120dd902c4fff454de)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - [feat] Allow
  use of mime-types in file router config

## 4.1.0

### Minor Changes

- [#119](https://github.com/pingdotgg/uploadthing/pull/119)
  [`627d88b`](https://github.com/pingdotgg/uploadthing/commit/627d88b00f1cfd775ac3aa13a98cb0f795bd9187)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - [fix] Make sure
  clientside onUploadComplete() is called after serverside

- [#126](https://github.com/pingdotgg/uploadthing/pull/126)
  [`0046018`](https://github.com/pingdotgg/uploadthing/commit/004601867576338b0077835ac9a9fe40cd2e5f2f)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - vendor
  mime-types to make uploadthing edge-compat

### Patch Changes

- [#122](https://github.com/pingdotgg/uploadthing/pull/122)
  [`4fde69f`](https://github.com/pingdotgg/uploadthing/commit/4fde69f7c982b42846e7838f73fd5767c1b26d9d)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: prefetch
  permissions on server to prevent layout flashes

- [#117](https://github.com/pingdotgg/uploadthing/pull/117)
  [`0133e71`](https://github.com/pingdotgg/uploadthing/commit/0133e71cd742b185cb127e413e246e74c244a42b)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - [chore] clean
  up extraneous console logs

- [#118](https://github.com/pingdotgg/uploadthing/pull/118)
  [`3dfc1fa`](https://github.com/pingdotgg/uploadthing/commit/3dfc1fa4582c28a35ed007e666c0b73c34ab35a8)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - [feat]
  Additional file types: PDF and Text

## 4.0.0

### Major Changes

- [#94](https://github.com/pingdotgg/uploadthing/pull/94)
  [`91fb166`](https://github.com/pingdotgg/uploadthing/commit/91fb1660ba9a3dd2eb92df16b5bb1d3373b77662)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - Overhauled file router syntax

### Minor Changes

- [#93](https://github.com/pingdotgg/uploadthing/pull/93)
  [`16157de`](https://github.com/pingdotgg/uploadthing/commit/16157de54198d0838007efb4f6a37a4cd8720bab)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - [feat] API
  Helpers -- deleteFiles() and getFileUrls()

### Patch Changes

- [#97](https://github.com/pingdotgg/uploadthing/pull/97)
  [`b073c96`](https://github.com/pingdotgg/uploadthing/commit/b073c96120edccf9c9dd8f6db78611f43b841d20)
  Thanks [@ayatofrench](https://github.com/ayatofrench)! - [Fix] Update to
  buildRequestHandler secret

## 3.0.5

### Patch Changes

- [#89](https://github.com/pingdotgg/uploadthing/pull/89)
  [`18d086f`](https://github.com/pingdotgg/uploadthing/commit/18d086f55eb5bdc1348116957f04a771eb6dfd9b)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - [fix] Blob
  upload support -- all filetypes that are not image/video/audio now supported
  via "blob" type. Components now actually work with blob endpoints

- [#85](https://github.com/pingdotgg/uploadthing/pull/85)
  [`693c21e`](https://github.com/pingdotgg/uploadthing/commit/693c21e0c98a2dd5a6361733c77dba2ab1a39122)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - [types] Update
  types for onUploadComplete to include size

## 3.0.4

## 3.0.3

### Patch Changes

- [#41](https://github.com/pingdotgg/uploadthing/pull/41)
  [`225b6a4`](https://github.com/pingdotgg/uploadthing/commit/225b6a40d7a84ba6ea8c47faab77246b5b671ba8)
  Thanks [@OrJDev](https://github.com/OrJDev)! - feat: SolidJS adapter

- [#54](https://github.com/pingdotgg/uploadthing/pull/54)
  [`7244b84`](https://github.com/pingdotgg/uploadthing/commit/7244b8479b612f00360069c05aacf450b2b65696)
  Thanks [@didar-dev](https://github.com/didar-dev)! - Better parsing for
  `.fileSize()` in the router. thanks @didar-dev!

## 3.0.2

### Patch Changes

- [#51](https://github.com/pingdotgg/uploadthing/pull/51)
  [`9e68b5a`](https://github.com/pingdotgg/uploadthing/commit/9e68b5a12f9747113ccd8cc930e04bcf38cbe79c)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - Fixed types and returns for
  onComplete functions and promises

- [#57](https://github.com/pingdotgg/uploadthing/pull/57)
  [`336d361`](https://github.com/pingdotgg/uploadthing/commit/336d361763a870240f9703522e244d1e3dfe8861)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - [chore] better
  client errors

## 3.0.1

### Patch Changes

- [`e08cfdf`](https://github.com/pingdotgg/uploadthing/commit/e08cfdf0e26797025a7e6baa598b0c11957ce587)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - Fixed pages/ permissions,
  await promises we forgot to await, exponential backoff in dev server

## 3.0.0

### Major Changes

- [#1](https://github.com/pingdotgg/uploadthing/pull/1)
  [`6352f40`](https://github.com/pingdotgg/uploadthing/commit/6352f4057fc5a37a25d3561dcef06e0ba14b4af4)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - Overhaul packages, introduce
  UploadButton component

### Minor Changes

- [#3](https://github.com/pingdotgg/uploadthing/pull/3)
  [`2479873`](https://github.com/pingdotgg/uploadthing/commit/247987335a5c0ec4d43568f31897377e3656fce2)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat: insert
  the generic in lib-level

## 2.0.5

### Patch Changes

- [`bdb7730`](https://github.com/pingdotgg/uploadthing/commit/bdb77302cbe1ea6ae0f2c00296f225a5d29e6275)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - fix writeHead

## 2.0.4

### Patch Changes

- [#90](https://github.com/pingdotgg/uploadthing/pull/90)
  [`bd990dd`](https://github.com/pingdotgg/uploadthing/commit/bd990dd3f7d45dd049db921e6de6835efd8fad8f)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: prettify
  type in resolver function

## 2.0.3

### Patch Changes

- [#88](https://github.com/pingdotgg/uploadthing/pull/88)
  [`53b6d94`](https://github.com/pingdotgg/uploadthing/commit/53b6d94acdfea59b455fc0694b6feb232ca5830c)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - Fix appdir callbacks

## 2.0.2

### Patch Changes

- [#86](https://github.com/pingdotgg/uploadthing/pull/86)
  [`dcd020f`](https://github.com/pingdotgg/uploadthing/commit/dcd020fec54f12fd89207ed021e0f103e5fa33d2)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - fix callback for upload
  complete

## 2.0.1

### Patch Changes

- [#72](https://github.com/pingdotgg/uploadthing/pull/72)
  [`56074d2`](https://github.com/pingdotgg/uploadthing/commit/56074d2800459ce497d5860356ed45ec00e04be4)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - Honor file size and file type
  better

## 2.0.0

### Minor Changes

- [#66](https://github.com/pingdotgg/uploadthing/pull/66)
  [`7996387`](https://github.com/pingdotgg/uploadthing/commit/7996387e323edd9c7c8f82186a3e440c4bdbf691)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - Fixed callback for
  onUploadComplete in dev, added early page dir support

## 1.1.3

### Patch Changes

- [#63](https://github.com/pingdotgg/uploadthing/pull/63)
  [`7bb1e8e`](https://github.com/pingdotgg/uploadthing/commit/7bb1e8e9c36915e6c1c83fc9ba100eeaf456b04c)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - hotfix - local callbacks

- [#60](https://github.com/pingdotgg/uploadthing/pull/60)
  [`e3b44ff`](https://github.com/pingdotgg/uploadthing/commit/e3b44ffc87efdd63e5ce0c6f8df5e91ad54eb562)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - hotfix url encoding

## 1.1.2

### Patch Changes

- [#58](https://github.com/pingdotgg/uploadthing/pull/58)
  [`ec388d4`](https://github.com/pingdotgg/uploadthing/commit/ec388d4e72b651254cb5590b40d48c90ee43398d)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - better errors and local
  callback fix

## 1.1.1

### Patch Changes

- [`32a7b02`](https://github.com/pingdotgg/uploadthing/commit/32a7b0264f214fee6cab4cdd45635c3a7d9ff0ef)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - hotfix

## 1.1.0

### Minor Changes

- [#54](https://github.com/pingdotgg/uploadthing/pull/54)
  [`a4640ff`](https://github.com/pingdotgg/uploadthing/commit/a4640ff9a91e0eb833e2cc0daf5cb65cab54cb32)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - Beta release

## 1.0.2

### Patch Changes

- [#52](https://github.com/pingdotgg/uploadthing/pull/52)
  [`6458d6b`](https://github.com/pingdotgg/uploadthing/commit/6458d6b2f37beccb63ae7c1896fbf85e283fd815)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - chore: semantic release
