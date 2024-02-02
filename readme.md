<h1>
<p align="center">vite-plugin-cdn📦</p>
</h1>

<p align="center">Plugin to use javascript package cdn in vite.</p>

```ts
import { defineConfig } from "vite";
import cdn from "@ikasoba000/vite-plugin-cdn";

export default defineConfig({
  plugins: [
    cdn()
  ],
});
```

# about

vite-plugin-cdn refers to esm.sh by default, but it can also refer to cdn such as skypack.

```ts
export default defineConfig({
  plugins: [
    cdn({
      // :name, :version, and :path are variable items.
      format: "https://cdn.skypack.dev/:name@:version/:path"
    })
  ],
});
```

The pattern can also specify a function.

```ts
export default defineConfig({
  plugins: [
    cdn({
      format(name: string, version: string, path?: string) {
        return name == "react"
          ? `https://esm.sh/preact@${version}/${path ?? ""}`
          : `https://cdn.skypack.dev/${name}@${version}/${path ?? ""}`;
      }
    })
  ],
});
```

You can explicitly select or exclude packages to be loaded from cdn.

```ts
export default defineConfig({
  plugins: [
    cdn({
      // By default, all packages are loaded from cdn.
      includes: [ <package-name>, ... ]
    })
  ],
});

// or

export default defineConfig({
  plugins: [
    cdn({
      // Packages specified here are not loaded from cdn,
      // but are bundled by vite in many cases.
      excludes: [ <package-name>, ... ]
    })
  ],
});
```
