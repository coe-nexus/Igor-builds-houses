// Hash routing: the app lives at /#/96?lang=en&day=12 so GitHub Pages and the kiver.org iframe need no server rules.
// The query string is read from the hash first, then from location.search (so ?lang=en#/96 also works).

export type Location = { path: string; query: URLSearchParams };

export function readLocation(): Location {
  if (typeof window === "undefined") return { path: "/", query: new URLSearchParams() }; // unit tests run in node
  const raw = window.location.hash.replace(/^#/, "");
  const [pathPart = "", queryPart = ""] = raw.split("?");
  const query = new URLSearchParams(window.location.search);
  new URLSearchParams(queryPart).forEach((v, k) => query.set(k, v));
  const path = "/" + pathPart.replace(/^\/+|\/+$/g, "");
  return { path, query };
}

/** Link to a route, keeping the params that must survive navigation. */
export function href(path: string): string {
  const { query } = readLocation();
  const keep = new URLSearchParams();
  for (const k of ["lang", "embed"]) {
    const v = query.get(k);
    if (v) keep.set(k, v);
  }
  const qs = keep.toString();
  return `#${path}${qs ? `?${qs}` : ""}`;
}

/** Set or clear one query param in the hash without adding a history entry or firing hashchange. */
export function setQueryParam(key: string, value: string | null): void {
  const { path, query } = readLocation();
  if (value === null) query.delete(key);
  else query.set(key, value);
  const qs = query.toString();
  window.history.replaceState(null, "", `${window.location.pathname}#${path}${qs ? `?${qs}` : ""}`);
}
