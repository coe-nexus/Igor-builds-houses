"""Generates data/models/*.json for the five Kiver Build pages.
Working days only (Day 1..30). Run: python3 gen_schedules.py  (writes to ./data/models)
Edit the dictionaries, not the JSON, then re-run."""
import json, os

def act(id, track, start, end, crew, pt, en, scene=None, hold=None, offsite=False, risk=None, optional=False):
    a = {"id": id, "track": track, "start": start, "end": end, "crew": crew, "pt": pt, "en": en}
    if scene: a["scene_step"] = scene
    if hold: a["hold_point"] = hold            # {"pt":..,"en":..,"by":"engineer|utility|owner"}
    if offsite: a["offsite"] = True
    if risk: a["risk"] = risk
    if optional: a["optional"] = True
    return a

def hp(pt, en, by="engineer"): return {"pt": pt, "en": en, "by": by}

# ------------------------------------------------------------------ steel line
def steel(id, name, W, L, F, crew_peak, shop_crew, land_note, risk_note, options, D=30):
    # milestones (working days)
    ring = 8
    if D == 30:
        struct_end = 12 + 2 * (F - 1)          # top ring + purlins done
        walls_end = struct_end + 1 + (F - 1)   # tilt-up, one day per floor
        wall_days = 1
        roof_s, roof_e = walls_end + 1, walls_end + 2
        win_s, win_e = walls_end + 2, walls_end + 3 + (1 if F > 1 else 0)
        sid_s, sid_e = win_e + 1, min(29, win_e + 5 + 2 * (F - 1))
        mep_s = struct_end + 2 if F > 1 else walls_end + 2
        mep_e = min(27, mep_s + 4 + 2 * (F - 1))
        test_d = mep_e + 1
        part_s, part_e = walls_end + 3, min(29, walls_end + 5 + (F - 1))
        lin_s, lin_e = mep_e + 1, min(29, mep_e + 3 + (F - 1))
        flr_s = lin_e - 1 if F > 1 else lin_e + 1
        flr_e = min(29, flr_s + 1 + (F - 1))
        kb_s, kb_e = min(27, flr_s + 1), 29 if F > 1 else 27
        paint_s, paint_e = min(28, lin_e + 1), 29 if F > 1 else 28
        fix_s, fix_e = 28, 29
        opt_s = flr_s
        comm_d, hand_d = 29, 30
    else:  # 45 working days: the four-floor Max at a steady crew of 16
        struct_end = 18                        # ring 8, then two days per floor, top ring 17, purlins 18
        wall_days = 2                          # two tilt-up days per floor: 19-20, 21-22, 23-24, 25-26
        walls_end = struct_end + wall_days * F # 26
        roof_s, roof_e = 27, 28
        win_s, win_e = 28, 31
        sid_s, sid_e = 32, 40
        mep_s, mep_e = 20, 33
        test_d = 34
        part_s, part_e = 27, 34
        lin_s, lin_e = 35, 40
        flr_s, flr_e = 40, 43
        kb_s, kb_e = 38, 43
        paint_s, paint_e = 41, 44
        fix_s, fix_e = 43, 44
        opt_s = 40
        comm_d, hand_d = 44, 45
    sc = 1
    A = []
    # Prefab (off-site) runs in parallel from Day 1
    A.append(act("steel_fab", "prefab", 1, min(ring - 1 + 2 * (F - 1), walls_end), shop_crew, 
        f"Fabricação do aço na oficina: baldrame W, pilares, vigas de topo, terças. Entregas em lotes, primeiro lote no dia {ring}.",
        f"Steel fabrication at the shop: W baldrame ring, columns, top rings, purlins. Delivered in batches, first batch on day {ring}.", offsite=True))
    A.append(act("panels_fab", "prefab", 2, walls_end - 1, shop_crew,
        "Painéis de parede pré-fabricados (montante metálico @400, copaíba 6 mm, manta, vãos de janela). Prontos um dia antes do içamento de cada pavimento.",
        "Wall panels prefabricated (metal stud @400, 6 mm copaíba, wrap, window bucks). Ready one day before each floor's tilt-up.", offsite=True))
    # Foundation
    A.append(act("stakeout", "foundation", 1, 1, 2, "Locação da obra, gabarito, níveis. Câmeras ligadas.", "Stakeout, batter boards, levels. Cameras live.", scene="site"))
    A.append(act("excav", "foundation", 1, 2, 3, "Escavação dos pontos de fundação (um por pilar).", "Excavation of foundation points (one per column).", scene="site"))
    A.append(act("rebar", "foundation", 2, 3, 3, "Formas e armação dos blocos; chumbadores posicionados no gabarito de aço.", "Forms and rebar for the footings; anchor bolts set on the steel template.",
        hold=hp("Ponto de parada: vistoria da armação antes da concretagem.", "Hold point: rebar inspection before the pour.")))
    A.append(act("pour", "foundation", 3, 3, 4, "Concretagem dos blocos.", "Footing pour.", scene="found_points"))
    A.append(act("cure", "foundation", 4, ring - 1, 0, "Cura do concreto. Nenhuma carga sobre os blocos.", "Concrete cure. No load on the footings."))
    A.append(act("gravel", "foundation", 4, 5, 2, "Brita de regularização sob a casa, drenagem perimetral.", "Gravel pad under the house, perimeter drainage.", scene="gravel"))
    A.append(act("mep_under", "mep", 4, 6, 2, "Redes enterradas: esgoto até a fossa/rede, água, eletroduto de entrada, aterramento.", "Underground runs: sewer to septic/main, water, electrical entry conduit, grounding."))
    # Structure
    A.append(act("ring", "structure", ring, ring, 5, "Assentamento e nivelamento do anel de vigas W sobre os blocos; solda nos chumbadores.", "W beam ring set and levelled on the footings; welded to anchors.", scene="ring"))
    A.append(act("joists_f1", "structure", ring + 1, ring + 1, 4, "Barrotes metálicos do piso térreo @60 cm.", "Ground floor steel joists @60 cm.", scene="joists_f1"))
    A.append(act("cols_f1", "structure", ring + 2, ring + 2, 4, "Pilares do térreo soldados ao anel (malha de 4 m).", "Ground floor columns welded to the ring (4 m grid).", scene="columns_f1"))
    d = ring + 3
    for k in range(2, F + 1):
        A.append(act(f"beams_f{k}", "structure", d, d, 6, f"Vigas do {k}º pavimento.", f"Floor {k} beams.", scene=f"ring_f{k}"))
        A.append(act(f"joists_f{k}", "structure", d + 1, d + 1, 6, f"Barrotes e deck de compensado do {k}º pavimento.", f"Floor {k} joists and plywood deck.", scene=f"deck_f{k}"))
        if k < F:
            A.append(act(f"cols_f{k}", "structure", d + 1, d + 1, 4, f"Pilares do {k}º pavimento.", f"Floor {k} columns.", scene=f"columns_f{k}"))
        d += 2
    A.append(act("topring", "structure", struct_end - 1, struct_end - 1, 5, "Vigas de topo fecham o cubo.", "Top ring beams close the cube.", scene="top_ring"))
    A.append(act("purlins", "structure", struct_end, struct_end, 5, "Terças da cobertura.", "Roof purlins.", scene="purlins",
        hold=hp("Ponto de parada: vistoria estrutural (soldas, prumo, nível) com a responsável técnica.", "Hold point: structural inspection (welds, plumb, level) with the engineer of record.")))
    # Envelope
    A.append(act("deck_f1", "structure", ring + 1, ring + 2, 3, "Deck de compensado naval 18 mm no térreo, antes dos pilares (sequência Lote 40).", "18 mm naval plywood deck, ground floor, before the columns (Lote 40 sequence).", scene="deck_f1"))
    for k in range(1, F + 1):
        d1 = struct_end + wall_days * (k - 1) + 1
        d2 = d1 + wall_days - 1
        wcrew = crew_peak if F == 1 else (crew_peak - 2 if D == 45 else crew_peak - 4)
        A.append(act(f"walls_f{k}", "envelope", d1, d2, wcrew, f"Içamento: painéis do {k}º pavimento posicionados, aprumados e fixados aos pilares.", f"Tilt-up: floor {k} panels set, plumbed and fixed to the columns.", scene=f"walls_f{k}"))
    A.append(act("roof", "envelope", roof_s, roof_e, 3, "Telha sanduíche EPS 30 mm sobre as terças; face inferior pré-pintada é o forro.", "EPS 30 mm sandwich roof on the purlins; pre-painted underside is the ceiling.", scene="roof_panels"))
    A.append(act("gutters", "envelope", roof_e, roof_e, 1, "Calhas, rufos, fitas da manta.", "Gutters, flashings, wrap taping.", scene="wrap"))
    A.append(act("windows", "envelope", win_s, win_e, 2, "Esquadrias de alumínio e portas externas.", "Aluminium windows and external doors.", scene="windows",
        hold=hp("Ponto de parada: casa estanque (teste de água nas esquadrias e cobertura).", "Hold point: weathertight (water test on windows and roof).")))
    A.append(act("siding", "envelope", sid_s, sid_e, 2 * sc, "Ripas da câmara ventilada e siding cimentício.", "Ventilated-cavity battens and fibre cement siding.", scene="siding"))
    # MEP
    A.append(act("mep_rough", "mep", mep_s, mep_e, 2 * sc, "Infra elétrica e hidráulica dentro dos painéis e barrotes; caixa de medição, quadro.", "Electrical and hydraulic rough-in inside panels and joists; meter box, panel board."))
    A.append(act("tank", "mep", mep_e, mep_e, 1, "Caixa d'água e suporte; aquecimento de água.", "Water tank and stand; water heating."))
    A.append(act("mep_test", "mep", test_d, test_d, 2, "Teste de pressão hidráulica, continuidade e isolamento elétrico.", "Hydraulic pressure test, electrical continuity and insulation test.",
        hold=hp("Ponto de parada: laudo de testes MEP antes de fechar as paredes.", "Hold point: MEP test report before walls are closed.")))
    # Partitions & linings
    A.append(act("partitions", "envelope", part_s, part_e, 2 * sc, "Estrutura das divisórias internas.", "Interior partition framing.", scene="partitions"))
    A.append(act("insulation", "envelope", mep_e - 1, mep_e, 1, "Lã de PET nas paredes externas.", "PET wool insulation in external walls."))
    A.append(act("lining", "finishes", lin_s, lin_e, 3 * sc, "Forro interno de compensado 6 mm nas externas e divisórias.", "6 mm plywood interior lining on external walls and partitions.", scene="interior_lining"))
    if F > 1:
        A.append(act("stair", "structure", walls_end + (1 if D == 45 else 0), walls_end + (1 if D == 45 else 0), 2, "Escada metálica instalada.", "Metal stair installed.", scene="stair"))
    # Finishes
    A.append(act("floor", "finishes", flr_s, flr_e, 2 * sc, "Piso vinílico SPC.", "SPC vinyl floor.", scene="floor_finish"))
    A.append(act("doors_int", "finishes", min(hand_d - 1, flr_e + 1), min(hand_d - 1, flr_e + 1), 1, "Portas internas.", "Internal doors."))
    A.append(act("kitchen_bath", "finishes", kb_s, kb_e, 2 * sc, "Cozinha e banheiros: bancadas, louças, metais.", "Kitchen and bathrooms: counters, sanitary ware, taps."))
    A.append(act("paint", "finishes", paint_s, paint_e, 2 * sc, "Pintura, vernizes, selantes.", "Painting, varnish, sealants."))
    A.append(act("fixtures", "finishes", fix_s, fix_e, 2, "Tomadas, interruptores, luminárias, acabamentos.", "Sockets, switches, luminaires, trim."))
    d0 = opt_s
    for o in options:
        dur, crew = o.get("days", 2), o.get("crew", 0)
        a = act(f"opt_{o['id']}", "options", d0, min(hand_d - 1, d0 + dur - 1), crew, o["pt"], o["en"], scene=o.get("scene"), optional=True)
        if crew == 0: a["subcontracted"] = True
        A.append(a)
        if crew > 0: d0 = min(hand_d - 2, d0 + dur)   # own-crew options run in sequence; subcontracted ones overlap
    # Commissioning
    A.append(act("commission", "inspection", comm_d, comm_d, 2, "Comissionamento: vistoria final, lista de pendências, fotos as-built, arquivo das câmeras.", "Commissioning: final inspection, punch list, as-built photos, camera archive.",
        hold=hp("Ponto de parada: aceite da responsável técnica; pedido de habite-se protocolado.", "Hold point: engineer sign-off; habite-se request filed.")))
    A.append(act("handover", "inspection", hand_d, hand_d, 2, "Limpeza fina, entrega das chaves, manual da casa, ligações definitivas.", "Final clean, key handover, house manual, permanent utility connections.", hold=hp("Entrega.", "Handover.", by="owner")))
    for a in A:
        assert 1 <= a["start"] <= a["end"] <= D, (id, a["id"], a["start"], a["end"])
    model = {
        "id": id, "name": {"pt": name, "en": name},
        "footprint": {"w": W, "l": L, "floors": F, "ceiling_m": 3.0, "bay_m": 4},
        "area_m2": W * L * F, "system": "steel",
        "system_label": {"pt": "Chassi de aço + painéis leves", "en": "Steel chassis + light frame infill"},
        "working_days": D, "crew_peak": crew_peak, "shop_crew": shop_crew,
        "milestones": {"ring": ring, "structure_done": struct_end, "weathertight": win_e, "mep_tested": test_d, "handover": hand_d},
        "risk_note": {"pt": risk_note[0], "en": risk_note[1]},
        "land_note": {"pt": land_note[0], "en": land_note[1]},
        "tracks": TRACKS,
        "scene": {"builder": "steelChassis", "steps": scene_steps_steel(F, options)},
        "activities": A,
    }
    return model

