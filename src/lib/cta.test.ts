import { describe, expect, it } from "vitest";
import { cta } from "./data";
import { prefillCode, prefillText, whatsappHref } from "./cta";
import { faqFor } from "./faq";
import { MODEL_IDS } from "./types";

describe("WhatsApp CTAs", () => {
  it("the hero CTA on the 96 opens WhatsApp with [K96-H] in the text", () => {
    const href = whatsappHref("k96", "H", "pt");
    expect(href.startsWith(`https://wa.me/${cta.whatsapp_number_e164}?text=`)).toBe(true);
    expect(decodeURIComponent(href.split("?text=")[1])).toContain("[K96-H]");
    expect(prefillText("k96", "H", "pt")).toContain("Kiver 96");
    expect(prefillText("k96", "H", "en")).toMatch(/^Hi Kiver Build\. I came from the Kiver 96 page \[K96-H\]/);
  });
  it("codes follow model and placement", () => {
    expect(prefillCode("k144max", "B")).toBe("[K144MAX-B]");
    expect(prefillCode("k64", "T")).toBe("[K64-T]");
    expect(prefillCode("home", "F")).toBe("[HOME-F]");
  });
  it("appends extra lines and encodes them", () => {
    const href = whatsappHref("k96pro", "B", "en", "Name: A & B");
    expect(href).toContain(encodeURIComponent("Name: A & B"));
    expect(href).not.toContain("A & B");
  });
});

describe("site FAQ", () => {
  it("every page gets entries and every selected id resolves", () => {
    for (const lang of ["pt", "en"] as const) {
      for (const id of [...MODEL_IDS, "home"] as const) {
        const list = faqFor(id, lang);
        expect(list.length, `${id} ${lang}`).toBeGreaterThan(3);
        for (const e of list) expect(e.q && e.a).toBeTruthy();
      }
    }
  });
  it("the Max page states no fixed 30 days and never says sprint", () => {
    for (const lang of ["pt", "en"] as const) {
      const text = faqFor("k144max", lang).map((e) => e.q + " " + e.a).join(" ");
      expect(text).not.toMatch(/\b30[ -](dias|day|working)/i);
      expect(text).not.toMatch(/sprint/i);
    }
  });
  it("entries that mention investors appear only once counsel approves", () => {
    expect(faqFor("k96", "en", false).some((e) => e.id === "c10" || e.id === "c11")).toBe(false);
    expect(faqFor("k96", "en", true).some((e) => e.id === "c10")).toBe(true);
    expect(faqFor("home", "en", true).some((e) => e.id === "c11")).toBe(true);
  });
  it("no page shows investment, return or visa questions", () => {
    for (const id of [...MODEL_IDS, "home"] as const) {
      const text = faqFor(id, "en").map((e) => e.q + " " + e.a).join(" ").toLowerCase();
      expect(text).not.toMatch(/invest|return|visa|rentabilidade/);
    }
  });
  it("the wood 64 does not get the steel-rust question", () => {
    expect(faqFor("k64", "en").some((e) => e.id === "c05")).toBe(false);
    expect(faqFor("k96", "en").some((e) => e.id === "c05")).toBe(true);
  });
});
