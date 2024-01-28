import { Plugin } from "vite";
import { PackageMeta, resolve } from "./resolve.js";

export type FormatFn = (name: string, version: string, path?: string) => string;

export interface CdnPluginOptions {
  /**
   * example: `https://esm.sh/:name@:version`
   */
  pattern: string | FormatFn;
  excludes?: null | string[];
  packages: "all" | string[];
}

export const createFormatFn =
  (pattern: string): FormatFn =>
  (name, version, path = "") =>
    pattern
      .replace(":name", name)
      .replace(":version", version)
      .replace(":path", path);

export default function cdn({
  pattern = "https://esm.sh/:name@:version/:path",
  packages = "all",
  excludes,
}: Partial<CdnPluginOptions> = {}): Plugin {
  let modules = new Map<string, { path?: string; pkg: PackageMeta }>();

  const format =
    typeof pattern == "string"
      ? createFormatFn(pattern.replace(/\/+$/, ""))
      : pattern;

  return {
    name: "vite-cdn",
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
        (excludes && excludes.some((x) => pkg.name == x)) ||
        (packages != "all" && !packages.some((x) => pkg.name == x))
      )
        return;

      const resolved = `vite-cdn:${name}`;

      modules.set(resolved, {
        path,
        pkg,
      });

      return resolved;
    },
    load(id) {
      const info = modules.get(id);
      if (info == null) return;

      const { path, pkg } = info;

      const url = format(pkg.name, pkg.version, path);

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
              href: format(pkg.name, pkg.version, path),
            },
            injectTo: "head-prepend",
          };
        }),
      };
    },
  };
}
