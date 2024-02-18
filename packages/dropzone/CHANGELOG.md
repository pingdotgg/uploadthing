# @uploadthing/dropzone

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
