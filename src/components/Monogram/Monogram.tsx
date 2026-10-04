import "./Monogram.css";

const SMALL = new Set(["de", "do", "da", "dos", "das", "e", "a", "o", "of", "the", "and", "for", "para", "em", "no", "na"]);

/** Up to two initials from a name, or from a role when the name is hidden. */
export function initials(text: string): string {
  const words = text
    .replace(/\(.*?\)/g, " ")
    .split(/[\s/,.-]+/)
    .filter((w) => w && !SMALL.has(w.toLowerCase()));
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/** Placeholder mark for a partner without a logo. */
export function Monogram({ text }: { text: string }) {
  return (
    <span className="monogram" aria-hidden="true">
      {initials(text)}
    </span>
  );
}
