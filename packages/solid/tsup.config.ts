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

export default defineConfig(async (config) => {
  const watching = !!config.watch;

  const parsed_data = preset.parsePresetOptions(preset_options, watching);

  if (!watching) {
    const package_fields = preset.generatePackageExports(parsed_data);

    console.log(
      `\npackage.json: \n${JSON.stringify(package_fields, null, 2)}\n\n`,
    );

    await preset.writePackageJson(package_fields);
  }

  return preset.generateTsupOptions(parsed_data);
});
