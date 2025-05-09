# @uploadthing/nuxt

## 7.1.8

### Patch Changes

- [#1193](https://github.com/pingdotgg/uploadthing/pull/1193)
  [`ff575c0`](https://github.com/pingdotgg/uploadthing/commit/ff575c0fdc4a6f6b16c0534657083bd2c49d51e8)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - chore: update
  internal effect version

- Updated dependencies
  [[`ff575c0`](https://github.com/pingdotgg/uploadthing/commit/ff575c0fdc4a6f6b16c0534657083bd2c49d51e8)]:
  - @uploadthing/vue@7.3.1

## 7.1.7

### Patch Changes

- Updated dependencies
  [[`67c3b1c`](https://github.com/pingdotgg/uploadthing/commit/67c3b1cdac7dfc72ccef7b2a2b4dcb8f09fabd8f)]:
  - @uploadthing/vue@7.3.0

## 7.1.6

### Patch Changes

- Updated dependencies
  [[`36b0df6`](https://github.com/pingdotgg/uploadthing/commit/36b0df6c3b94358d1a12112d661bc561256cc98e)]:
  - @uploadthing/vue@7.2.0

## 7.1.5

### Patch Changes

- [#1108](https://github.com/pingdotgg/uploadthing/pull/1108)
  [`b2de189`](https://github.com/pingdotgg/uploadthing/commit/b2de189ba88024eb141945eb034ccd547f946595)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - chore: more
  relaxed peer dep requirements between uploadthing packages

- Updated dependencies
  [[`b2de189`](https://github.com/pingdotgg/uploadthing/commit/b2de189ba88024eb141945eb034ccd547f946595)]:
  - @uploadthing/vue@7.1.5

## 7.1.4

### Patch Changes

- Updated dependencies
  [[`fdc68ba`](https://github.com/pingdotgg/uploadthing/commit/fdc68bae1f030fe1a3d3dbb06cc219f9612faf82)]:
  - @uploadthing/vue@7.1.4

## 7.1.3

### Patch Changes

- Updated dependencies []:
  - @uploadthing/vue@7.1.3

## 7.1.2

### Patch Changes

- [#1056](https://github.com/pingdotgg/uploadthing/pull/1056)
  [`4e1c34a`](https://github.com/pingdotgg/uploadthing/commit/4e1c34a529a4d25a3b8ccd595dbc6d136d59cea2)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix module
  options not honored due to static analysis

- Updated dependencies []:
  - @uploadthing/vue@7.1.2

## 7.1.1

### Patch Changes

- [#1044](https://github.com/pingdotgg/uploadthing/pull/1044)
  [`1afb1c9`](https://github.com/pingdotgg/uploadthing/commit/1afb1c941de6cb40aae344c8530e592f0b5f8ae6)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - refactor:
  simplify types for built file route

- [#1033](https://github.com/pingdotgg/uploadthing/pull/1033)
  [`de98bab`](https://github.com/pingdotgg/uploadthing/commit/de98babde74323fca4e376779161d9d22edd1b0a)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix:
  dynamically add either stylesheet or tailwind plugin based on whether
  `@nuxtjs/tailwindcss´ is installed

- Updated dependencies
  [[`1afb1c9`](https://github.com/pingdotgg/uploadthing/commit/1afb1c941de6cb40aae344c8530e592f0b5f8ae6)]:
  - @uploadthing/vue@7.1.1

## 7.1.0

### Minor Changes

- [#1008](https://github.com/pingdotgg/uploadthing/pull/1008)
  [`3acc199`](https://github.com/pingdotgg/uploadthing/commit/3acc199821637bda1605cd7130325e8783710908)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat: add
  support to specify route endpoint that supports "Go to Definition"

  All places that accept the `endpoint` argument now additionally accept a
  function that gets a route registry as input and returns the endpoint to use.
  This allows for "Go to Definition" to go to the backend route definition
  directly from the component.

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

- [#1018](https://github.com/pingdotgg/uploadthing/pull/1018)
  [`06c6787`](https://github.com/pingdotgg/uploadthing/commit/06c6787aacb7bf52919c1c767bef8b315010725c)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: options
  was not forwarded to uploadthing handler correctly

- Updated dependencies
  [[`01b1363`](https://github.com/pingdotgg/uploadthing/commit/01b136310de7d620c3298d16f6cbd255e168c7e5),
  [`3acc199`](https://github.com/pingdotgg/uploadthing/commit/3acc199821637bda1605cd7130325e8783710908)]:
  - @uploadthing/vue@7.1.0

## 7.0.3

### Patch Changes

- Updated dependencies
  [[`2afabe5`](https://github.com/pingdotgg/uploadthing/commit/2afabe59a0e6319ec469eba670b1e3e920f596ee),
  [`e53bc01`](https://github.com/pingdotgg/uploadthing/commit/e53bc0175adff160a2bcaa621f66ed744f327c74)]:
  - @uploadthing/vue@7.0.3

## 7.0.2

### Patch Changes

- Updated dependencies []:
  - @uploadthing/vue@7.0.2

## 7.0.1

### Patch Changes

- Updated dependencies []:
  - @uploadthing/vue@7.0.1

## 7.0.0

### Patch Changes

- Updated dependencies
  [[`d69dd6e`](https://github.com/pingdotgg/uploadthing/commit/d69dd6e434281796cc41a3d70610ecffab7c3f13),
  [`d69dd6e`](https://github.com/pingdotgg/uploadthing/commit/d69dd6e434281796cc41a3d70610ecffab7c3f13),
  [`d69dd6e`](https://github.com/pingdotgg/uploadthing/commit/d69dd6e434281796cc41a3d70610ecffab7c3f13),
  [`d69dd6e`](https://github.com/pingdotgg/uploadthing/commit/d69dd6e434281796cc41a3d70610ecffab7c3f13),
  [`d69dd6e`](https://github.com/pingdotgg/uploadthing/commit/d69dd6e434281796cc41a3d70610ecffab7c3f13)]:
  - uploadthing@7.0.0
  - @uploadthing/vue@7.0.0

## 6.5.10

### Patch Changes

- Updated dependencies
  [[`079b434`](https://github.com/pingdotgg/uploadthing/commit/079b43423793b2c4510bc6058174d8607dd402c4)]:
  - @uploadthing/vue@6.7.0

## 6.5.9

### Patch Changes

- Updated dependencies []:
  - @uploadthing/vue@6.6.3

## 6.5.8

### Patch Changes

- Updated dependencies []:
  - @uploadthing/vue@6.6.2

## 6.5.7

### Patch Changes

- Updated dependencies
  [[`3377f1b`](https://github.com/pingdotgg/uploadthing/commit/3377f1b9f8d1ae87f7202bf0aeb67bb6a6fa1487)]:
  - @uploadthing/vue@6.6.1

## 6.5.6

### Patch Changes

- Updated dependencies
  [[`ab89d48`](https://github.com/pingdotgg/uploadthing/commit/ab89d48177857cc4dfccc55346c425c4f103d63f)]:
  - @uploadthing/vue@6.6.0

## 6.5.5

### Patch Changes

- Updated dependencies []:
  - @uploadthing/vue@6.5.4

## 6.5.4

### Patch Changes

- Updated dependencies []:
  - @uploadthing/vue@6.5.3

## 6.5.3

### Patch Changes

- Updated dependencies []:
  - @uploadthing/vue@6.5.2

## 6.5.2

### Patch Changes

- Updated dependencies []:
  - @uploadthing/vue@6.5.1

## 6.5.1

### Patch Changes

- [#767](https://github.com/pingdotgg/uploadthing/pull/767)
  [`2133e57`](https://github.com/pingdotgg/uploadthing/commit/2133e5710e4265b9da4417771eccc5ef9ad8c2ca)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix bad release
  artifacts

## 6.5.0

### Minor Changes

- [#293](https://github.com/pingdotgg/uploadthing/pull/293)
  [`09870e4`](https://github.com/pingdotgg/uploadthing/commit/09870e43f310c15e48f0089e875c6d9663fd305b)
  Thanks [@markflorkowski](https://github.com/markflorkowski)! - feat: vue and
  nuxt support!

### Patch Changes

- Updated dependencies
  [[`09870e4`](https://github.com/pingdotgg/uploadthing/commit/09870e43f310c15e48f0089e875c6d9663fd305b)]:
  - @uploadthing/vue@6.5.0
