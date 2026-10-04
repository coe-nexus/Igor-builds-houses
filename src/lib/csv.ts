import type { Lang, Model } from "./types";

const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

/** The schedule as CSV: one row per activity. UTF-8 with a BOM so Excel opens accents correctly. */
export function scheduleCsv(model: Model, lang: Lang): string {
  const track = (id: string) => model.tracks.find((t) => t.id === id)?.[lang] ?? id;
  const head = lang === "pt"
    ? ["inicio_dia", "fim_dia", "frente", "atividade", "equipe", "fora_da_obra", "opcional", "terceirizado", "ponto_de_parada", "quem_assina"]
    : ["start_day", "end_day", "track", "activity", "crew", "off_site", "optional", "subcontracted", "hold_point", "signed_by"];
  const yes = lang === "pt" ? "sim" : "yes";
  const rows = [...model.activities]
    .sort((a, b) => a.start - b.start || a.end - b.end)
    .map((a) => [
      a.start, a.end, track(a.track), a[lang], a.crew,
      a.offsite ? yes : "", a.optional ? yes : "", a.subcontracted ? yes : "",
      a.hold_point ? a.hold_point[lang] : "", a.hold_point ? a.hold_point.by : "",
    ]);
  return "﻿" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

export function downloadCsv(model: Model, lang: Lang): void {
  const blob = new Blob([scheduleCsv(model, lang)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${model.id}-schedule-${lang}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
