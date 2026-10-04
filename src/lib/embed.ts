import { useEffect } from "react";
import { readLocation } from "./url";

/** ?embed=1: the page runs inside an iframe on kiver.org (SPEC §6, §13). Decided once per load. */
export const EMBED: boolean = typeof window !== "undefined" && readLocation().query.get("embed") === "1";

/** Tell the parent page how tall the content is, so the iframe can resize: postMessage({type:"kiver-build:height"}). */
export function useEmbedHeight(): void {
  useEffect(() => {
    if (!EMBED || window.parent === window) return;
    const root = document.getElementById("root");
    if (!root) return;
    let last = 0;
    const post = () => {
      const height = Math.ceil(root.getBoundingClientRect().height);
      if (height !== last) {
        last = height;
        window.parent.postMessage({ type: "kiver-build:height", height }, "*");
      }
    };
    const ro = new ResizeObserver(post);
    ro.observe(root);
    window.addEventListener("resize", post);
    post();
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", post);
    };
  }, []);
}