TRACKS = [
    {"id": "prefab", "pt": "Pré-fabricação (fora da obra)", "en": "Prefab (off-site)"},
    {"id": "foundation", "pt": "Fundação", "en": "Foundation"},
    {"id": "structure", "pt": "Estrutura", "en": "Structure"},
    {"id": "envelope", "pt": "Envelope", "en": "Envelope"},
    {"id": "mep", "pt": "Elétrica / hidráulica", "en": "MEP"},
    {"id": "finishes", "pt": "Acabamentos", "en": "Finishes"},
    {"id": "options", "pt": "Opcionais", "en": "Options"},
    {"id": "inspection", "pt": "Vistorias e entrega", "en": "Inspections & handover"},
]

def scene_steps_steel(F, options):
    s = [("site", "Terreno locado", "Site staked"), ("found_points", "Blocos de fundação", "Footings"), ("gravel", "Brita", "Gravel pad"),
         ("ring", "Anel de vigas W", "W beam ring"), ("joists_f1", "Barrotes térreo", "Ground joists"), ("deck_f1", "Deck térreo", "Ground deck"),
         ("columns_f1", "Pilares térreo", "Ground columns")]
    for k in range(2, F + 1):
        s += [(f"ring_f{k}", f"Vigas {k}º piso", f"Floor {k} beams"), (f"deck_f{k}", f"Deck {k}º piso", f"Floor {k} deck")]
        if k < F: s += [(f"columns_f{k}", f"Pilares {k}º piso", f"Floor {k} columns")]
    s += [("top_ring", "Vigas de topo", "Top ring"), ("purlins", "Terças", "Purlins")]
    for k in range(1, F + 1): s += [(f"walls_f{k}", f"Painéis {k}º piso", f"Floor {k} panels")]
    s += [("roof_panels", "Cobertura", "Roof"), ("wrap", "Manta e rufos", "Wrap & flashings"), ("windows", "Esquadrias", "Windows"),
          ("siding", "Siding", "Siding"), ("partitions", "Divisórias", "Partitions")]
    if F > 1: s += [("stair", "Escada", "Stair")]
    s += [("interior_lining", "Forro interno", "Interior lining"), ("floor_finish", "Piso SPC", "SPC floor")]
    for o in options:
        if o.get("scene"): s += [(o["scene"], o["pt_short"], o["en_short"])]
    return [{"id": a, "pt": b, "en": c} for a, b, c in s]

