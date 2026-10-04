import { rates } from "../../lib/data";
import { useI18n } from "../../lib/i18n";
import "./RatesTable.css";

/** Shared block: the per m² cost table (Santa Catarina, SINAPI-SC reference). Public. No totals, no house prices. */
export function RatesTable() {
  const { t, pick, n } = useI18n();
  const money = (value: number, unit: string) => {
    const [cur, per] = unit.split("/");
    return `${cur} ${n(value)}${per ? `/${per}` : ""}`;
  };
  return (
    <section className="block rates" aria-labelledby="rates-title">
      <h2 id="rates-title">{pick(rates.title)}</h2>
      <div className="rates-scroll">
        <table className="rates-table">
          <thead>
            <tr>
              <th scope="col">{t("col_item")}</th>
              <th scope="col">{t("col_value")}</th>
              <th scope="col">{t("col_reference")}</th>
            </tr>
          </thead>
          <tbody>
            {rates.items.map((r) => (
              <tr key={r.id}>
                <th scope="row">{pick(r.label)}</th>
                <td>
                  {r.value === null ? (r.note ? pick(r.note) : t("confirm_pending")) : money(r.value, r.unit)}
                  {r.verify && <span className="rates-tbc">{t("confirm_pending")}</span>}
                </td>
                <td>{r.reference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="block-note">{pick(rates.basis)}</p>
      <p className="block-note">{pick(rates.market_multiplier_note)}</p>
    </section>
  );
}
