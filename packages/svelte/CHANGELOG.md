# @uploadthing/svelte

## 7.1.2

### Patch Changes

- Updated dependencies [[`4e1c34a`](https://github.com/pingdotgg/uploadthing/commit/4e1c34a529a4d25a3b8ccd595dbc6d136d59cea2), [`03dd9ee`](https://github.com/pingdotgg/uploadthing/commit/03dd9eeea6b7c3396a522140234a711705f52f9c)]:
  - @uploadthing/shared@7.1.2

## 7.1.1

### Patch Changes

- [#1044](https://github.com/pingdotgg/uploadthing/pull/1044) [`1afb1c9`](https://github.com/pingdotgg/uploadthing/commit/1afb1c941de6cb40aae344c8530e592f0b5f8ae6) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - refactor: simplify types for built file route

- Updated dependencies []:
  - @uploadthing/shared@7.1.1

## 7.1.0

### Minor Changes

- [#1008](https://github.com/pingdotgg/uploadthing/pull/1008) [`3acc199`](https://github.com/pingdotgg/uploadthing/commit/3acc199821637bda1605cd7130325e8783710908) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat: add support to specify route endpoint that supports "Go to Definition"

  All places that accept the `endpoint` argument now additionally accept a function that gets a route registry as input and returns the endpoint to use. This allows for "Go to Definition" to go to the backend route definition directly from the component.

  ### Examples

  ```ts
  // uploadthing/client#uploadFiles
  uploadFiles(
      (routeRegistry) => routeRegistry.videoAndImage,
      { ... }
  )

  // uploadthing/react#useUploadThing
  useUploadThing(
      (routeRegistry) => routeRegistry.videoAndImage,
      { ... }
  )

  // uploadthing/react#UploadButton
  <UploadButton
      endpoint={(routeRegistry) => routeRegistry.videoAndImage}
      { ... }
  />
  ```

### Patch Changes

- [`01b1363`](https://github.com/pingdotgg/uploadthing/commit/01b136310de7d620c3298d16f6cbd255e168c7e5) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - chore: bump internal effect dependencies (#1005, #1009)

- [#1029](https://github.com/pingdotgg/uploadthing/pull/1029) [`176b2e9`](https://github.com/pingdotgg/uploadthing/commit/176b2e9ed98a3e802182d95e34adbfcfe667d120) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - chore: update svelte peer dep range

- [`f73f393`](https://github.com/pingdotgg/uploadthing/commit/f73f39320f7c914a37df50c2bab4de2aacea3089) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - chore: allow svelte v5 peer dep (#1006)

- Updated dependencies [[`01b1363`](https://github.com/pingdotgg/uploadthing/commit/01b136310de7d620c3298d16f6cbd255e168c7e5), [`72ac250`](https://github.com/pingdotgg/uploadthing/commit/72ac25044f14d2c0b5c5b870b9bb4218c766abf2), [`3acc199`](https://github.com/pingdotgg/uploadthing/commit/3acc199821637bda1605cd7130325e8783710908)]:
  - @uploadthing/shared@7.1.0

## 7.0.3

### Patch Changes

- [#977](https://github.com/pingdotgg/uploadthing/pull/977) [`2afabe5`](https://github.com/pingdotgg/uploadthing/commit/2afabe59a0e6319ec469eba670b1e3e920f596ee) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - chore: remove internal dropzone package to prevent peer dependency conflicts between package managers

- [#980](https://github.com/pingdotgg/uploadthing/pull/980) [`e53bc01`](https://github.com/pingdotgg/uploadthing/commit/e53bc0175adff160a2bcaa621f66ed744f327c74) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: file picker would open twice when clicking the input element on the dropzone

- Updated dependencies [[`2afabe5`](https://github.com/pingdotgg/uploadthing/commit/2afabe59a0e6319ec469eba670b1e3e920f596ee), [`53f4ab6`](https://github.com/pingdotgg/uploadthing/commit/53f4ab6daa5b75b31c78e6ed441e4bf2f836c5d2), [`fe83f4a`](https://github.com/pingdotgg/uploadthing/commit/fe83f4a342f2e04bf5b069613621e77ec5acbe9e)]:
  - @uploadthing/shared@7.0.3

## 7.0.2

### Patch Changes

- Updated dependencies [[`a07817e`](https://github.com/pingdotgg/uploadthing/commit/a07817e6240898ab80fbb01b352501aab31ba6bc)]:
  - @uploadthing/shared@7.0.2

## 7.0.1

### Patch Changes

- Updated dependencies []:
  - @uploadthing/shared@7.0.1

## 7.0.0

### Patch Changes

- Updated dependencies [[`d69dd6e`](https://github.com/pingdotgg/uploadthing/commit/d69dd6e434281796cc41a3d70610ecffab7c3f13), [`d69dd6e`](https://github.com/pingdotgg/uploadthing/commit/d69dd6e434281796cc41a3d70610ecffab7c3f13), [`d69dd6e`](https://github.com/pingdotgg/uploadthing/commit/d69dd6e434281796cc41a3d70610ecffab7c3f13), [`d69dd6e`](https://github.com/pingdotgg/uploadthing/commit/d69dd6e434281796cc41a3d70610ecffab7c3f13), [`d69dd6e`](https://github.com/pingdotgg/uploadthing/commit/d69dd6e434281796cc41a3d70610ecffab7c3f13)]:
  - uploadthing@7.0.0
  - @uploadthing/shared@7.0.0

## 6.7.0

### Minor Changes

- [#886](https://github.com/pingdotgg/uploadthing/pull/886) [`079b434`](https://github.com/pingdotgg/uploadthing/commit/079b43423793b2c4510bc6058174d8607dd402c4) Thanks [@markflorkowski](https://github.com/markflorkowski)! - feat: Add `onChange` to `<UploadButton/>` and `<UploadDropzone />`. Deprecate dropzone's `onDrop`

### Patch Changes

- Updated dependencies [[`d1a8269`](https://github.com/pingdotgg/uploadthing/commit/d1a8269923a9574dfb812886ae7f73fb0c349195), [`5ff7648`](https://github.com/pingdotgg/uploadthing/commit/5ff7648b7537cac33f60411ae670f2113e97539c), [`9a69b90`](https://github.com/pingdotgg/uploadthing/commit/9a69b906ed921ac7d2b8aa56445f25935401f20e)]:
  - @uploadthing/shared@6.7.9

## 6.6.3

### Patch Changes

- Updated dependencies [[`df6334d`](https://github.com/pingdotgg/uploadthing/commit/df6334d368970ec9791b85f97c58eb7958421e78)]:
  - @uploadthing/shared@6.7.8

## 6.6.2

### Patch Changes

- Updated dependencies [[`47cece6`](https://github.com/pingdotgg/uploadthing/commit/47cece61d2a76fcdf498f15678528708c47e39b7)]:
  - @uploadthing/shared@6.7.7

## 6.6.1

### Patch Changes

- [#860](https://github.com/pingdotgg/uploadthing/pull/860) [`3377f1b`](https://github.com/pingdotgg/uploadthing/commit/3377f1b9f8d1ae87f7202bf0aeb67bb6a6fa1487) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: `onUploadProgress` events out of order when uploading many files

- Updated dependencies [[`f4f876c`](https://github.com/pingdotgg/uploadthing/commit/f4f876c1a0d4d0fe25302c84c0396fb737cd6458)]:
  - @uploadthing/shared@6.7.6

## 6.6.0

### Minor Changes

- [#809](https://github.com/pingdotgg/uploadthing/pull/809) [`ab89d48`](https://github.com/pingdotgg/uploadthing/commit/ab89d48177857cc4dfccc55346c425c4f103d63f) Thanks [@growupanand](https://github.com/growupanand)! - added onDrop prop for UploadDropzone component

### Patch Changes

- Updated dependencies [[`4fea8f4`](https://github.com/pingdotgg/uploadthing/commit/4fea8f409dd0baa921c41b09a8f2d87dfa269233), [`4f57264`](https://github.com/pingdotgg/uploadthing/commit/4f5726421e4c732857451bde23d833cd8c53c4b5), [`7d93270`](https://github.com/pingdotgg/uploadthing/commit/7d93270cc008666ebcb982c62754df9bbd2f62bf)]:
  - @uploadthing/shared@6.7.5

## 6.5.4

### Patch Changes

- Updated dependencies [[`811b4cb`](https://github.com/pingdotgg/uploadthing/commit/811b4cb96938dd498f55e323f34685cbc8cfea9c), [`5e6e64c`](https://github.com/pingdotgg/uploadthing/commit/5e6e64c53ac9765ceee4bb758a48e08eabb36d14)]:
  - @uploadthing/shared@6.7.4
  - @uploadthing/dropzone@0.4.1

## 6.5.3

### Patch Changes

- Updated dependencies [[`a1481a2`](https://github.com/pingdotgg/uploadthing/commit/a1481a2ae1221dc7e1091a364c8efd7fa3035544)]:
  - @uploadthing/shared@6.7.3

## 6.5.2

### Patch Changes

- Updated dependencies [[`69165fc`](https://github.com/pingdotgg/uploadthing/commit/69165fc4b4e4b02fe27e02d1991ea2cd3ae45c8a), [`6da018b`](https://github.com/pingdotgg/uploadthing/commit/6da018bfd4f2812ad81f36a7e3c9e3567c435b0b)]:
  - @uploadthing/shared@6.7.2

## 6.5.1

### Patch Changes

- Updated dependencies [[`594ae8a`](https://github.com/pingdotgg/uploadthing/commit/594ae8ae214ff717937c4787a3b8d1bd40b832cc), [`594ae8a`](https://github.com/pingdotgg/uploadthing/commit/594ae8ae214ff717937c4787a3b8d1bd40b832cc), [`0abfa03`](https://github.com/pingdotgg/uploadthing/commit/0abfa031d108edead78d9b71a61d2bfb7ad53a64)]:
  - @uploadthing/shared@6.7.1

## 6.5.0

### Minor Changes

- [#457](https://github.com/pingdotgg/uploadthing/pull/457) [`ea7e41b`](https://github.com/pingdotgg/uploadthing/commit/ea7e41b5d9d85135540d9b51fa5551859fbe7623) Thanks [@markflorkowski](https://github.com/markflorkowski)! - Effect rewrite

### Patch Changes

- Updated dependencies [[`9b93886`](https://github.com/pingdotgg/uploadthing/commit/9b938860d49a1a593e38804f81c759925d713605), [`ea7e41b`](https://github.com/pingdotgg/uploadthing/commit/ea7e41b5d9d85135540d9b51fa5551859fbe7623), [`41de3c5`](https://github.com/pingdotgg/uploadthing/commit/41de3c55c8bd808166449c09e9006650178067d5), [`09870e4`](https://github.com/pingdotgg/uploadthing/commit/09870e43f310c15e48f0089e875c6d9663fd305b)]:
  - @uploadthing/dropzone@0.4.0
  - @uploadthing/shared@6.7.0

## 6.4.1

### Patch Changes

- Updated dependencies [[`1960306`](https://github.com/pingdotgg/uploadthing/commit/196030685bc51a10df8cb413088fed37e7d5bb6c)]:
  - @uploadthing/dropzone@0.3.1

## 6.4.0

### Minor Changes

- [#225](https://github.com/pingdotgg/uploadthing/pull/225) [`838c242`](https://github.com/pingdotgg/uploadthing/commit/838c242806824f87f1a6f5788f34b1c470cb6bfe) Thanks [@AlanAcDz](https://github.com/AlanAcDz)! - feat: sveltekit support

  📚 Read the docs to get started: https://docs.uploadthing.com/getting-started/svelte

### Patch Changes

- Updated dependencies [[`838c242`](https://github.com/pingdotgg/uploadthing/commit/838c242806824f87f1a6f5788f34b1c470cb6bfe)]:
  - @uploadthing/dropzone@0.3.0
  - @uploadthing/shared@6.6.0
