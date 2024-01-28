import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import cdn from "../src/index.js";

export default defineConfig({
  plugins: [cdn(), preact(), viteSingleFile()],
});
