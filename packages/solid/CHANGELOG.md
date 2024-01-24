# @uploadthing/solid

## 6.1.2

### Patch Changes

- [#564](https://github.com/pingdotgg/uploadthing/pull/564)
  [`4e9ff0e`](https://github.com/pingdotgg/uploadthing/commit/4e9ff0e5c5504806608f77a9bafd9a9f78d04d17)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - chore
  (analytics): Report which UT frontend package is being used to make requests

- Updated dependencies
  [[`6d54854`](https://github.com/pingdotgg/uploadthing/commit/6d548541c3b45679f6493c74274f0d988b5430e4)]:
  - @uploadthing/shared@6.2.0

## 6.1.1

### Patch Changes

- [#536](https://github.com/pingdotgg/uploadthing/pull/536)
  [`095fbbe`](https://github.com/pingdotgg/uploadthing/commit/095fbbe0babc375bcb1c06ac096a3d4d6e02c0e2)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - chore: minify
  usedropzone hook

  solidjs projects can now remove the `solidjs-dropzone` dependency as our own
  minimal hook has been made framework agnostic and is now bundled with the main
  package

- Updated dependencies
  [[`2d8b31c`](https://github.com/pingdotgg/uploadthing/commit/2d8b31c57260e3607ea16ce9dfcfeee08b074933),
  [`98f9e0d`](https://github.com/pingdotgg/uploadthing/commit/98f9e0de1eabe5520757a7da0a7b0e90624c9d60),
  [`095fbbe`](https://github.com/pingdotgg/uploadthing/commit/095fbbe0babc375bcb1c06ac096a3d4d6e02c0e2)]:
  - @uploadthing/shared@6.1.0
  - @uploadthing/dropzone@0.1.1

## 6.1.0

### Minor Changes

- [#529](https://github.com/pingdotgg/uploadthing/pull/529)
  [`3b7e901`](https://github.com/pingdotgg/uploadthing/commit/3b7e901ddbdf7ceb743e25db4258a289c3943c6f)
  Thanks [@ibrahimyaacob92](https://github.com/ibrahimyaacob92)! - feat: allow
  async onBeforeUploadBegin callback

### Patch Changes

- Updated dependencies
  [[`cfd5381`](https://github.com/pingdotgg/uploadthing/commit/cfd53811b6267a5f20ba9334f82937f27c3be346)]:
  - @uploadthing/shared@6.0.3

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

- [#451](https://github.com/pingdotgg/uploadthing/pull/451)
  [`1241a16`](https://github.com/pingdotgg/uploadthing/commit/1241a16e23e5040db55eef1f39b133cbd80a0b28)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - typed
  UploadThingError in `onUploadError` handler

### Patch Changes

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

## 5.4.1

### Patch Changes

- [#404](https://github.com/pingdotgg/uploadthing/pull/404)
  [`6bd4ead`](https://github.com/pingdotgg/uploadthing/commit/6bd4ead898c824646c47d4899e3e610283a55c5a)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - better error
  handling of invalid json parsing

- Updated dependencies
  [[`6bd4ead`](https://github.com/pingdotgg/uploadthing/commit/6bd4ead898c824646c47d4899e3e610283a55c5a)]:
  - @uploadthing/shared@5.2.5

## 5.4.0

### Minor Changes

- [#397](https://github.com/pingdotgg/uploadthing/pull/397)
  [`7f0c474`](https://github.com/pingdotgg/uploadthing/commit/7f0c4746cf8ed7bac6da3475e0de3a6fe58cf35e)
  Thanks [@Mr0Bread](https://github.com/Mr0Bread)! - feat: auto upload mode for
  dropzone component

### Patch Changes

- [#397](https://github.com/pingdotgg/uploadthing/pull/397)
  [`7f0c474`](https://github.com/pingdotgg/uploadthing/commit/7f0c4746cf8ed7bac6da3475e0de3a6fe58cf35e)
  Thanks [@Mr0Bread](https://github.com/Mr0Bread)! - fix: remove unused prefix
  in tw config to ensure correct css output

## 5.3.1

### Patch Changes

- [#384](https://github.com/pingdotgg/uploadthing/pull/384)
  [`8c01e98`](https://github.com/pingdotgg/uploadthing/commit/8c01e980cf5b695165101b11c741ce6c1b396bdd)
  Thanks [@Mr0Bread](https://github.com/Mr0Bread)! - fix bug where progress bar
  styles was not included in the compiled stylesheet

- Updated dependencies
  [[`ee8533a`](https://github.com/pingdotgg/uploadthing/commit/ee8533a21e82c786537cea5dd7e98fcb71bb5131)]:
  - @uploadthing/shared@5.2.3

## 5.3.0

### Minor Changes

- [#298](https://github.com/pingdotgg/uploadthing/pull/298)
  [`5e8016b`](https://github.com/pingdotgg/uploadthing/commit/5e8016b32fc7709dcd855da33dbc2ecf18eac0b5)
  Thanks [@Mr0Bread](https://github.com/Mr0Bread)! - feat: support theming
  components

## 5.2.1

### Patch Changes

- [#286](https://github.com/pingdotgg/uploadthing/pull/286)
  [`a22d74f`](https://github.com/pingdotgg/uploadthing/commit/a22d74fec2c1236b65816a3e95640f9fccb70bca)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix:
  generateComponents return correct components

## 5.2.0

### Minor Changes

- [#264](https://github.com/pingdotgg/uploadthing/pull/264)
  [`0ee8b2b`](https://github.com/pingdotgg/uploadthing/commit/0ee8b2b8f77f7b0e5d0d6fa4896adefe11d03929)
  Thanks [@Mr0Bread](https://github.com/Mr0Bread)! - feat(react;solid):
  onUploadBegin prop

### Patch Changes

- Updated dependencies
  [[`86d72be`](https://github.com/pingdotgg/uploadthing/commit/86d72be25c794aadcfe55a08095b487a782e2dc8)]:
  - @uploadthing/shared@5.2.1

## 5.1.2

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

## 5.1.1

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

- [#155](https://github.com/pingdotgg/uploadthing/pull/155)
  [`9797f51`](https://github.com/pingdotgg/uploadthing/commit/9797f5182351caaaacd88e12f187547937667b44)
  Thanks [@OrJDev](https://github.com/OrJDev)! - fix(solid): make sure running
  info only prints on server & server code doesn't leak

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
  [[`23a9e19`](https://github.com/pingdotgg/uploadthing/commit/23a9e19702a51dec2ace869f47211f883d888d74),
  [`23a9e19`](https://github.com/pingdotgg/uploadthing/commit/23a9e19702a51dec2ace869f47211f883d888d74)]:
  - @uploadthing/shared@5.0.0
  - uploadthing@4.1.3

## 3.0.6

### Patch Changes

- Updated dependencies
  [[`8e04d97`](https://github.com/pingdotgg/uploadthing/commit/8e04d9782b194feea74fd6abc2312bd105ae0f5d),
  [`c58b19e`](https://github.com/pingdotgg/uploadthing/commit/c58b19e0367598ec05d928e9526b8092f5a86c46)]:
  - uploadthing@4.1.2

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

- [`e43c2fd`](https://github.com/pingdotgg/uploadthing/commit/e43c2fde870a6491a754ad7639d7b44b7dbd1f5d)
  Thanks [@t3dotgg](https://github.com/t3dotgg)! - sync versions

- Updated dependencies []:
  - uploadthing@3.0.4

## 1.0.1

### Patch Changes

- [#41](https://github.com/pingdotgg/uploadthing/pull/41)
  [`225b6a4`](https://github.com/pingdotgg/uploadthing/commit/225b6a40d7a84ba6ea8c47faab77246b5b671ba8)
  Thanks [@OrJDev](https://github.com/OrJDev)! - feat: SolidJS adapter

- Updated dependencies
  [[`225b6a4`](https://github.com/pingdotgg/uploadthing/commit/225b6a40d7a84ba6ea8c47faab77246b5b671ba8),
  [`7244b84`](https://github.com/pingdotgg/uploadthing/commit/7244b8479b612f00360069c05aacf450b2b65696)]:
  - uploadthing@3.0.3
