import _resolve from "resolve";

export interface PackageMeta {
  name: string;
  version: string;
}

export const resolve = (name: string) =>
  new Promise<PackageMeta | undefined>((resolveFn, rejectFn) =>
    _resolve(name, (e, _, meta) => {
      if (e) return rejectFn(e);

      return resolveFn(meta);
    })
  );
