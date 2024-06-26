# @uploadthing/shared

## 6.7.6

### Patch Changes

- [#841](https://github.com/pingdotgg/uploadthing/pull/841) [`f4f876c`](https://github.com/pingdotgg/uploadthing/commit/f4f876c1a0d4d0fe25302c84c0396fb737cd6458) Thanks [@tim-smart](https://github.com/tim-smart)! - refactor: use `effect/Micro` for client bundle, reducing bundle size shipped to browser by 84kB (-67%)

## 6.7.5

### Patch Changes

- [#808](https://github.com/pingdotgg/uploadthing/pull/808) [`4fea8f4`](https://github.com/pingdotgg/uploadthing/commit/4fea8f409dd0baa921c41b09a8f2d87dfa269233) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix treeshakeability of `Effect` dependency by avoiding top-level function calls, and falling back to `#__PURE__` directives otherwise

  Importing some utility from e.g. `@uploadthing/shared` should not explode bundle if `Effect` isn't used for other stuff

- [#810](https://github.com/pingdotgg/uploadthing/pull/810) [`4f57264`](https://github.com/pingdotgg/uploadthing/commit/4f5726421e4c732857451bde23d833cd8c53c4b5) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - dump all matching mimetypes when using "catch-all" generic types to support more browser / OS configurations

- [#813](https://github.com/pingdotgg/uploadthing/pull/813) [`7d93270`](https://github.com/pingdotgg/uploadthing/commit/7d93270cc008666ebcb982c62754df9bbd2f62bf) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - refactor header parsing to support breaking change in Node.js 20.13

## 6.7.4

### Patch Changes

- [`811b4cb`](https://github.com/pingdotgg/uploadthing/commit/811b4cb96938dd498f55e323f34685cbc8cfea9c) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - chore: remove `@effect/schema` from client bundle resulting in up to 15kB less JS shipped to client (#794)

- [#806](https://github.com/pingdotgg/uploadthing/pull/806) [`5e6e64c`](https://github.com/pingdotgg/uploadthing/commit/5e6e64c53ac9765ceee4bb758a48e08eabb36d14) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - set `sideEffects: false` for better tree-shaking

## 6.7.3

### Patch Changes

- [#792](https://github.com/pingdotgg/uploadthing/pull/792) [`a1481a2`](https://github.com/pingdotgg/uploadthing/commit/a1481a2ae1221dc7e1091a364c8efd7fa3035544) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: isPollingResponse was not checking against response json

## 6.7.2

### Patch Changes

- [#791](https://github.com/pingdotgg/uploadthing/pull/791) [`69165fc`](https://github.com/pingdotgg/uploadthing/commit/69165fc4b4e4b02fe27e02d1991ea2cd3ae45c8a) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: catch FiberFailure's and squash them to the original error

- [#783](https://github.com/pingdotgg/uploadthing/pull/783) [`6da018b`](https://github.com/pingdotgg/uploadthing/commit/6da018bfd4f2812ad81f36a7e3c9e3567c435b0b) Thanks [@datner](https://github.com/datner)! - refactoring small parts of uploadFile and related utils

## 6.7.1

### Patch Changes

- [#770](https://github.com/pingdotgg/uploadthing/pull/770) [`594ae8a`](https://github.com/pingdotgg/uploadthing/commit/594ae8ae214ff717937c4787a3b8d1bd40b832cc) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: add missing `fast-check` peer dependency from `@effect/schema`

- [#770](https://github.com/pingdotgg/uploadthing/pull/770) [`594ae8a`](https://github.com/pingdotgg/uploadthing/commit/594ae8ae214ff717937c4787a3b8d1bd40b832cc) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: better error logging for bad requests

- [#775](https://github.com/pingdotgg/uploadthing/pull/775) [`0abfa03`](https://github.com/pingdotgg/uploadthing/commit/0abfa031d108edead78d9b71a61d2bfb7ad53a64) Thanks [@tim-smart](https://github.com/tim-smart)! - update "effect" & switch to alias imports

## 6.7.0

### Minor Changes

- [#457](https://github.com/pingdotgg/uploadthing/pull/457) [`ea7e41b`](https://github.com/pingdotgg/uploadthing/commit/ea7e41b5d9d85135540d9b51fa5551859fbe7623) Thanks [@markflorkowski](https://github.com/markflorkowski)! - Effect rewrite

- [#293](https://github.com/pingdotgg/uploadthing/pull/293) [`09870e4`](https://github.com/pingdotgg/uploadthing/commit/09870e43f310c15e48f0089e875c6d9663fd305b) Thanks [@markflorkowski](https://github.com/markflorkowski)! - feat: vue and nuxt support!

### Patch Changes

- [`41de3c5`](https://github.com/pingdotgg/uploadthing/commit/41de3c55c8bd808166449c09e9006650178067d5) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - chore: force dependency bumps

## 6.6.0

### Minor Changes

- [#225](https://github.com/pingdotgg/uploadthing/pull/225) [`838c242`](https://github.com/pingdotgg/uploadthing/commit/838c242806824f87f1a6f5788f34b1c470cb6bfe) Thanks [@AlanAcDz](https://github.com/AlanAcDz)! - feat: sveltekit support

  📚 Read the docs to get started: https://docs.uploadthing.com/getting-started/svelte

## 6.5.0

### Minor Changes

- [#739](https://github.com/pingdotgg/uploadthing/pull/739) [`d627742`](https://github.com/pingdotgg/uploadthing/commit/d6277425c8b11ff92ad3168d302e54f70e6f2667) Thanks [@markflorkowski](https://github.com/markflorkowski)! - feat: minFileCount option on RouteConfig

## 6.4.0

### Minor Changes

- [#725](https://github.com/pingdotgg/uploadthing/pull/725) [`6d9e90b`](https://github.com/pingdotgg/uploadthing/commit/6d9e90b1035f858af2c90d66d6c01f41ed80aa97) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat: verify callback data signature

## 6.3.4

### Patch Changes

- [`d7c2018`](https://github.com/pingdotgg/uploadthing/commit/d7c2018f62c9e1ee9e0c11514e4ff3f28cc5e939) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix bad release with `workspace:` protocol in published distributions

## 6.3.3

### Patch Changes

- [#662](https://github.com/pingdotgg/uploadthing/pull/662) [`77740a8`](https://github.com/pingdotgg/uploadthing/commit/77740a84266a5c2f1c7e485d8bf41d768e91e1df) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - make API more consistent with the available file data in different callbacks

- [#659](https://github.com/pingdotgg/uploadthing/pull/659) [`a9c9443`](https://github.com/pingdotgg/uploadthing/commit/a9c94436d63af524991fb166879a906016bd6e20) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - refactor: move some internally exported functions to `@uploadthing/shared`

## 6.3.2

### Patch Changes

- [#641](https://github.com/pingdotgg/uploadthing/pull/641) [`f0a4ae4`](https://github.com/pingdotgg/uploadthing/commit/f0a4ae4f491c4e2a5c4517b27e5d76617d5db004) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - chore: move some types to `@uploadthing/shared`

- [#630](https://github.com/pingdotgg/uploadthing/pull/630) [`28edc15`](https://github.com/pingdotgg/uploadthing/commit/28edc151a7f0e551783f2593b0abd3c598d91bd1) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - chore: enforce compatible `uploadthing` version for `@uploadthing/react`

## 6.3.1

### Patch Changes

- [#620](https://github.com/pingdotgg/uploadthing/pull/620) [`0ee53b5`](https://github.com/pingdotgg/uploadthing/commit/0ee53b553e3304444d5fcf35fdfbd18cc317e668) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix(cjs bundling): force client splitting in .cjs output files

## 6.3.0

### Minor Changes

- [#587](https://github.com/pingdotgg/uploadthing/pull/587) [`83e544d`](https://github.com/pingdotgg/uploadthing/commit/83e544d3b221c74e2cf83abbc023d8890d3d924e) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat: add ability to provide custom identifiers when uploading files

  also adds ability for UTApi methods to filter based on custom identifiers

  ```ts
  // bind custom id when uploading
  f(["image"]).middleware(({ files }) => {
    const filesWithIds = files.map((f) => ({
      ...f,
      customId: uuid(),
    }));
    return { my: "metadata", [UTFiles]: filesWithIds };
  });

  // filter based on custom id
  const utapi = new UTApi();
  utapi.getFileUrl("my-uuid", { keyType: "customId" });

  // or, set a global keyType default
  const utapi = new UTApi({ defaultKeyType: "customId" });
  utapi.getFileUrl("my-uuid");
  ```

- [#598](https://github.com/pingdotgg/uploadthing/pull/598) [`04d145e`](https://github.com/pingdotgg/uploadthing/commit/04d145eef140de55810b8d54f6859607ef5fa09a) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat: use presigned post uploads for small files to reduce overhead time of multipart

### Patch Changes

- [`352eea6`](https://github.com/pingdotgg/uploadthing/commit/352eea651218501f6535420287e8d8170faafec7) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - chore: refactor bundling #579

## 6.2.1

### Patch Changes

- [#582](https://github.com/pingdotgg/uploadthing/pull/582) [`d6c8358`](https://github.com/pingdotgg/uploadthing/commit/d6c8358e535843e82427dd904e6b90c8328dd61f) Thanks [@GentikSolm](https://github.com/GentikSolm)! - feat: float error messages to client for UploadThingErrors. Read the [error handling docs 📚](https://docs.uploadthing.com/errors) to find out more.

## 6.2.0

### Minor Changes

- [`6d54854`](https://github.com/pingdotgg/uploadthing/commit/6d548541c3b45679f6493c74274f0d988b5430e4)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat: support
  cloudflare workers

## 6.1.0

### Minor Changes

- [#545](https://github.com/pingdotgg/uploadthing/pull/545)
  [`2d8b31c`](https://github.com/pingdotgg/uploadthing/commit/2d8b31c57260e3607ea16ce9dfcfeee08b074933)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat: add
  `logLevel` option to enable more verbose logging

- [#525](https://github.com/pingdotgg/uploadthing/pull/525)
  [`98f9e0d`](https://github.com/pingdotgg/uploadthing/commit/98f9e0de1eabe5520757a7da0a7b0e90624c9d60)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat: add
  `utapi.getSignedURL` and ACL configuration options on file routes and
  `utapi.uploadFiles`

## 6.0.3

### Patch Changes

- [#527](https://github.com/pingdotgg/uploadthing/pull/527)
  [`cfd5381`](https://github.com/pingdotgg/uploadthing/commit/cfd53811b6267a5f20ba9334f82937f27c3be346)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fallback to
  blob filetype if allowed

## 6.0.2

### Patch Changes

- [#487](https://github.com/pingdotgg/uploadthing/pull/487)
  [`afc793e`](https://github.com/pingdotgg/uploadthing/commit/afc793e0635c7c4cee7592262b8aa13e5b2c7d55)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix:
  exponential backoff infinite loop

## 6.0.1

### Patch Changes

- [#480](https://github.com/pingdotgg/uploadthing/pull/480)
  [`67109c8`](https://github.com/pingdotgg/uploadthing/commit/67109c835f3416d2928c0faa9e2fd99a1bcd2370)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: serverdata
  polling timed out and returned 504

## 6.0.0

### Major Changes

- [#432](https://github.com/pingdotgg/uploadthing/pull/432)
  [`328f59b`](https://github.com/pingdotgg/uploadthing/commit/328f59b324a5013620dbf9c30023e9d3b0ee6141)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat!:
  multipart uploads

  supports uploading larger files and uploads are now up to 2x faster

## 5.2.7

- Updated dependencies
  [[`eb5f96d`](https://github.com/pingdotgg/uploadthing/commit/eb5f96dc06a81ecb4b1f7ee3d0ba259ebdfee7d1)]:
  - @uploadthing/mime-types@0.2.2

## 5.2.6

### Patch Changes

- [#441](https://github.com/pingdotgg/uploadthing/pull/441)
  [`da43651`](https://github.com/pingdotgg/uploadthing/commit/da436516a9c1e30268878016a9c1dc930bc384f6)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - chore:
  changeset for zod removal

## 5.2.5

### Patch Changes

- [#404](https://github.com/pingdotgg/uploadthing/pull/404)
  [`6bd4ead`](https://github.com/pingdotgg/uploadthing/commit/6bd4ead898c824646c47d4899e3e610283a55c5a)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - better error
  handling of invalid json parsing

## 5.2.4

### Patch Changes

- [#406](https://github.com/pingdotgg/uploadthing/pull/406)
  [`fd24c9d`](https://github.com/pingdotgg/uploadthing/commit/fd24c9d2b4e8be089bae2c9cb78d8f1b1fa80c16)
  Thanks [@daalvarado](https://github.com/daalvarado)! - fix: Add optional to
  import.meta.env call for better Remix support

## 5.2.3

### Patch Changes

- [#403](https://github.com/pingdotgg/uploadthing/pull/403)
  [`ee8533a`](https://github.com/pingdotgg/uploadthing/commit/ee8533a21e82c786537cea5dd7e98fcb71bb5131)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: wrap
  response.json in try-catch block

## 5.2.2

### Patch Changes

- [#292](https://github.com/pingdotgg/uploadthing/pull/292)
  [`92fac44`](https://github.com/pingdotgg/uploadthing/commit/92fac447f525be027125004f8cc0607b32375997)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: code path
  that prefers process.env is now safely accessed and falls back to checking
  import.meta.env

## 5.2.1

### Patch Changes

- [#281](https://github.com/pingdotgg/uploadthing/pull/281)
  [`86d72be`](https://github.com/pingdotgg/uploadthing/commit/86d72be25c794aadcfe55a08095b487a782e2dc8)
  Thanks [@Mr0Bread](https://github.com/Mr0Bread)! - fix: added settings to
  support cjs imports

## 5.2.0

### Minor Changes

- [#255](https://github.com/pingdotgg/uploadthing/pull/255)
  [`fe46b81`](https://github.com/pingdotgg/uploadthing/commit/fe46b814aa75646eac0694fdcb3889a3f7f5122b)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat: add
  serialization functions for UploadthingError

## 5.1.0

### Minor Changes

- [#195](https://github.com/pingdotgg/uploadthing/pull/195)
  [`a6c969e`](https://github.com/pingdotgg/uploadthing/commit/a6c969e67c85df490907b121d8e7df41779172b3)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat: improve
  errors and add `errorFormatter` option on the backend

### Patch Changes

- [#192](https://github.com/pingdotgg/uploadthing/pull/192)
  [`c508868`](https://github.com/pingdotgg/uploadthing/commit/c508868690d3de48094c10a7facb880662d03b6a)
  Thanks [@GentikSolm](https://github.com/GentikSolm)! - fix(types): change
  internal types to solve declaration emitting

- [#207](https://github.com/pingdotgg/uploadthing/pull/207)
  [`f3640fb`](https://github.com/pingdotgg/uploadthing/commit/f3640fb0872a12fe0ad95e0ac604136113fa6ca4)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - fix(shared):
  Swap order of cases in `getUploadthingUrl()`

## 5.0.1

### Patch Changes

- [#185](https://github.com/pingdotgg/uploadthing/pull/185)
  [`a0cc65c`](https://github.com/pingdotgg/uploadthing/commit/a0cc65c779f81e1455dd5ec14ce9663ff231ea73)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - [fix] Add
  missing `size` to `file` object in simulated callback

## 5.0.0

### Patch Changes

- [#136](https://github.com/pingdotgg/uploadthing/pull/136)
  [`23a9e19`](https://github.com/pingdotgg/uploadthing/commit/23a9e19702a51dec2ace869f47211f883d888d74)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - implement a
  shared package that can be used to share types and utils between oss and infra
  repo
- Updated dependencies
  [[`23a9e19`](https://github.com/pingdotgg/uploadthing/commit/23a9e19702a51dec2ace869f47211f883d888d74)]:
  - @uploadthing/mime-types@0.2.0
