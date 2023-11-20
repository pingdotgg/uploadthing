# @uploadthing/react

## 6.0.1

### Patch Changes

- [#480](https://github.com/pingdotgg/uploadthing/pull/480)
  [`67109c8`](https://github.com/pingdotgg/uploadthing/commit/67109c835f3416d2928c0faa9e2fd99a1bcd2370)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: serverdata
  polling timed out and returned 504

- Updated dependencies
  [[`67109c8`](https://github.com/pingdotgg/uploadthing/commit/67109c835f3416d2928c0faa9e2fd99a1bcd2370)]:
  - @uploadthing/shared@6.0.1

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
  [[`0ef63c6`](https://github.com/pingdotgg/uploadthing/commit/0ef63c6ae43f92f4f1c5a2fee65827495162cb0e),
  [`0aae926`](https://github.com/pingdotgg/uploadthing/commit/0aae926cc4b4c36e167ac680d5de8522ef282152),
  [`328f59b`](https://github.com/pingdotgg/uploadthing/commit/328f59b324a5013620dbf9c30023e9d3b0ee6141),
  [`7c2ed64`](https://github.com/pingdotgg/uploadthing/commit/7c2ed649f53e97957d6ad0be53d163132612f18b),
  [`f32f5c0`](https://github.com/pingdotgg/uploadthing/commit/f32f5c03da53780c14b4fa32f9b00b2cfeb23797),
  [`f32f5c0`](https://github.com/pingdotgg/uploadthing/commit/f32f5c03da53780c14b4fa32f9b00b2cfeb23797),
  [`1241a16`](https://github.com/pingdotgg/uploadthing/commit/1241a16e23e5040db55eef1f39b133cbd80a0b28)]:
  - uploadthing@6.0.0
  - @uploadthing/shared@6.0.0

## 5.7.0

### Minor Changes

- [#396](https://github.com/pingdotgg/uploadthing/pull/396)
  [`df0d3da`](https://github.com/pingdotgg/uploadthing/commit/df0d3da2db3b3cd609b3e84a65fdd23c63e2dc92)
  Thanks [@Mr0Bread](https://github.com/Mr0Bread)! - feat: manual upload mode
  for button

- [#383](https://github.com/pingdotgg/uploadthing/pull/383)
  [`d687d61`](https://github.com/pingdotgg/uploadthing/commit/d687d614fd3c543c6abf435e29c3dd45596dd5e7)
  Thanks [@Mr0Bread](https://github.com/Mr0Bread)! - feat: add `appendOnPaste`
  config option to support pasting files

### Patch Changes

- [#404](https://github.com/pingdotgg/uploadthing/pull/404)
  [`6bd4ead`](https://github.com/pingdotgg/uploadthing/commit/6bd4ead898c824646c47d4899e3e610283a55c5a)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - better error
  handling of invalid json parsing

- Updated dependencies
  [[`6bd4ead`](https://github.com/pingdotgg/uploadthing/commit/6bd4ead898c824646c47d4899e3e610283a55c5a)]:
  - @uploadthing/shared@5.2.5

## 5.6.2

### Patch Changes

- [#392](https://github.com/pingdotgg/uploadthing/pull/392)
  [`d4492d9`](https://github.com/pingdotgg/uploadthing/commit/d4492d941d174d8f2fb4647d97ae4a2d21e5d199)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! -
  fix(components): Allow upload button to be focusable via keyboard

- [#384](https://github.com/pingdotgg/uploadthing/pull/384)
  [`8c01e98`](https://github.com/pingdotgg/uploadthing/commit/8c01e980cf5b695165101b11c741ce6c1b396bdd)
  Thanks [@Mr0Bread](https://github.com/Mr0Bread)! - fix bug where progress bar
  styles was not included in the compiled stylesheet

- Updated dependencies
  [[`ee8533a`](https://github.com/pingdotgg/uploadthing/commit/ee8533a21e82c786537cea5dd7e98fcb71bb5131)]:
  - @uploadthing/shared@5.2.3

## 5.6.1

### Patch Changes

- [#298](https://github.com/pingdotgg/uploadthing/pull/298)
  [`5e8016b`](https://github.com/pingdotgg/uploadthing/commit/5e8016b32fc7709dcd855da33dbc2ecf18eac0b5)
  Thanks [@Mr0Bread](https://github.com/Mr0Bread)! - refactor: extract some
  theming-related code for easy sharing across frameworks

## 5.6.0

### Minor Changes

- [#315](https://github.com/pingdotgg/uploadthing/pull/315)
  [`c331135`](https://github.com/pingdotgg/uploadthing/commit/c3311355e0a0deeecf628eab18d854c44e578b6b)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: esm
  support by inhousing useDropzone code. You can now remove the `react-dropzone`
  dependency as it's no longer being used by UploadThing. If you're using a
  custom uploader component, the hook can be imported from
  `@uploadthing/react/hooks`.

- [#335](https://github.com/pingdotgg/uploadthing/pull/335)
  [`96736bd`](https://github.com/pingdotgg/uploadthing/commit/96736bd177b520985ea7c7fcf30e3309fe3c7f76)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat: automatic
  ssr hydration helper for next.js appdir. 📚
  [See docs for how to add to your app](https://docs.uploadthing.com/getting-started/appdir#configure-automatic-hydration-during-ssr-recommended)

### Patch Changes

- Updated dependencies
  [[`92fac44`](https://github.com/pingdotgg/uploadthing/commit/92fac447f525be027125004f8cc0607b32375997)]:
  - @uploadthing/shared@5.2.2

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

- [#279](https://github.com/pingdotgg/uploadthing/pull/279)
  [`229fd9c`](https://github.com/pingdotgg/uploadthing/commit/229fd9cf428afff4ace0615235dcf43c9fe9aa30)
  Thanks [@Mr0Bread](https://github.com/Mr0Bread)! - feat(react): modes for
  different dropzone behaviour

### Patch Changes

- [#281](https://github.com/pingdotgg/uploadthing/pull/281)
  [`86d72be`](https://github.com/pingdotgg/uploadthing/commit/86d72be25c794aadcfe55a08095b487a782e2dc8)
  Thanks [@Mr0Bread](https://github.com/Mr0Bread)! - fix: added settings to
  support cjs imports

- Updated dependencies
  [[`86d72be`](https://github.com/pingdotgg/uploadthing/commit/86d72be25c794aadcfe55a08095b487a782e2dc8)]:
  - @uploadthing/shared@5.2.1

## 5.3.0

### Minor Changes

- [#217](https://github.com/pingdotgg/uploadthing/pull/217)
  [`0a92cf3`](https://github.com/pingdotgg/uploadthing/commit/0a92cf3d69452d933f84a4590ac9c24ca295a265)
  Thanks [@Mr0Bread](https://github.com/Mr0Bread)! - feat(react): content and
  styling customisation

## 5.2.1

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

## 5.2.0

### Minor Changes

- [#195](https://github.com/pingdotgg/uploadthing/pull/195)
  [`a6c969e`](https://github.com/pingdotgg/uploadthing/commit/a6c969e67c85df490907b121d8e7df41779172b3)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat: improve
  errors and add `errorFormatter` option on the backend

### Patch Changes

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

- [#186](https://github.com/pingdotgg/uploadthing/pull/186)
  [`a9e1eaa`](https://github.com/pingdotgg/uploadthing/commit/a9e1eaab2c17732b143b8919fbea9a223ffa2971)
  Thanks [@GentikSolm](https://github.com/GentikSolm)! - fix: disable preflight
  and add reset styles inline

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

### Minor Changes

- [#61](https://github.com/pingdotgg/uploadthing/pull/61)
  [`9162cce`](https://github.com/pingdotgg/uploadthing/commit/9162cce03245e500cae0d0c0564a388473c1ae13)
  Thanks [@OrJDev](https://github.com/OrJDev)! - feat: `generateComponents`
  functions for solid and react allows to pass the generic `FileRouter` once
  instead of for everytime the component is used

### Patch Changes

- Updated dependencies
  [[`5652869`](https://github.com/pingdotgg/uploadthing/commit/56528690adb7b1500c4db53b8f0fa10432d13139)]:
  - uploadthing@5.0.0

## 4.1.3

### Patch Changes

- [#136](https://github.com/pingdotgg/uploadthing/pull/136)
  [`23a9e19`](https://github.com/pingdotgg/uploadthing/commit/23a9e19702a51dec2ace869f47211f883d888d74)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - internal
  refactoring to use a new shared package

- Updated dependencies
  [[`23a9e19`](https://github.com/pingdotgg/uploadthing/commit/23a9e19702a51dec2ace869f47211f883d888d74)]:
  - @uploadthing/shared@5.0.0

## 4.1.2

### Patch Changes

- [#150](https://github.com/pingdotgg/uploadthing/pull/150)
  [`4983acd`](https://github.com/pingdotgg/uploadthing/commit/4983acd3522a6485cab54b90f26dea0224203462)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - [misc] Better
  component loading state

- [#149](https://github.com/pingdotgg/uploadthing/pull/149)
  [`c58b19e`](https://github.com/pingdotgg/uploadthing/commit/c58b19e0367598ec05d928e9526b8092f5a86c46)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - [fix] don't
  prefetch component data on server

## 4.1.1

### Patch Changes

- [#141](https://github.com/pingdotgg/uploadthing/pull/141)
  [`5458a09`](https://github.com/pingdotgg/uploadthing/commit/5458a095cfe32e9d2db7b10a7e98669e3e746bc2)
  Thanks [@GentikSolm](https://github.com/GentikSolm)! -
  fix(react-UploadDropzone): clear files onClientUploadComplete for dropzone and
  upload button

- [#134](https://github.com/pingdotgg/uploadthing/pull/134)
  [`66d3eff`](https://github.com/pingdotgg/uploadthing/commit/66d3eff789338ff613cca359b2f2aecd8be9d720)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: use some
  bundler hacks to support lower versions of React

## 4.1.0

### Patch Changes

- [#122](https://github.com/pingdotgg/uploadthing/pull/122)
  [`4fde69f`](https://github.com/pingdotgg/uploadthing/commit/4fde69f7c982b42846e7838f73fd5767c1b26d9d)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: prefetch
  permissions on server to prevent layout flashes

## 4.0.0

### Major Changes

- [#94](https://github.com/pingdotgg/uploadthing/pull/94)
  [`91fb166`](https://github.com/pingdotgg/uploadthing/commit/91fb1660ba9a3dd2eb92df16b5bb1d3373b77662)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - Overhauled file router syntax

### Patch Changes

- Updated dependencies
  [[`16157de`](https://github.com/pingdotgg/uploadthing/commit/16157de54198d0838007efb4f6a37a4cd8720bab),
  [`91fb166`](https://github.com/pingdotgg/uploadthing/commit/91fb1660ba9a3dd2eb92df16b5bb1d3373b77662),
  [`b073c96`](https://github.com/pingdotgg/uploadthing/commit/b073c96120edccf9c9dd8f6db78611f43b841d20)]:
  - uploadthing@4.0.0

## 3.0.5

### Patch Changes

- [#89](https://github.com/pingdotgg/uploadthing/pull/89)
  [`18d086f`](https://github.com/pingdotgg/uploadthing/commit/18d086f55eb5bdc1348116957f04a771eb6dfd9b)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - [fix] Blob
  upload support -- all filetypes that are not image/video/audio now supported
  via "blob" type. Components now actually work with blob endpoints

- Updated dependencies
  [[`18d086f`](https://github.com/pingdotgg/uploadthing/commit/18d086f55eb5bdc1348116957f04a771eb6dfd9b),
  [`693c21e`](https://github.com/pingdotgg/uploadthing/commit/693c21e0c98a2dd5a6361733c77dba2ab1a39122)]:
  - uploadthing@3.0.5

## 3.0.4

### Patch Changes

- Updated dependencies []:
  - uploadthing@3.0.4

## 3.0.3

### Patch Changes

- [#41](https://github.com/pingdotgg/uploadthing/pull/41)
  [`225b6a4`](https://github.com/pingdotgg/uploadthing/commit/225b6a40d7a84ba6ea8c47faab77246b5b671ba8)
  Thanks [@OrJDev](https://github.com/OrJDev)! - feat: SolidJS adapter

- [#48](https://github.com/pingdotgg/uploadthing/pull/48)
  [`c28b698`](https://github.com/pingdotgg/uploadthing/commit/c28b698e2489383b127aa3097c832326e27bb5df)
  Thanks [@OrJDev](https://github.com/OrJDev)! - fix(uploadButton): accept
  mimeTypes join & allow multiple files to be passed

- Updated dependencies
  [[`225b6a4`](https://github.com/pingdotgg/uploadthing/commit/225b6a40d7a84ba6ea8c47faab77246b5b671ba8),
  [`7244b84`](https://github.com/pingdotgg/uploadthing/commit/7244b8479b612f00360069c05aacf450b2b65696)]:
  - uploadthing@3.0.3

## 3.0.2

### Patch Changes

- [#51](https://github.com/pingdotgg/uploadthing/pull/51)
  [`9e68b5a`](https://github.com/pingdotgg/uploadthing/commit/9e68b5a12f9747113ccd8cc930e04bcf38cbe79c)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - Fixed types and returns for
  onComplete functions and promises

- Updated dependencies
  [[`9e68b5a`](https://github.com/pingdotgg/uploadthing/commit/9e68b5a12f9747113ccd8cc930e04bcf38cbe79c),
  [`336d361`](https://github.com/pingdotgg/uploadthing/commit/336d361763a870240f9703522e244d1e3dfe8861)]:
  - uploadthing@3.0.2

## 3.0.1

### Patch Changes

- [`e08cfdf`](https://github.com/pingdotgg/uploadthing/commit/e08cfdf0e26797025a7e6baa598b0c11957ce587)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - Fixed pages/ permissions,
  await promises we forgot to await, exponential backoff in dev server

- Updated dependencies
  [[`e08cfdf`](https://github.com/pingdotgg/uploadthing/commit/e08cfdf0e26797025a7e6baa598b0c11957ce587)]:
  - uploadthing@3.0.1

## 3.0.0

### Major Changes

- [#1](https://github.com/pingdotgg/uploadthing/pull/1)
  [`6352f40`](https://github.com/pingdotgg/uploadthing/commit/6352f4057fc5a37a25d3561dcef06e0ba14b4af4)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - Overhaul packages, introduce
  UploadButton component

### Patch Changes

- Updated dependencies
  [[`6352f40`](https://github.com/pingdotgg/uploadthing/commit/6352f4057fc5a37a25d3561dcef06e0ba14b4af4),
  [`2479873`](https://github.com/pingdotgg/uploadthing/commit/247987335a5c0ec4d43568f31897377e3656fce2)]:
  - uploadthing@3.0.0

## 2.0.5

### Patch Changes

- [`bdb7730`](https://github.com/pingdotgg/uploadthing/commit/bdb77302cbe1ea6ae0f2c00296f225a5d29e6275)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - fix writeHead

- Updated dependencies
  [[`bdb7730`](https://github.com/pingdotgg/uploadthing/commit/bdb77302cbe1ea6ae0f2c00296f225a5d29e6275)]:
  - uploadthing@2.0.5

## 2.0.4

### Patch Changes

- Updated dependencies
  [[`bd990dd`](https://github.com/pingdotgg/uploadthing/commit/bd990dd3f7d45dd049db921e6de6835efd8fad8f)]:
  - uploadthing@2.0.4

## 2.0.3

### Patch Changes

- [#88](https://github.com/pingdotgg/uploadthing/pull/88)
  [`53b6d94`](https://github.com/pingdotgg/uploadthing/commit/53b6d94acdfea59b455fc0694b6feb232ca5830c)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - Fix appdir callbacks

- Updated dependencies
  [[`53b6d94`](https://github.com/pingdotgg/uploadthing/commit/53b6d94acdfea59b455fc0694b6feb232ca5830c)]:
  - uploadthing@2.0.3

## 2.0.2

### Patch Changes

- [#86](https://github.com/pingdotgg/uploadthing/pull/86)
  [`dcd020f`](https://github.com/pingdotgg/uploadthing/commit/dcd020fec54f12fd89207ed021e0f103e5fa33d2)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - fix callback for upload
  complete

- Updated dependencies
  [[`dcd020f`](https://github.com/pingdotgg/uploadthing/commit/dcd020fec54f12fd89207ed021e0f103e5fa33d2)]:
  - uploadthing@2.0.2

## 2.0.1

### Patch Changes

- [#72](https://github.com/pingdotgg/uploadthing/pull/72)
  [`56074d2`](https://github.com/pingdotgg/uploadthing/commit/56074d2800459ce497d5860356ed45ec00e04be4)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - Honor file size and file type
  better

- Updated dependencies
  [[`56074d2`](https://github.com/pingdotgg/uploadthing/commit/56074d2800459ce497d5860356ed45ec00e04be4)]:
  - uploadthing@2.0.1

## 2.0.0

### Minor Changes

- [#66](https://github.com/pingdotgg/uploadthing/pull/66)
  [`7996387`](https://github.com/pingdotgg/uploadthing/commit/7996387e323edd9c7c8f82186a3e440c4bdbf691)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - Fixed callback for
  onUploadComplete in dev, added early page dir support

### Patch Changes

- Updated dependencies
  [[`7996387`](https://github.com/pingdotgg/uploadthing/commit/7996387e323edd9c7c8f82186a3e440c4bdbf691)]:
  - uploadthing@2.0.0

## 1.1.3

### Patch Changes

- [#63](https://github.com/pingdotgg/uploadthing/pull/63)
  [`7bb1e8e`](https://github.com/pingdotgg/uploadthing/commit/7bb1e8e9c36915e6c1c83fc9ba100eeaf456b04c)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - hotfix - local callbacks

- [#60](https://github.com/pingdotgg/uploadthing/pull/60)
  [`e3b44ff`](https://github.com/pingdotgg/uploadthing/commit/e3b44ffc87efdd63e5ce0c6f8df5e91ad54eb562)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - hotfix url encoding

- Updated dependencies
  [[`7bb1e8e`](https://github.com/pingdotgg/uploadthing/commit/7bb1e8e9c36915e6c1c83fc9ba100eeaf456b04c),
  [`e3b44ff`](https://github.com/pingdotgg/uploadthing/commit/e3b44ffc87efdd63e5ce0c6f8df5e91ad54eb562)]:
  - uploadthing@1.1.3

## 1.1.2

### Patch Changes

- [#58](https://github.com/pingdotgg/uploadthing/pull/58)
  [`ec388d4`](https://github.com/pingdotgg/uploadthing/commit/ec388d4e72b651254cb5590b40d48c90ee43398d)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - better errors and local
  callback fix

- Updated dependencies
  [[`ec388d4`](https://github.com/pingdotgg/uploadthing/commit/ec388d4e72b651254cb5590b40d48c90ee43398d)]:
  - uploadthing@1.1.2

## 1.1.1

### Patch Changes

- [`32a7b02`](https://github.com/pingdotgg/uploadthing/commit/32a7b0264f214fee6cab4cdd45635c3a7d9ff0ef)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - hotfix

- Updated dependencies
  [[`32a7b02`](https://github.com/pingdotgg/uploadthing/commit/32a7b0264f214fee6cab4cdd45635c3a7d9ff0ef)]:
  - uploadthing@1.1.1

## 1.1.0

### Minor Changes

- [#54](https://github.com/pingdotgg/uploadthing/pull/54)
  [`a4640ff`](https://github.com/pingdotgg/uploadthing/commit/a4640ff9a91e0eb833e2cc0daf5cb65cab54cb32)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - Beta release

### Patch Changes

- Updated dependencies
  [[`a4640ff`](https://github.com/pingdotgg/uploadthing/commit/a4640ff9a91e0eb833e2cc0daf5cb65cab54cb32)]:
  - uploadthing@2.0.0

## 1.0.2

### Patch Changes

- [#52](https://github.com/pingdotgg/uploadthing/pull/52)
  [`6458d6b`](https://github.com/pingdotgg/uploadthing/commit/6458d6b2f37beccb63ae7c1896fbf85e283fd815)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - chore: semantic release

- Updated dependencies
  [[`6458d6b`](https://github.com/pingdotgg/uploadthing/commit/6458d6b2f37beccb63ae7c1896fbf85e283fd815)]:
  - uploadthing@1.0.2
