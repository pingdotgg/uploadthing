# uploadthing

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
  [See docs for how to add to your app](https://docs.uploadthing.com/nextjs/appdir#configure-automatic-hydration-during-ssr-recommended)

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
