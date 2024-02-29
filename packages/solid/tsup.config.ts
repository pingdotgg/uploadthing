import { defineConfig } from "tsup";
import * as preset from "tsup-preset-solid";

const preset_options: preset.PresetOptions = {
  entries: [
    {
      entry: "src/index.tsx",
      dev_entry: true,
      server_entry: true,
    },
  ],
  drop_console: false,
  cjs: true,
};

export default defineConfig((config) =>
  preset.generateTsupOptions(
    preset.parsePresetOptions(preset_options, !!config.watch),
  ),
);
