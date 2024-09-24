<script lang="ts">
  import type { ClassListMerger } from "@uploadthing/shared";

  export let cn: ClassListMerger;
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={cn("fill-none stroke-current stroke-2", $$restProps.class)}
>
  <circle cx="12" cy="12" r="10" />
  <path d="m4.9 4.9 14.2 14.2" />
</svg>
