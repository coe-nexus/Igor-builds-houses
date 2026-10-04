import { useMemo, useState } from "react";
import type { Activity, Model, TrackId } from "../../lib/types";
import { useCalendarPlan } from "../../lib/calendar";
import { useDayStore } from "../../lib/dayStore";
import { fill, useI18n } from "../../lib/i18n";
import { shortLabel } from "../../lib/schedule";
import "./Gantt.css";

const COL = 22; // px per working day
const GAP = 7; // px for a run of weekend or holiday days (calendar mode)
const LANE = 26; // px per bar lane

/** Greedy lane packing so overlapping activities of one track sit on separate lines. */
function packLanes(list: Activity[]): { a: Activity; lane: number }[] {
  const ends: number[] = [];
  return [...list]
    .sort((x, y) => x.start - y.start || x.end - y.end)
    .map((a) => {
      let lane = ends.findIndex((e) => e < a.start);
      if (lane === -1) lane = ends.length;
      ends[lane] = a.end;
      return { a, lane };
    });
}

export function Gantt({ model }: { model: Model }) {
  const { t, pick, tx, n, date } = useI18n();
  const day = useDayStore((s) => s.day);
  const setDay = useDayStore((s) => s.setDay);
  const enabled = useDayStore((s) => s.enabledTracks);
  const selected = useDayStore((s) => s.selectedActivity);
  const plan = useCalendarPlan();
  const [tableView, setTableView] = useState(false);
  const wd = model.working_days;

  const { xs, total } = useMemo(() => {
    const xs: number[] = [];
    let x = 0;
    for (let d = 1; d <= wd; d++) {
      xs[d] = x;
      x += COL + (plan && plan.gapsAfter[d - 1] > 0 ? GAP : 0);
    }
    return { xs, total: x };
  }, [wd, plan]);

  const rows = useMemo(
    () =>
      model.tracks
        .filter((tr) => enabled[tr.id])
        .map((tr) => {
          const packed = packLanes(model.activities.filter((a) => a.track === tr.id));
          return { tr, packed, lanes: Math.max(1, ...packed.map((p) => p.lane + 1)) };
        }),
    [model, enabled],
  );

  const trackName = (id: TrackId) => pick(model.tracks.find((x) => x.id === id) ?? { pt: id, en: id });
  const flags = (a: Activity) =>
    [a.offsite && t("offsite"), a.subcontracted && t("subcontracted"), a.optional && t("optional"), a.hold_point && t("hold_point")]
      .filter(Boolean)
      .join(", ");

  return (
    <div className="gantt">
      <div className="gantt-bar">
        <button type="button" className="gantt-switch" onClick={() => setTableView((v) => !v)} aria-pressed={tableView}>
          {tableView ? t("gantt_view_chart") : t("gantt_view_table")}
        </button>
        <ul className="legend" aria-label={t("legend")}>
          <li><i className="lg lg-fill" />{t("legend_onsite")}</li>
          <li><i className="lg lg-off" />{t("offsite")}</li>
          <li><i className="lg lg-opt" />{t("optional")}</li>
          <li><i className="lg lg-sub" />{t("subcontracted")}</li>
          <li><span className="lg-diamond" aria-hidden="true">◆</span>{t("hold_point")}</li>
          {plan && <li><i className="lg lg-gap" />{t("legend_gap")}</li>}
        </ul>
      </div>

      {tableView ? (
        <div className="gantt-table-wrap">
          <table className="gantt-table">
            <thead>
              <tr>
                <th scope="col">{t("col_activity")}</th>
                <th scope="col">{t("col_track")}</th>
                <th scope="col">{t("col_start")}</th>
                <th scope="col">{t("col_end")}</th>
                <th scope="col">{t("col_crew")}</th>
                <th scope="col">{t("col_flags")}</th>
              </tr>
            </thead>
            <tbody>
              {[...model.activities]
                .filter((a) => enabled[a.track])
                .sort((a, b) => a.start - b.start || a.end - b.end)
                .map((a) => (
                  <tr key={a.id} className={a.id === selected ? "is-selected" : undefined}>
                    <th scope="row">{pick({ pt: a.pt, en: a.en })}</th>
                    <td>{trackName(a.track)}</td>
                    <td>{plan ? `${n(a.start)} (${date(plan.dates[a.start - 1])})` : n(a.start)}</td>
                    <td>{plan ? `${n(a.end)} (${date(plan.dates[a.end - 1])})` : n(a.end)}</td>
                    <td>{n(a.crew)}</td>
                    <td>{flags(a)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="gantt-scroll" role="group" aria-label={t("gantt_aria")}>
          <div className="gantt-grid" style={{ width: `calc(var(--g-label) + ${total}px)` }}>
            <div className="g-row g-head">
              <div className="g-label g-corner" />
              <div className="g-line" style={{ height: plan ? 34 : 20 }}>
                {Array.from({ length: wd }, (_, i) => i + 1).map((d) => (
                  <div
                    key={d}
                    className={`g-day${d === day ? " is-now" : ""}${d % 5 === 0 ? " is-five" : ""}`}
                    style={{ left: xs[d], width: COL }}
                    title={plan ? date(plan.dates[d - 1]) : undefined}
                  >
                    <span>{d}</span>
                    {plan && <small>{Number(plan.dates[d - 1].slice(8))}</small>}
                  </div>
                ))}
              </div>
            </div>

            {rows.map(({ tr, packed, lanes }) => (
              <div className="g-row" key={tr.id}>
                <div className="g-label">
                  <span className="g-chip" style={{ background: `var(--track-${tr.id})` }} />
                  <span>{pick(tr)}</span>
                </div>
                <div className="g-line" style={{ height: lanes * LANE + 6 }}>
                  {packed.map(({ a, lane }) => {
                    const left = xs[a.start];
                    const width = xs[a.end] + COL - left;
                    const kind = a.offsite ? "off" : a.subcontracted ? "sub" : a.optional ? "opt" : "fill";
                    const label = shortLabel(pick({ pt: a.pt, en: a.en }));
                    return (
                      <span key={a.id}>
                        <button
                          type="button"
                          className={`g-bar g-${kind}${a.id === selected ? " is-selected" : ""}${a.start > day ? " is-future" : ""}`}
                          style={{ left, width: width - 2, top: 3 + lane * LANE, ["--c" as string]: `var(--track-${a.track})` }}
                          title={`${pick({ pt: a.pt, en: a.en })} (${t("day")} ${a.start}-${a.end})`}
                          aria-label={`${label}, ${t("day")} ${a.start} ${a.end !== a.start ? `- ${a.end}` : ""}, ${n(a.crew)} ${t("crew")}${flags(a) ? `, ${flags(a)}` : ""}`}
                          onClick={() => setDay(a.start, a.id)}
                        >
                          <span className="g-text">{label}</span>
                        </button>
                        {a.hold_point && (
                          <button
                            type="button"
                            className={`g-diamond${a.end > day ? " is-future" : ""}`}
                            style={{ left: left + width - 10, top: 3 + lane * LANE }}
                            title={`${t("hold_point")}: ${pick(a.hold_point)} (${tx(`hold_by_${a.hold_point.by}`)})`}
                            aria-label={fill("{label}: {hp}", { label: t("hold_point"), hp: pick(a.hold_point) })}
                            onClick={() => setDay(a.end, a.id)}
                          >
                            ◆
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="g-overlay" aria-hidden="true">
              {plan &&
                plan.gapsAfter.map((g, i) => g > 0 && <i key={i} className="g-gap" style={{ left: xs[i + 1] + COL, width: GAP }} />)}
              {day >= 1 && <i className="g-cursor" style={{ left: xs[day], width: COL }} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
