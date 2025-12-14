import type { Config } from "tailwindcss";
import type { PluginAPI } from "tailwindcss/plugin";
import plugin from "tailwindcss/plugin";

type PluginFn = (api: PluginAPI) => void;
interface PluginWithConfig {
  handler: PluginFn;
  config?: Config;
}

/**
 * UploadThing Tailwind plugin which injects custom variants
 * for the built-in UI components
 * @see https://docs.uploadthing.com/concepts/theming#theming-with-tailwind-css
 *
 * When using this, you need to specify `content` manually. For automatic
 * detection, see {@link withUt}.
 */
export const uploadthingPlugin: PluginWithConfig = plugin(($) => {
  // Variants to select specific underlying element
  $.addVariant("ut-button", '&>*[data-ut-element="button"]');
  $.addVariant("ut-allowed-content", '&>*[data-ut-element="allowed-content"]');
  $.addVariant("ut-label", '&>*[data-ut-element="label"]');
  $.addVariant("ut-upload-icon", '&>*[data-ut-element="upload-icon"]');
  $.addVariant("ut-clear-btn", '&>*[data-ut-element="clear-btn"]');

  // Variants to select specific state
  $.addVariant("ut-readying", '&[data-state="readying"]');
  $.addVariant("ut-ready", '&[data-state="ready"]');
  $.addVariant("ut-uploading", '&[data-state="uploading"]');
});
