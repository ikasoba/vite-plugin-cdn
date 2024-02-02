import { Plugin } from "vite";
import { PackageMeta, resolve } from "./resolve.js";

export type FormatFn = (name: string, version: string, path?: string) => string;

export interface CdnPluginOptions {
  /**
   * example: `https://esm.sh/:name@:version/:path`
   */
  format: string | FormatFn;
  exclude: string[];
  include: "all" | string[];
}

export const createFormatFn =
  (pattern: string): FormatFn =>
  (name, version, path = "") =>
    pattern
      .replace(":name", name)
      .replace(":version", version)
      .replace(":path", path);

export default function cdn({
  format = "https://esm.sh/:name@:version/:path",
  include = "all",
  exclude = [],
}: Partial<CdnPluginOptions> = {}): Plugin {
  let modules = new Map<string, { path?: string; pkg: PackageMeta }>();

  const formatFn =
    typeof format == "string"
      ? createFormatFn(format.replace(/\/+$/, ""))
      : format;

  return {
    name: "vite:cdn",
    enforce: "pre",
    async resolveId(name) {
      const pkgName = name.match(
        /^[a-z0-9][a-z0-9_.-]*|^@[a-z0-9][a-z0-9_.-]*+\/[a-z0-9][a-z0-9_.-]*/i
      )?.[0];
      if (pkgName == null) return;

      const path = name.slice(pkgName.length).replace(/^\/+/, "") || undefined;

      const pkg = await resolve(pkgName).catch(() => null);
      if (
        pkg == null ||
        (pkg.name == "vite" && path == "modulepreload-polyfill") ||
        exclude.some((x) => pkg.name == x) ||
        (include != "all" && !include.some((x) => pkg.name == x))
      )
        return;

      modules.set(name, {
        path,
        pkg,
      });

      return name;
    },
    load(id) {
      const info = modules.get(id);
      if (info == null) return;

      const { path, pkg } = info;

      const url = formatFn(pkg.name, pkg.version, path);

      return `export * from ${JSON.stringify(url)};`;
    },
    transformIndexHtml(html) {
      return {
        html,
        tags: [...modules.entries()].map(([_, { path, pkg }]) => {
          return {
            tag: "link",
            attrs: {
              rel: "modulepreload",
              href: formatFn(pkg.name, pkg.version, path),
            },
            injectTo: "head-prepend",
          };
        }),
      };
    },
  };
}
