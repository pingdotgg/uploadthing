# Contributing to UploadThing

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/pingdotgg/uploadthing/main/assets/uploadthing-logo-dark-background.svg">
    <img src="https://github.com/pingdotgg/uploadthing/blob/main/assets/uploadthing-logo-light-background.svg" width="480" height="80" alt="Logo for UploadThing">
  </picture>
</p>

<p align="center">
  A thing for uploading files.
</p>

<div align="center">
  <a href="https://uploadthing.com">Home</a> | <a href="https://docs.uploadthing.com">Docs</a> | <a href="https://t3-tools.notion.site/776334c06d814dd08d450975bb983085">Roadmap</a>
</div>

## Table of Contents

This repository contains the packages, docs, and examples for UploadThing:

- [Next.js App Directory](https://github.com/pingdotgg/uploadthing/tree/main/examples/minimal-appdir) - A simple example using the Next.js app directory
- [Next.js Pages Directory](https://github.com/pingdotgg/uploadthing/tree/main/examples/minimal-pagedir) - A simple example using the Next.js pages directory
- [SolidStart SSR](https://github.com/pingdotgg/uploadthing/tree/main/examples/minimal-solidstart) - A simple example using SSR with SolidStart
- [Docs Site](https://github.com/pingdotgg/uploadthing/tree/main/docs) - Source for docs.uploadthing.com
- [React Package](https://github.com/pingdotgg/uploadthing/tree/main/packages/react) - _@uploadthing/react_ - the components and hooks for using UploadThing in your React projects
- [Solid Package](https://github.com/pingdotgg/uploadthing/tree/main/packages/solid) - _@uploadthing/solid_ - the components and hooks for using UploadThing in your Solid projects
- [uploadthing](https://github.com/pingdotgg/uploadthing/tree/main/packages/uploadthing) - server/client stuff (framework agnostic)

[Report an Issue](https://github.com/pingdotgg/uploadthing/issues/new)

## Contributing

All UploadThing SDKs are open source, and we welcome contributions from the community.

> **Note**  
> If your change also requires infrastructure changes, please reach out and we can work together to make the necessary changes on our end.

### Steps to Contribute

1. **Fork and clone the repository**: Create a fork of the repository on GitHub and clone it to your local machine.
2. **Install required tools**: Ensure you have the LTS version of Node.js installed, as well as the latest version of [pnpm](https://pnpm.io).
4. **Install project dependencies**:
```
pnpm install
```
6. **Implement your changes**: Make your changes, and include any necessary documentation or tests.
7. **Create a changeset**:
```
pnpm changeset
```
9. **Open a pull request**: Push your changes to your fork and open a pull request with your changes and changeset.

Thank you for your contributions!
