<template>
  <div>Playground</div>
  <UploadButton
    endpoint="videoAndImage"
    :config="{
      onClientUploadComplete(res) {
        res[0]?.serverData;
        expectTypeOf(res[0]?.serverData).toEqualTypeOf<{ foo: 'bar' }>()
      },
    }"
  />

  <UploadDropzone
    endpoint="e2"
    :on-client-upload-complete="
      (res) => {
        res[0]?.serverData;
      }
    "
    :config="{
      onClientUploadComplete(res) {
        res[0]?.serverData;
        expectTypeOf(res[0]?.serverData).toEqualTypeOf<{ bar: 'baz' }>()
      },
    }"
  />
</template>

<script setup lang="ts">
import { expectTypeOf } from "vitest";

useUploadThing("videoAndImage", {
  onClientUploadComplete(res) {
    expectTypeOf(res[0]?.serverData).toEqualTypeOf<{ foo: "bar" }>();
  },
});

useUploadThing("e2", {
  onClientUploadComplete(res) {
    expectTypeOf(res[0]?.serverData).toEqualTypeOf<{ bar: "baz" }>();
  },
});
</script>