OPT_TERRACE = {"id": "terrace", "days": 3, "crew": 2, "scene": "terrace", "pt_short": "Terraço", "en_short": "Terrace", "pt": "Opcional: terraço coberto de 17 m² na malha de aço.", "en": "Option: 17 m² covered terrace on the steel grid."}
OPT_CARPORT = {"id": "carport", "days": 2, "crew": 2, "scene": "carport", "pt_short": "Garagem", "en_short": "Carport", "pt": "Opcional: garagem/pergolado para 2 carros.", "en": "Option: 2-car carport / pergola."}
OPT_SOLAR = {"id": "solar", "days": 2, "crew": 0, "scene": "solar", "pt_short": "Solar", "en_short": "Solar", "pt": "Opcional: kit solar 5 kWp na cobertura (instalador terceirizado).", "en": "Option: 5 kWp solar kit on the roof (subcontracted installer)."}
OPT_POOL = {"id": "pool", "days": 6, "crew": 0, "scene": "pool", "pt_short": "Piscina", "en_short": "Pool", "pt": "Opcional: piscina de fibra 6 x 3 m com deck (empreiteiro terceirizado).", "en": "Option: fibreglass pool 6 x 3 m with deck (subcontractor)."}

# ------------------------------------------------------------------ wood frame 64
def wood64():
    A = []
    A.append(act("fac_setup", "prefab", 1, 1, 2, "Fábrica: gabaritos e mesas preparados para este lote de painéis.", "Factory: jigs and tables set for this panel batch.", scene="fac_floor", offsite=True))
    A.append(act("panels_fab", "prefab", 1, 7, 6, "Fábrica: painéis de parede em pinus autoclavado @400, OSB 11 mm estrutural, manta, esquadrias já instaladas, eletrodutos passados.", "Factory: wall panels in treated pine @400, 11 mm structural OSB, wrap, windows installed, conduits pre-run.", scene="fac_panels", offsite=True))
    A.append(act("trusses_fab", "prefab", 5, 8, 3, "Fábrica: tesouras de pinus.", "Factory: pine roof trusses.", scene="fac_trusses", offsite=True))
    A.append(act("pack", "prefab", 9, 10, 2, "Embalagem, carregamento, transporte ao lote (largura máxima 2,60 m).", "Packing, loading, transport to the lot (2.60 m max width).", scene="fac_truck", offsite=True))
    A.append(act("stakeout", "foundation", 1, 1, 2, "Locação, gabarito, níveis. Câmeras ligadas.", "Stakeout, batter boards, levels. Cameras live.", scene="site"))
    A.append(act("earth", "foundation", 2, 3, 3, "Terraplenagem, base compactada, formas do radier.", "Earthworks, compacted base, radier forms.", scene="radier_forms"))
    A.append(act("mep_under", "mep", 3, 4, 2, "Esgoto, água e eletrodutos sob o radier.", "Sewer, water and conduits under the slab.",
        hold=hp("Ponto de parada: vistoria das redes e da malha antes da concretagem.", "Hold point: under-slab runs and mesh inspected before the pour.")))
    A.append(act("pour", "foundation", 5, 5, 4, "Concretagem do radier (10 cm, malha).", "Radier pour (10 cm, mesh).", scene="radier"))
    A.append(act("cure", "foundation", 6, 11, 0, "Cura. Fábrica segue em paralelo.", "Cure. Factory keeps working in parallel."))
    A.append(act("assembly", "structure", 12, 12, 8, "DIA DE MONTAGEM: painéis ancorados ao radier, tesouras, contraventamento, telhado fechado até o fim do dia.", "ASSEMBLY DAY: panels anchored to the slab, trusses, bracing, roof closed by end of day.", scene="panels",
        hold=hp("Ponto de parada: ancoragens e prumo conferidos pela responsável técnica.", "Hold point: anchors and plumb checked by the engineer of record.")))
    A.append(act("roof", "envelope", 13, 14, 3, "Telhas de fibrocimento, cumeeira, calhas.", "Fibre cement roof tiles, ridge, gutters.", scene="roof_tiles",
        hold=hp("Ponto de parada: casa estanque.", "Hold point: weathertight.")))
    A.append(act("cladding", "envelope", 14, 18, 3, "Ripas da câmara ventilada, placa cimentícia, textura (aparência de alvenaria).", "Battens, cement board, textured render look.", scene="cladding"))
    A.append(act("mep_rough", "mep", 13, 16, 2, "Ligações elétricas e hidráulicas nos painéis; quadro; caixa d'água.", "Electrical and hydraulic connections in the panels; panel board; water tank."))
    A.append(act("partitions", "envelope", 15, 16, 2, "Divisórias internas.", "Interior partitions.", scene="partitions"))
    A.append(act("mep_test", "mep", 17, 17, 2, "Testes de pressão e elétricos.", "Pressure and electrical tests.", hold=hp("Ponto de parada: laudo MEP antes do gesso.", "Hold point: MEP report before drywall.")))
    A.append(act("insulation", "envelope", 17, 17, 2, "Lã de PET nas externas.", "PET wool in external walls."))
    A.append(act("drywall", "finishes", 18, 20, 3, "Gesso acartonado, tratamento de juntas.", "Drywall, joint treatment.", scene="interior_lining"))
    A.append(act("ceiling", "finishes", 21, 21, 2, "Forro de PVC.", "PVC ceiling."))
    A.append(act("floor", "finishes", 21, 23, 3, "Piso cerâmico e rodapé.", "Ceramic floor and skirting.", scene="floor_finish"))
    A.append(act("paint", "finishes", 23, 26, 2, "Pintura interna e externa.", "Interior and exterior painting."))
    A.append(act("kitchen_bath", "finishes", 24, 26, 2, "Cozinha e banheiro: pia, bancada, louças, metais.", "Kitchen and bathroom: sink, counter, sanitary ware, taps."))
    A.append(act("doors_int", "finishes", 25, 25, 1, "Portas internas.", "Internal doors."))
    A.append(act("fixtures", "finishes", 27, 27, 2, "Tomadas, interruptores, luminárias.", "Sockets, switches, luminaires."))
    A.append(act("commission", "inspection", 28, 28, 2, "Vistoria final, pendências, fotos as-built, arquivo das câmeras.", "Final inspection, punch list, as-built photos, camera archive.", hold=hp("Aceite da responsável técnica; habite-se protocolado.", "Engineer sign-off; habite-se filed.")))
    A.append(act("buffer", "inspection", 29, 29, 0, "Folga de programação (chuva, logística).", "Schedule buffer (rain, logistics)."))
    A.append(act("handover", "inspection", 30, 30, 2, "Limpeza, chaves, manual, ligações definitivas.", "Clean, keys, manual, permanent connections.", hold=hp("Entrega.", "Handover.", by="owner")))
    for a in A: assert 1 <= a["start"] <= a["end"] <= 30
    return {
        "id": "k64", "name": {"pt": "Kiver 64", "en": "Kiver 64"},
        "footprint": {"w": 8, "l": 8, "floors": 1, "ceiling_m": 3.0, "bay_m": 4},
        "area_m2": 64, "system": "wood",
        "system_label": {"pt": "Wood frame de fábrica sobre radier", "en": "Factory wood frame on a radier slab"},
        "working_days": 30, "crew_peak": 8, "shop_crew": 6,
        "milestones": {"pour": 5, "assembly": 12, "weathertight": 14, "mep_tested": 17, "handover": 30},
        "risk_note": {"pt": "A casa é montada no dia 12 e fica estanque no dia 14. Os 30 dias incluem a fábrica em paralelo com a cura do radier.", "en": "The house is assembled on day 12 and weathertight on day 14. The 30 days include factory time running in parallel with the slab cure."},
        "land_note": {"pt": "Lote em loteamento com rede de esgoto dispensa a fossa.", "en": "A lot with sewer service drops the septic system."},
        "tracks": TRACKS,
        "scene": {"builder": "woodFrame", "steps": [
            {"id": "site", "pt": "Terreno locado", "en": "Site staked"}, {"id": "radier_forms", "pt": "Formas do radier", "en": "Radier forms"},
            {"id": "radier", "pt": "Radier", "en": "Radier slab"}, {"id": "panels", "pt": "Painéis e tesouras", "en": "Panels & trusses"},
            {"id": "roof_tiles", "pt": "Telhado", "en": "Roof"}, {"id": "cladding", "pt": "Revestimento", "en": "Cladding"},
            {"id": "partitions", "pt": "Divisórias", "en": "Partitions"}, {"id": "interior_lining", "pt": "Gesso", "en": "Drywall"},
            {"id": "floor_finish", "pt": "Piso", "en": "Floor"}]},
        "scene_factory": {"builder": "woodFrameFactory", "steps": [
            {"id": "fac_floor", "pt": "Galpão e mesas", "en": "Shop floor and tables"},
            {"id": "fac_panels", "pt": "Painéis prontos (acumulam por dia)", "en": "Finished panels (stack grows by day)"},
            {"id": "fac_trusses", "pt": "Tesouras", "en": "Trusses"},
            {"id": "fac_truck", "pt": "Carreta carregada", "en": "Truck loaded"}]},
        "activities": A,
    }

