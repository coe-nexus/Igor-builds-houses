import json
def w(p, o): json.dump(o, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
WA = "https://wa.me/5511999982418"
cta = {
  "whatsapp_number_e164": "5511999982418",
  "whatsapp_number_display": "+55 11 99998-2418",
  "session_name": {"pt": "Sessão de alinhamento de 15 minutos", "en": "15-minute alignment session"},
  "rules": {"primary_max_visible": 1, "secondary_max_visible": 1,
            "placements": ["hero", "after_build", "sticky_mobile_after_30pct_scroll", "footer"],
            "prefill_code": "[{MODEL}-{PLACEMENT}]  H hero, B after build, S sticky, F footer, T tertiary"},
  "primary": {"label": {"pt": "Começar pelo WhatsApp", "en": "Start on WhatsApp"},
              "sub": {"pt": "Um assistente responde na hora e agenda sua sessão de 15 minutos.", "en": "An assistant replies right away and books your 15-minute session."},
              "href_template": WA + "?text={prefill}",
              "prefill": {"pt": "Olá, Kiver Build. Vim da página do {model_name} {code}. Quero entender se faz sentido para mim.",
                          "en": "Hi Kiver Build. I came from the {model_name} page {code}. I want to see if it makes sense for me."}},
  "secondary": {"label": {"pt": "Baixar o cronograma de 30 dias (PDF)", "en": "Download the 30-day schedule (PDF)"},
                "gate": {"fields": ["name", "email", "whatsapp_optional"],
                         "consent": {"pt": "Aceito receber o cronograma e até três mensagens sobre o Kiver Build. Posso sair quando quiser.", "en": "I agree to receive the schedule and up to three messages about Kiver Build. I can opt out any time."}},
                "placement": "after_build"},
  "tertiary_by_model": {
    "k64": {"label": {"pt": "Ver se me encaixo no Minha Casa Minha Vida", "en": "Check my Minha Casa Minha Vida fit"}, "bot_entry": "mcmv_fit", "placement": "hero_secondary_line"},
    "k96": {"label": {"pt": "Quero essa casa no meu lote", "en": "I want this house on my lot"}, "bot_entry": "build_on_lot", "placement": "after_options"},
    "k96pro": {"label": {"pt": "Visitar o Lote 39 em obra", "en": "Visit Lote 39 under construction"}, "bot_entry": "site_visit", "placement": "after_options"},
    "k144pro": {"label": {"pt": "Montar a minha configuração", "en": "Configure mine"}, "bot_entry": "configure", "placement": "after_options"},
    "k144max": {"label": {"pt": "Verificar se o meu terreno permite 4 pavimentos", "en": "Check if my lot allows four floors"}, "bot_entry": "zoning_check", "placement": "after_max_exits"}},
  "sticky_mobile": {"label": {"pt": "Falar agora", "en": "Talk now"}, "show_after_scroll_pct": 30},
  "never": ["Show a house price", "Promise a return", "Two primaries on one screen", "A CTA inside the 3D canvas"]
}
w("data/shared/cta.json", cta)


print("cta.json written. bot/flow.json and bot/faq/*.json are hand-maintained sources; edit them directly.")
