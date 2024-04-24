# @uploadthing/dropzone

## 0.4.0

### Minor Changes

- [#457](https://github.com/pingdotgg/uploadthing/pull/457) [`ea7e41b`](https://github.com/pingdotgg/uploadthing/commit/ea7e41b5d9d85135540d9b51fa5551859fbe7623) Thanks [@markflorkowski](https://github.com/markflorkowski)! - Effect rewrite

- [#293](https://github.com/pingdotgg/uploadthing/pull/293) [`09870e4`](https://github.com/pingdotgg/uploadthing/commit/09870e43f310c15e48f0089e875c6d9663fd305b) Thanks [@markflorkowski](https://github.com/markflorkowski)! - feat: vue and nuxt support!

### Patch Changes

- [#753](https://github.com/pingdotgg/uploadthing/pull/753) [`9b93886`](https://github.com/pingdotgg/uploadthing/commit/9b938860d49a1a593e38804f81c759925d713605) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: solid event propagations in `createDropzone`

## 0.3.1

### Patch Changes

- [#751](https://github.com/pingdotgg/uploadthing/pull/751) [`1960306`](https://github.com/pingdotgg/uploadthing/commit/196030685bc51a10df8cb413088fed37e7d5bb6c) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix: turbo cached build output

## 0.3.0

### Minor Changes

- [#225](https://github.com/pingdotgg/uploadthing/pull/225) [`838c242`](https://github.com/pingdotgg/uploadthing/commit/838c242806824f87f1a6f5788f34b1c470cb6bfe) Thanks [@AlanAcDz](https://github.com/AlanAcDz)! - feat: sveltekit support

  📚 Read the docs to get started: https://docs.uploadthing.com/getting-started/svelte

## 0.2.1

### Patch Changes

- [`d7c2018`](https://github.com/pingdotgg/uploadthing/commit/d7c2018f62c9e1ee9e0c11514e4ff3f28cc5e939) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix bad release with `workspace:` protocol in published distributions

## 0.2.0

### Minor Changes

- [#649](https://github.com/pingdotgg/uploadthing/pull/649) [`9ae82cd`](https://github.com/pingdotgg/uploadthing/commit/9ae82cd70ddca34f3e2547132d3b505fd665c205) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - bundle attr-accepts cause to improve ESM support

## 0.1.3

### Patch Changes

- [#620](https://github.com/pingdotgg/uploadthing/pull/620) [`0ee53b5`](https://github.com/pingdotgg/uploadthing/commit/0ee53b553e3304444d5fcf35fdfbd18cc317e668) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - fix(cjs bundling): force client splitting in .cjs output files

## 0.1.2

### Patch Changes

- [`352eea6`](https://github.com/pingdotgg/uploadthing/commit/352eea651218501f6535420287e8d8170faafec7) Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - chore: refactor bundling #579

## 0.1.1

### Patch Changes

- [#536](https://github.com/pingdotgg/uploadthing/pull/536)
  [`095fbbe`](https://github.com/pingdotgg/uploadthing/commit/095fbbe0babc375bcb1c06ac096a3d4d6e02c0e2)
  Thanks [@juliusmarminge](https://github.com/juliusmarminge)! - chore: minify
  usedropzone hook

  solidjs projects can now remove the `solidjs-dropzone` dependency as our own
  minimal hook has been made framework agnostic and is now bundled with the main
  package
