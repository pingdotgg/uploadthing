<template>
  <main>
    <!--  FIXME: This should be typesafe and endpoint be autocompletable -->
    <UploadButton
      :config="{
        endpoint: 'videoAndImage',
      }"
    />

    <!--  FIXME: This should be typesafe and endpoint be autocompletable -->
    <UploadDropzone
      :config="{
        endpoint: 'videoAndImage',
      }"
    />
  </main>
</template>
