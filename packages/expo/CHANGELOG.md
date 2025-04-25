# @uploadthing/expo

## 7.2.2

### Patch Changes

- Updated dependencies
  [[`67c3b1c`](https://github.com/pingdotgg/uploadthing/commit/67c3b1cdac7dfc72ccef7b2a2b4dcb8f09fabd8f),
  [`a1e13b5`](https://github.com/pingdotgg/uploadthing/commit/a1e13b5de616c7b7ff20660fe2b43eddf3bc4293)]:
  - @uploadthing/react@7.3.0
  - @uploadthing/shared@7.1.7

## 7.2.1

### Patch Changes

- [#1144](https://github.com/pingdotgg/uploadthing/pull/1144)
  [`511dc21`](https://github.com/pingdotgg/uploadthing/commit/511dc21e2265b8b003b989abff9a5505bd89482c)
  Thanks [@ashaller2017](https://github.com/ashaller2017)! - Add quality params
  to openImagePicker

- Updated dependencies
  [[`80d12a3`](https://github.com/pingdotgg/uploadthing/commit/80d12a3eb5cb507588451ee3ea4f0206fa7f839f)]:
  - @uploadthing/react@7.2.1

## 7.2.0

### Minor Changes

- [#1099](https://github.com/pingdotgg/uploadthing/pull/1099)
  [`36b0df6`](https://github.com/pingdotgg/uploadthing/commit/36b0df6c3b94358d1a12112d661bc561256cc98e)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat: allow
  custom fetch override

### Patch Changes

- Updated dependencies
  [[`f08b20e`](https://github.com/pingdotgg/uploadthing/commit/f08b20e1bc9a790025b42807ce2f502a7863800d),
  [`36b0df6`](https://github.com/pingdotgg/uploadthing/commit/36b0df6c3b94358d1a12112d661bc561256cc98e)]:
  - @uploadthing/shared@7.1.6
  - @uploadthing/react@7.2.0

## 7.1.5

### Patch Changes

- [#1108](https://github.com/pingdotgg/uploadthing/pull/1108)
  [`b2de189`](https://github.com/pingdotgg/uploadthing/commit/b2de189ba88024eb141945eb034ccd547f946595)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - chore: more
  relaxed peer dep requirements between uploadthing packages

- Updated dependencies
  [[`b2de189`](https://github.com/pingdotgg/uploadthing/commit/b2de189ba88024eb141945eb034ccd547f946595)]:
  - @uploadthing/react@7.1.5
  - @uploadthing/shared@7.1.5

## 7.1.4

### Patch Changes

- [#1103](https://github.com/pingdotgg/uploadthing/pull/1103)
  [`fdc68ba`](https://github.com/pingdotgg/uploadthing/commit/fdc68bae1f030fe1a3d3dbb06cc219f9612faf82)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: tidy up
  ranges for peer dependencies

- Updated dependencies
  [[`fdc68ba`](https://github.com/pingdotgg/uploadthing/commit/fdc68bae1f030fe1a3d3dbb06cc219f9612faf82)]:
  - @uploadthing/react@7.1.4
  - @uploadthing/shared@7.1.4

## 7.1.3

### Patch Changes

- Updated dependencies
  [[`1defbc7`](https://github.com/pingdotgg/uploadthing/commit/1defbc78deb6f4d1c82f45c9e937ec3f73dd2400)]:
  - @uploadthing/shared@7.1.3
  - @uploadthing/react@7.1.3

## 7.1.2

### Patch Changes

- Updated dependencies
  [[`4e1c34a`](https://github.com/pingdotgg/uploadthing/commit/4e1c34a529a4d25a3b8ccd595dbc6d136d59cea2),
  [`03dd9ee`](https://github.com/pingdotgg/uploadthing/commit/03dd9eeea6b7c3396a522140234a711705f52f9c)]:
  - @uploadthing/shared@7.1.2
  - @uploadthing/react@7.1.2

## 7.1.1

### Patch Changes

- [#1044](https://github.com/pingdotgg/uploadthing/pull/1044)
  [`1afb1c9`](https://github.com/pingdotgg/uploadthing/commit/1afb1c941de6cb40aae344c8530e592f0b5f8ae6)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - refactor:
  simplify types for built file route

- Updated dependencies
  [[`1afb1c9`](https://github.com/pingdotgg/uploadthing/commit/1afb1c941de6cb40aae344c8530e592f0b5f8ae6)]:
  - @uploadthing/react@7.1.1
  - @uploadthing/shared@7.1.1

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

- Updated dependencies
  [[`01b1363`](https://github.com/pingdotgg/uploadthing/commit/01b136310de7d620c3298d16f6cbd255e168c7e5),
  [`72ac250`](https://github.com/pingdotgg/uploadthing/commit/72ac25044f14d2c0b5c5b870b9bb4218c766abf2),
  [`3acc199`](https://github.com/pingdotgg/uploadthing/commit/3acc199821637bda1605cd7130325e8783710908)]:
  - @uploadthing/react@7.1.0
  - @uploadthing/shared@7.1.0

## 7.0.3

### Patch Changes

- [#989](https://github.com/pingdotgg/uploadthing/pull/989)
  [`53f4ab6`](https://github.com/pingdotgg/uploadthing/commit/53f4ab6daa5b75b31c78e6ed441e4bf2f836c5d2)
  Thanks [@juraj98](https://github.com/juraj98)! - fix vite monorepos sometimes
  complaining about `$RefreshSig$ is not a function`

- Updated dependencies
  [[`cfba572`](https://github.com/pingdotgg/uploadthing/commit/cfba572b88d761da4fc4e6afa04c06fd4b5355de),
  [`2afabe5`](https://github.com/pingdotgg/uploadthing/commit/2afabe59a0e6319ec469eba670b1e3e920f596ee),
  [`e53bc01`](https://github.com/pingdotgg/uploadthing/commit/e53bc0175adff160a2bcaa621f66ed744f327c74),
  [`53f4ab6`](https://github.com/pingdotgg/uploadthing/commit/53f4ab6daa5b75b31c78e6ed441e4bf2f836c5d2),
  [`fe83f4a`](https://github.com/pingdotgg/uploadthing/commit/fe83f4a342f2e04bf5b069613621e77ec5acbe9e)]:
  - @uploadthing/react@7.0.3
  - @uploadthing/shared@7.0.3

## 7.0.2

### Patch Changes

- Updated dependencies
  [[`a07817e`](https://github.com/pingdotgg/uploadthing/commit/a07817e6240898ab80fbb01b352501aab31ba6bc)]:
  - @uploadthing/shared@7.0.2
  - @uploadthing/react@7.0.2

## 7.0.1

### Patch Changes

- Updated dependencies []:
  - @uploadthing/shared@7.0.1
  - @uploadthing/react@7.0.1

## 7.0.0

### Patch Changes

- Updated dependencies
  [[`d69dd6e`](https://github.com/pingdotgg/uploadthing/commit/d69dd6e434281796cc41a3d70610ecffab7c3f13),
  [`d69dd6e`](https://github.com/pingdotgg/uploadthing/commit/d69dd6e434281796cc41a3d70610ecffab7c3f13),
  [`d69dd6e`](https://github.com/pingdotgg/uploadthing/commit/d69dd6e434281796cc41a3d70610ecffab7c3f13),
  [`d69dd6e`](https://github.com/pingdotgg/uploadthing/commit/d69dd6e434281796cc41a3d70610ecffab7c3f13),
  [`d69dd6e`](https://github.com/pingdotgg/uploadthing/commit/d69dd6e434281796cc41a3d70610ecffab7c3f13)]:
  - uploadthing@7.0.0
  - @uploadthing/shared@7.0.0
  - @uploadthing/react@7.0.0

## 6.7.3

### Patch Changes

- Updated dependencies
  [[`079b434`](https://github.com/pingdotgg/uploadthing/commit/079b43423793b2c4510bc6058174d8607dd402c4),
  [`d1a8269`](https://github.com/pingdotgg/uploadthing/commit/d1a8269923a9574dfb812886ae7f73fb0c349195),
  [`5ff7648`](https://github.com/pingdotgg/uploadthing/commit/5ff7648b7537cac33f60411ae670f2113e97539c),
  [`9a69b90`](https://github.com/pingdotgg/uploadthing/commit/9a69b906ed921ac7d2b8aa56445f25935401f20e)]:
  - @uploadthing/react@6.8.0
  - @uploadthing/shared@6.7.9

## 6.7.2

### Patch Changes

- Updated dependencies
  [[`df6334d`](https://github.com/pingdotgg/uploadthing/commit/df6334d368970ec9791b85f97c58eb7958421e78)]:
  - @uploadthing/shared@6.7.8
  - @uploadthing/react@6.7.2

## 6.7.1

### Patch Changes

- Updated dependencies
  [[`47cece6`](https://github.com/pingdotgg/uploadthing/commit/47cece61d2a76fcdf498f15678528708c47e39b7)]:
  - @uploadthing/shared@6.7.7
  - @uploadthing/react@6.7.1

## 6.7.0

### Minor Changes

- [#583](https://github.com/pingdotgg/uploadthing/pull/583)
  [`7f6df43`](https://github.com/pingdotgg/uploadthing/commit/7f6df4312d65aa6fd35911c0a7e388cda39eb2bd)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - feat: support
  expo

### Patch Changes

- Updated dependencies
  [[`7f6df43`](https://github.com/pingdotgg/uploadthing/commit/7f6df4312d65aa6fd35911c0a7e388cda39eb2bd),
  [`c8bdbf8`](https://github.com/pingdotgg/uploadthing/commit/c8bdbf8293be2b235a936214ccec398266851f16),
  [`f4f876c`](https://github.com/pingdotgg/uploadthing/commit/f4f876c1a0d4d0fe25302c84c0396fb737cd6458),
  [`3f3fa57`](https://github.com/pingdotgg/uploadthing/commit/3f3fa572e41dec0dd8ebc94aef20648a8f3bf8d4),
  [`3377f1b`](https://github.com/pingdotgg/uploadthing/commit/3377f1b9f8d1ae87f7202bf0aeb67bb6a6fa1487)]:
  - @uploadthing/react@6.7.0
  - @uploadthing/shared@6.7.6
