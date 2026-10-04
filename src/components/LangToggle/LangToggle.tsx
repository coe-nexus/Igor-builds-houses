import { useI18n } from "../../lib/i18n";
import { useDayStore } from "../../lib/dayStore";
import "./LangToggle.css";

export function LangToggle() {
  const { lang, t } = useI18n();
  const setLang = useDayStore((s) => s.setLang);
  const next = lang === "pt" ? "en" : "pt";
  return (
    <button type="button" className="lang-toggle" lang={next} onClick={() => setLang(next)}>
      {t("lang")}
    </button>
  );
}