models = [
    wood64(),
    steel("k96", "Kiver 96", 8, 12, 1, 8, 4,
          ("Referência: Lote 40.", "Reference build: Lote 40."),
          ("Equipe de 8 em obra, 4 na fábrica. Dia de içamento no dia 13; estanque no dia 16.", "Crew of 8 on site, 4 in the shop. Tilt-up on day 13; weathertight on day 16."),
          [OPT_TERRACE, OPT_CARPORT, OPT_SOLAR]),
    steel("k96pro", "Kiver 96 Pro", 8, 12, 2, 12, 5,
          ("Referência: Lote 39.", "Reference build: Lote 39."),
          ("Dois pavimentos em 30 dias exigem equipe de 12 e guindaste leve nos dias 15 e 16.", "Two floors in 30 days need a crew of 12 and a light crane on days 15 and 16."),
          [OPT_TERRACE, OPT_CARPORT, OPT_SOLAR, OPT_POOL]),
    steel("k144pro", "Kiver 144 Pro", 12, 12, 2, 14, 6,
          ("Lote mínimo 15 x 20 m.", "Minimum lot 15 x 20 m."),
          ("288 m² em 30 dias: equipe de 14 no pico, no dia 16, com o içamento do 2º pavimento.", "288 m² in 30 days: crew of 14 at the peak, on day 16, with the floor 2 tilt-up."),
          [OPT_TERRACE, OPT_CARPORT, OPT_SOLAR, OPT_POOL]),
    steel("k144max", "Kiver 144 Max", 12, 12, 4, 16, 8,
          ("Lote zoneado para 4 pavimentos; PPCI e acessibilidade no licenciamento.", "Lot zoned for four floors; fire (PPCI) and accessibility in permitting."),
          ("576 m² em 45 dias úteis com equipe de 16: dois dias de içamento por pavimento, guindaste nos dias 19 a 26, estanque no dia 31, entrega no dia 45.", "576 m² in 45 working days with a crew of 16: two tilt-up days per floor, crane on days 19 to 26, weathertight on day 31, handover on day 45."),
          [OPT_TERRACE, OPT_CARPORT, OPT_SOLAR, OPT_POOL], D=45),
]
os.makedirs(os.path.join(os.path.dirname(__file__), "..", "data", "models"), exist_ok=True)
for m in models:
    # crew load check (site crew only, excluding offsite)
    D = m["working_days"]
    load = [0] * (D + 1)
    for a in m["activities"]:
        if a.get("offsite"): continue
        for d in range(a["start"], a["end"] + 1): load[d] += a["crew"]
    m["crew_by_day"] = load[1:]
    m["days_over_peak"] = [d for d in range(1, D + 1) if load[d] > m["crew_peak"]]
    m["crew_peak_observed"] = max(load)
    with open(os.path.join(os.path.dirname(__file__), "..", "data", "models", f"{m['id']}.json"), "w", encoding="utf-8") as f:
        json.dump(m, f, ensure_ascii=False, indent=2)
    print(m["id"], "activities", len(m["activities"]), "peak crew observed", max(load), "planned", m["crew_peak"],
          "over", m["days_over_peak"], "milestones", m["milestones"])
