/* React è caricato globalmente via <script> (UMD) nella pagina HTML che ospita questo bundle. */
const { useState, useMemo, useEffect } = React;

/* ============================================================================
   DATABASE MATERIALI STAMPO/MODELLO
   ========================================================================== */
const TOOL_MATERIALS = [
  {
    key: "al5083", label: "Alluminio 5083", group: "Metallo",
    cte: 23.8, cteRange: null, cteSrc: "datasheet",
    density: 2660, densitySrc: "datasheet",
    k: 121, kSrc: "datasheet",
    cp: 900, cpSrc: "datasheet",
    note: "Atlas Aluminium Datasheet 5083 (rev. 2013): CTE medio 20-100°C, k a 25°C. Valori coerenti con quelli gia usati in \"simulazione_riscaldamento_stampo_autoclave.xlsx\" nel progetto.",
  },
  {
    key: "al6082", label: "Alluminio 6082-T6", group: "Metallo",
    cte: 23.4, cteRange: null, cteSrc: "datasheet",
    density: 2700, densitySrc: "datasheet",
    k: 180, kSrc: "datasheet",
    cp: 896, cpSrc: "datasheet",
    note: "EN AW-6082 T651 TDS (Gleich/Impol): k dichiarato 170-220 W/m*K, usato valore medio 180.",
  },
  {
    key: "wb0691", label: "RAMPF WB-0691 (board epossidica)", group: "Board epossidica",
    cte: 40, cteRange: [35, 45], cteSrc: "datasheet",
    density: 690, densitySrc: "datasheet",
    k: 0.7, kSrc: "stima",
    cp: 1100, cpSrc: "stima",
    note: "RAMPF WB-0691 TDS (rev. 02-2024). Resistenza termica 100-110°C. k e cp non dichiarati dal produttore: k=0.7 W/m·K e cp=1100 J/kg·K sono stime tipiche di letteratura per epossidiche cariche (k 0.5-0.9, cp 1000-1300 W/mK, J/kgK) — verificare.",
  },
  {
    key: "wb0700", label: "RAMPF WB-0700 (board epossidica)", group: "Board epossidica",
    cte: 40, cteRange: [35, 45], cteSrc: "datasheet",
    density: 700, densitySrc: "datasheet",
    k: 0.7, kSrc: "stima",
    cp: 1100, cpSrc: "stima",
    note: "RAMPF WB-0700 TDS (rev. 03-2025). Resistenza termica fino a 140°C. k e cp non dichiarati dal produttore: k=0.7 W/m·K e cp=1100 J/kg·K sono stime tipiche di letteratura per epossidiche cariche — verificare.",
  },
  {
    key: "wb0890", label: "RAMPF WB-0890 (board epossidica)", group: "Board epossidica",
    cte: 40, cteRange: [35, 45], cteSrc: "datasheet",
    density: 890, densitySrc: "datasheet",
    k: 0.7, kSrc: "stima",
    cp: 1100, cpSrc: "stima",
    note: "RAMPF WB-0890 TDS (rev. 01-2019). Resistenza termica 100-110°C. k e cp non dichiarati dal produttore: k=0.7 W/m·K e cp=1100 J/kg·K sono stime tipiche di letteratura per epossidiche cariche — verificare.",
  },
  {
    key: "carbonE215", label: "Carbonio + Microtex E6-215 (q.iso)", group: "Composito",
    cte: 6.35, cteRange: null, cteSrc: "datasheet",
    density: 1500, densitySrc: "stima",
    k: null, kSrc: "nd",
    cp: 1100, cpSrc: "stima",
    note: "CTE da TDS Microtex E6-215 (laminato 1-5-1 q.isotropico, post-cura 8h@55°C+4h@180°C). Densita laminato NON dichiarata da Microtex (nota solo densita resina pura 1.20 g/cm3): valore mostrato e una stima tipica per CFRP q.iso. cp=1100 J/kg·K stima di letteratura (1000-1300); k non stimato per i laminati compositi (piu anisotropo/incerto delle board), lasciato N/D.",
  },
  {
    key: "cyform22", label: "Cytec CYFORM 22 (carbonio)", group: "Composito tooling",
    cte: 2.5, cteRange: null, cteSrc: "datasheet",
    density: 1500, densitySrc: "stima",
    k: null, kSrc: "nd",
    cp: 1100, cpSrc: "stima",
    shrinkage: 0.031,
    note: "CTE e ritiro da TDS CYFORM 22 Rev.0 (laminato tooling q.isotropico CP200). Densita laminato non dichiarata (stima). cp=1100 J/kg·K stima di letteratura; k non stimato per i laminati compositi, lasciato N/D.",
  },
  {
    key: "ltm212", label: "LTM212 (carbonio)", group: "Composito tooling",
    cte: 3.0, cteRange: [2.5, 3.5], cteSrc: "datasheet",
    density: 1500, densitySrc: "stima",
    k: null, kSrc: "nd",
    cp: 1100, cpSrc: "stima",
    shrinkage: 0.06,
    note: "CTE e ritiro da TDS LTM212 Syensqo (laminato tooling 1-8-1 q.isotropico). Densita laminato non dichiarata (nota solo densita resina pura 1.22 g/cm3): stima. cp=1100 J/kg·K stima di letteratura; k non stimato per i laminati compositi, lasciato N/D.",
  },
];

/* ============================================================================
   DATABASE RESINA DEL PRE-IMPREGNATO (parte da curare sullo stampo)
   gelPoints: punti gel-time/temperatura dal datasheet (min).
   tgTable: punti ciclo-di-cura -> Tg raggiunta dal datasheet.
   ========================================================================== */
const PART_RESINS = [
  {
    key: "er450", label: "ER450", cte: null, cteSrc: "nd",
    density: 1230, densitySrc: "datasheet", tg: 210, shrinkage: null,
    cure: { ramp: 3, dwellT: 135, dwellMin: 120, cool: 4, coolFinal: 65 },
    pressureBar: 6, vacuumBar: -0.8,
    gelPoints: [ { t: 80, tGel: 400 }, { t: 100, tGel: 85 }, { t: 120, tGel: 17 }, { t: 135, tGel: 5.5 }, { t: 150, tGel: 4 } ],
    tgTable: [
      { label: "80°C / 16h", t: 80, durationMin: 960, tg: 96 },
      { label: "120°C / 1h", t: 120, durationMin: 60, tg: 135 },
      { label: "135°C / 2h", t: 135, durationMin: 120, tg: 171 },
      { label: "160°C / 1.5h", t: 160, durationMin: 90, tg: 173 },
      { label: "180°C / 2h", t: 180, durationMin: 120, tg: 180 },
    ],
    note: "SAATI TDS ER450: CTE del laminato cotto NON dichiarato (dipende dallo schema di laminazione del cliente). Gel time e tabella cura->Tg dal datasheet (sezione Cure Process Recommendations).",
  },
  {
    key: "dt120", label: "DT120", cte: null, cteSrc: "nd",
    density: 1220, densitySrc: "datasheet", tg: 120, shrinkage: null,
    cure: { ramp: 2, dwellT: 120, dwellMin: 90, cool: 4, coolFinal: 60 },
    pressureBar: 6, vacuumBar: -0.85,
    gelPoints: [ { t: 100, tGel: 31 }, { t: 120, tGel: 10.5 }, { t: 135, tGel: 3.5 } ],
    tgTable: [
      { label: "100°C / 4h", t: 100, durationMin: 240, tg: 110 },
      { label: "120°C / 1.5h", t: 120, durationMin: 90, tg: 117.5 },
      { label: "135°C / 1h", t: 135, durationMin: 60, tg: 120 },
    ],
    note: "ST DT1205 / DT120MatrixTDS: CTE del laminato NON dichiarato. Gel time = punto medio dei range dichiarati (29-33/8-13/2-5 min).",
  },
  {
    key: "e215", label: "Microtex E6-215", cte: 6.35, cteSrc: "datasheet",
    density: 1500, densitySrc: "stima", tg: 190, shrinkage: null,
    cure: { ramp: 2, dwellT: 55, dwellMin: 480, cool: 3, coolFinal: 30 },
    pressureBar: 6, vacuumBar: -0.85,
    gelPoints: [ { t: 100, tGel: 3.33 } ],
    tgTable: [
      { label: "24h @ 45°C", t: 45, durationMin: 1440, tg: 93 },
      { label: "16h @ 50°C", t: 50, durationMin: 960, tg: 97 },
      { label: "8h @ 55°C", t: 55, durationMin: 480, tg: 105 },
      { label: "+2h @ 160°C (post)", t: 160, durationMin: 120, tg: 210 },
      { label: "+4h @ 180°C (post)", t: 180, durationMin: 240, tg: 216 },
    ],
    note: "TDS Microtex E6-215LW/HWLW: unico punto di gel time disponibile (~200s@100°C), fuori dal range di processo 45-60°C. Il punto di gel e stimato con la regola empirica Q10 (tempo dimezza ogni +10°C), non con un fit su dati multipli: confidenza ridotta, vedi avviso in sezione 07. Tabella cura->Tg completa e disponibile.",
  },
  {
    key: "cyform22r", label: "CYFORM 22 (carbonio)", cte: 2.5, cteSrc: "datasheet",
    density: 1500, densitySrc: "stima", tg: 204, shrinkage: 0.031,
    cure: { ramp: 0.75, dwellT: 50, dwellMin: 600, cool: 3, coolFinal: 30 },
    pressureBar: 6.2, vacuumBar: -0.88,
    gelPoints: [ { t: 20, tGel: 6480 }, { t: 40, tGel: 480 } ],
    tgTable: [
      { label: "post-cura completa (A: 60->200°C, 5h)", t: 200, durationMin: 300, tg: 204 },
    ],
    note: "TDS CYFORM 22: gel time noto solo a 20°C e 40°C (Tabelle 1/3), da estrapolare al range di processo 45-55°C: bassa confidenza. Tg nota solo per lo stato completamente post-curato (204°C); Tg dello stato as-cured (dopo la sola cura iniziale) NON dichiarata.",
  },
  {
    key: "ltm212r", label: "LTM212", cte: 3.0, cteSrc: "datasheet",
    density: 1500, densitySrc: "stima", tg: 207, shrinkage: 0.06,
    cure: { ramp: 2, dwellT: 60, dwellMin: 480, cool: 3, coolFinal: 30 },
    pressureBar: 6.2, vacuumBar: -0.98,
    gelPoints: [ { t: 35, tGel: 1440 }, { t: 40, tGel: 900 }, { t: 45, tGel: 600 }, { t: 50, tGel: 396 }, { t: 55, tGel: 270 }, { t: 60, tGel: 186 } ],
    tgTable: [
      { label: "cura a 40°C (dry)", t: 40, durationMin: null, tg: 55 },
      { label: "cura a 50°C (dry)", t: 50, durationMin: null, tg: 65 },
      { label: "cura a 60°C (dry)", t: 60, durationMin: null, tg: 75 },
      { label: "post-cura completa", t: 195, durationMin: 480, tg: 207.5 },
    ],
    note: "TDS LTM212 Syensqo: gel time su 6 punti (35-60°C), tabella cura->Tg su pagina proprieta fisiche (confermata su immagine pagina 3).",
  },
];

const genId = () => Math.random().toString(36).slice(2, 9);

/* ============================================================================
   CICLO A FASI-TEMPO (Time step | Temp | Press | Vacuum, come da allegato Excel)
   Ciclo di default FISSO (non dipende dalla resina selezionata): vuoto applicato
   fin dall'inizio e mantenuto costante per tutto il ciclo.
   ========================================================================== */
function defaultCycle() {
  const vac = -0.85;
  return {
    initial: { temp: 20, press: 0, vacuum: vac },
    phases: [
      { id: genId(), duration: 30, temp: 80, press: 0, vacuum: vac },
      { id: genId(), duration: 30, temp: 80, press: 6, vacuum: vac },
      { id: genId(), duration: 30, temp: 135, press: 6, vacuum: vac },
      { id: genId(), duration: 120, temp: 135, press: 6, vacuum: vac },
      { id: genId(), duration: 30, temp: 40, press: 0, vacuum: vac },
    ],
  };
}
function buildTimeline(initial, phases) {
  let t = 0;
  const rows = [{ t: 0, temp: initial.temp, press: initial.press, vacuum: initial.vacuum }];
  for (const ph of phases) {
    t += Math.max(ph.duration || 0, 0);
    rows.push({ t, temp: ph.temp, press: ph.press, vacuum: ph.vacuum });
  }
  return rows;
}
function interpAt(rows, t, key) {
  if (t <= rows[0].t) return rows[0][key];
  for (let i = 1; i < rows.length; i++) {
    if (t <= rows[i].t + 1e-9) {
      const a = rows[i - 1], b = rows[i];
      const dur = b.t - a.t;
      if (dur <= 1e-9) return b[key];
      const frac = (t - a.t) / dur;
      return a[key] + (b[key] - a[key]) * frac;
    }
  }
  return rows[rows.length - 1][key];
}
function timeAtPeak(rows, peakT, tol = 0.5) {
  let total = 0;
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1], b = rows[i];
    if (Math.abs(a.temp - peakT) <= tol && Math.abs(b.temp - peakT) <= tol) total += (b.t - a.t);
  }
  return total;
}

/* ---------------- Cinetica di gel (fit Arrhenius su punti gel-time/T del datasheet) ---------------- */
function fitArrhenius(points) {
  if (!points || points.length < 2) return null;
  const xs = points.map(p => 1 / (p.t + 273.15));
  const ys = points.map(p => Math.log(p.tGel));
  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0), sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sumXX = xs.reduce((a, x) => a + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-12) return null;
  const B = (n * sumXY - sumX * sumY) / denom;
  const A = (sumY - B * sumX) / n;
  const tMin = Math.min(...points.map(p => p.t)), tMax = Math.max(...points.map(p => p.t));
  return { A, B, tMin, tMax, tGelAt: (T) => Math.exp(A + B / (T + 273.15)) };
}

/* ---------------- Modello di gel: fit Arrhenius (>=2 punti) o regola Q10 empirica (1 punto) ----------------
   Regola Q10: il tempo di gel si dimezza ogni +10°C (raddoppia ogni -10°C) rispetto al punto di riferimento.
   Usata solo come fallback quando il datasheet fornisce un unico punto gel-time/temperatura. */
function buildGelModel(points) {
  if (!points || points.length === 0) return null;
  if (points.length === 1) {
    const p = points[0];
    return {
      method: "q10", tMin: p.t, tMax: p.t, refPoint: p,
      tGelAt: (T) => p.tGel * Math.pow(2, -(T - p.t) / 10),
    };
  }
  const fit = fitArrhenius(points);
  if (!fit) return null;
  return { ...fit, method: "arrhenius" };
}

function estimateTg(tgTable, peakT, dwellMinutes) {
  if (!tgTable || !tgTable.length) return { tg: null, insufficient: true, note: "nessun dato Tg disponibile per questa resina." };
  const sorted = [...tgTable].sort((a, b) => a.t - b.t);
  if (sorted.length === 1 && Math.abs(peakT - sorted[0].t) > 15) {
    return {
      tg: null, insufficient: true,
      note: `dato disponibile solo per "${sorted[0].label}" (${sorted[0].t}°C): non applicabile alla temperatura di mantenimento simulata (${peakT.toFixed(0)}°C).`,
    };
  }
  let lo = null, hi = null;
  for (const e of sorted) { if (e.t <= peakT) lo = e; if (e.t >= peakT && !hi) hi = e; }
  let tg;
  if (lo && hi && lo !== hi) {
    const frac = (peakT - lo.t) / (hi.t - lo.t);
    tg = lo.tg + (hi.tg - lo.tg) * frac;
  } else {
    tg = (lo || hi).tg;
  }
  const nearest = sorted.reduce((best, e) => (Math.abs(e.t - peakT) < Math.abs(best.t - peakT) ? e : best), sorted[0]);
  const durationWarning = nearest.durationMin && dwellMinutes < nearest.durationMin
    ? `durata di mantenimento nel ciclo (${dwellMinutes.toFixed(0)} min) inferiore al riferimento datasheet a ${nearest.t}°C (${nearest.durationMin} min): la Tg reale e probabilmente inferiore alla stima.`
    : null;
  const extrapolated = peakT < sorted[0].t || peakT > sorted[sorted.length - 1].t;
  return { tg, insufficient: false, durationWarning, extrapolated };
}

const badgeStyle = (kind) => {
  const map = {
    datasheet: { bg: "rgba(111,191,143,0.12)", fg: "#6fbf8f", dot: "#6fbf8f", label: "DATASHEET" },
    stima: { bg: "rgba(232,178,61,0.12)", fg: "#e8b23d", dot: "#e8b23d", label: "STIMA" },
    nd: { bg: "rgba(228,87,46,0.12)", fg: "#e4572e", dot: "#e4572e", label: "N/D" },
  };
  return map[kind] || map.nd;
};

function Badge({ kind }) {
  const s = badgeStyle(kind);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: s.bg, color: s.fg, fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10, letterSpacing: "0.06em", padding: "2px 7px", borderRadius: 3,
      border: `1px solid ${s.fg}33`, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {s.label}
    </span>
  );
}

function Field({ label, value, onChange, unit, kind, step = "any", width = 92, disabled = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "7px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <span style={{ color: "#8b93a1", fontSize: 12.5, fontFamily: "'Inter', sans-serif" }}>{label}</span>
        {kind && <Badge kind={kind} />}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexShrink: 0 }}>
        <input
          type="number"
          step={step}
          value={value === null || value === undefined ? "" : value}
          placeholder={kind === "nd" ? "inserire" : ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
          style={{
            width, textAlign: "right", background: "#14171a",
            border: `1px solid ${kind === "nd" && (value === null || value === undefined) ? "#e4572e88" : "#2a3038"}`,
            borderRadius: 4, color: "#ecf0f2", fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13, padding: "5px 8px", opacity: disabled ? 0.5 : 1,
          }}
        />
        <span style={{ color: "#5b6470", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", width: 46 }}>{unit}</span>
      </div>
    </div>
  );
}

function SectionTitle({ n, title }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#4fd1c5",
        border: "1px solid #4fd1c555", borderRadius: 3, padding: "1px 6px",
      }}>{n}</span>
      <h2 style={{
        fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600,
        color: "#ecf0f2", margin: 0, letterSpacing: "0.01em",
      }}>{title}</h2>
    </div>
  );
}

const Panel = ({ children, style }) => (
  <div style={{
    background: "#1b1f24", border: "1px solid #2a3038", borderRadius: 8,
    padding: "18px 20px", ...style,
  }}>{children}</div>
);

const cellInput = {
  width: "100%", background: "#14171a", border: "1px solid #2a3038", borderRadius: 4,
  color: "#ecf0f2", fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5,
  padding: "5px 4px", textAlign: "right", minWidth: 0,
};
const colHead = (color) => ({
  fontSize: 9.5, color: color || "#5b6470", fontFamily: "'JetBrains Mono', monospace",
  textTransform: "uppercase", letterSpacing: "0.04em",
});
const warnBox = (color) => ({
  fontSize: 11.5, color, marginTop: 8, lineHeight: 1.55,
  background: `${color}14`, border: `1px solid ${color}40`, borderRadius: 5, padding: "9px 11px",
});

/* ---------------- Tabella ciclo a fasi-tempo ---------------- */
function CycleTable({ initial, setInitial, phases, setPhases }) {
  const rows = buildTimeline(initial, phases);
  const updateInitial = (key, v) => setInitial({ ...initial, [key]: v === "" ? 0 : parseFloat(v) });
  const updatePhase = (id, key, v) => setPhases(phases.map(p => (p.id === id ? { ...p, [key]: v === "" ? 0 : parseFloat(v) } : p)));
  const removePhase = (id) => { if (phases.length > 1) setPhases(phases.filter(p => p.id !== id)); };
  const addPhase = () => {
    const last = phases.length ? phases[phases.length - 1] : initial;
    setPhases([...phases, { id: genId(), duration: 30, temp: last.temp, press: last.press, vacuum: last.vacuum }]);
  };

  const gridCols = "20px 46px 56px 1fr 1fr 1fr 20px";

  return (
    <div>
      <div className="cycle-scroll">
      <div style={{ minWidth: 420 }}>
      <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 5, marginBottom: 6, paddingBottom: 4, borderBottom: "1px solid #2a3038" }}>
        <span style={colHead()}>#</span>
        <span style={colHead()}>t cum</span>
        <span style={colHead()}>durata</span>
        <span style={colHead("#f2a93c")}>T °C</span>
        <span style={colHead("#c98bf2")}>P bar</span>
        <span style={colHead("#5b9bd5")}>vuoto</span>
        <span />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 5, alignItems: "center", marginBottom: 5 }}>
        <span style={{ fontSize: 10, color: "#5b6470", fontFamily: "'JetBrains Mono', monospace" }}>0</span>
        <span style={{ fontSize: 10, color: "#5b6470", fontFamily: "'JetBrains Mono', monospace" }}>0</span>
        <span style={{ fontSize: 9.5, color: "#5b6470" }}>iniziale</span>
        <input type="number" value={initial.temp} onChange={(e) => updateInitial("temp", e.target.value)} style={cellInput} />
        <input type="number" value={initial.press} onChange={(e) => updateInitial("press", e.target.value)} style={cellInput} />
        <input type="number" value={initial.vacuum} onChange={(e) => updateInitial("vacuum", e.target.value)} style={cellInput} />
        <span />
      </div>

      {phases.map((p, i) => (
        <div key={p.id} style={{ display: "grid", gridTemplateColumns: gridCols, gap: 5, alignItems: "center", marginBottom: 5 }}>
          <span style={{ fontSize: 10, color: "#f2a93c", fontFamily: "'JetBrains Mono', monospace" }}>{i + 1}</span>
          <span style={{ fontSize: 10, color: "#5b6470", fontFamily: "'JetBrains Mono', monospace" }}>{rows[i + 1].t.toFixed(0)}</span>
          <input type="number" value={p.duration} onChange={(e) => updatePhase(p.id, "duration", e.target.value)} style={cellInput} />
          <input type="number" value={p.temp} onChange={(e) => updatePhase(p.id, "temp", e.target.value)} style={cellInput} />
          <input type="number" value={p.press} onChange={(e) => updatePhase(p.id, "press", e.target.value)} style={cellInput} />
          <input type="number" value={p.vacuum} onChange={(e) => updatePhase(p.id, "vacuum", e.target.value)} style={cellInput} />
          <button onClick={() => removePhase(p.id)} disabled={phases.length <= 1}
            style={{
              background: "none", border: "none", color: phases.length <= 1 ? "#3a4048" : "#e4572e",
              cursor: phases.length <= 1 ? "default" : "pointer", fontSize: 15, lineHeight: 1, justifySelf: "center",
            }}>×</button>
        </div>
      ))}
      </div>
      </div>

      <button onClick={addPhase} style={{
        background: "none", border: "1px dashed #f2a93c66", color: "#f2a93c", borderRadius: 5,
        padding: "5px 10px", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", marginTop: 6,
      }}>+ aggiungi fase</button>

      <div style={{ fontSize: 10, color: "#5b6470", marginTop: 8 }}>
        durata totale ciclo: {rows[rows.length - 1].t.toFixed(0)} min · ogni fase e definita da durata + valore
        raggiunto alla fine (rampa implicita, interpolazione lineare rispetto alla fase precedente).
      </div>
    </div>
  );
}

/* ============================================================================
   GRAFICO (SVG nativo, nessuna dipendenza esterna oltre React)
   ========================================================================== */
function AutoclaveChart({ points, tTotal, nominalPeakT, thermalDataAvailable, axisTicks, tickColorFor, gelInfo, stasiMinus5Time, stasiTime, expanded }) {
  const [hover, setHover] = useState(null);
  const W = 1000, H = 300;
  const mL = 42, mR = 34, mT = 14, mB = 30;
  const plotW = W - mL - mR, plotH = H - mT - mB;

  const temps = points.flatMap(p => [p.aria, p.stampo]).filter(v => v !== null && v !== undefined);
  const minY = Math.min(0, Math.min(...temps)) - 8;
  const maxY = Math.max(nominalPeakT, Math.max(...temps)) + 12;
  const barMin = -1.2, barMax = 8;

  const xAt = (t) => mL + (t / tTotal) * plotW;
  const yTempAt = (v) => mT + (1 - (v - minY) / (maxY - minY)) * plotH;
  const yBarAt = (v) => mT + (1 - (v - barMin) / (barMax - barMin)) * plotH;

  const pathFor = (key, yFn) => {
    let d = "";
    points.forEach((p) => {
      const v = p[key];
      if (v === null || v === undefined) return;
      d += `${d === "" ? "M" : "L"}${xAt(p.t).toFixed(2)},${yFn(v).toFixed(2)} `;
    });
    return d;
  };

  const ariaPath = pathFor("aria", yTempAt);
  const stampoPath = thermalDataAvailable ? pathFor("stampo", yTempAt) : "";
  const pressPath = pathFor("pressione", yBarAt);
  const vuotoPath = pathFor("vuoto", yBarAt);

  const handleMove = (clientX, target) => {
    const rect = target.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const idx = Math.round(ratio * (points.length - 1));
    setHover(points[Math.max(0, Math.min(idx, points.length - 1))]);
  };

  const yTicksTemp = (() => {
    const n = 5, arr = [];
    for (let i = 0; i <= n; i++) arr.push(minY + (i * (maxY - minY)) / n);
    return arr;
  })();
  const yTicksBar = [-1, 0, 2, 4, 6, 8].filter(v => v >= barMin && v <= barMax);

  // Su schermi stretti troppe etichette in ascissa si accavallano: teniamo sempre quelle
  // colorate (gel/stasi, che sono i punti che contano) e diradiamo le altre.
  const maxPlainLabels = 7;
  const plainTicks = axisTicks.filter(t => tickColorFor(t) === "#ffffff");
  const keepEvery = plainTicks.length > maxPlainLabels ? Math.ceil(plainTicks.length / maxPlainLabels) : 1;
  let plainSeen = 0;
  const visibleTicks = axisTicks.filter(t => {
    if (tickColorFor(t) !== "#ffffff") return true;
    const keep = plainSeen % keepEvery === 0;
    plainSeen++;
    return keep;
  });

  const handleStart = (clientX, target) => handleMove(clientX, target);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: "100%", display: "block", touchAction: "pan-y" }}
        onMouseMove={(e) => handleMove(e.clientX, e.currentTarget)}
        onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => { if (e.touches[0]) handleStart(e.touches[0].clientX, e.currentTarget); }}
        onTouchMove={(e) => { if (e.touches[0]) handleMove(e.touches[0].clientX, e.currentTarget); }}
        onTouchEnd={() => setHover(null)}
      >
        {yTicksTemp.map((v, i) => (
          <line key={"g" + i} x1={mL} x2={W - mR} y1={yTempAt(v)} y2={yTempAt(v)} stroke="#2a3038" strokeDasharray="3 3" />
        ))}
        <line x1={mL} x2={mL} y1={mT} y2={H - mB} stroke="#5b6470" />
        <line x1={W - mR} x2={W - mR} y1={mT} y2={H - mB} stroke="#5b6470" />
        <line x1={mL} x2={W - mR} y1={H - mB} y2={H - mB} stroke="#5b6470" />
        {yTicksTemp.map((v, i) => (
          <text key={"yt" + i} x={mL - 6} y={yTempAt(v) + 3} textAnchor="end" fontSize={9} fontFamily="'JetBrains Mono', monospace" fill="#5b6470">{Math.round(v)}</text>
        ))}
        {yTicksBar.map((v, i) => (
          <text key={"yb" + i} x={W - mR + 6} y={yBarAt(v) + 3} textAnchor="start" fontSize={9} fontFamily="'JetBrains Mono', monospace" fill="#5b6470">{v}</text>
        ))}
        {visibleTicks.map((t, i) => (
          <g key={"x" + i}>
            <line x1={xAt(t)} x2={xAt(t)} y1={H - mB} y2={H - mB + 4} stroke="#5b6470" />
            <text x={xAt(t)} y={H - mB + 14} textAnchor="middle" fontSize={9} fontFamily="'JetBrains Mono', monospace"
              fill={tickColorFor(t)} fontWeight={tickColorFor(t) === "#ffffff" ? 500 : 700}>{t}</text>
          </g>
        ))}
        <line x1={mL} x2={W - mR} y1={yTempAt(nominalPeakT)} y2={yTempAt(nominalPeakT)} stroke="#3a4048" strokeDasharray="2 2" />
        <line x1={mL} x2={W - mR} y1={yBarAt(0)} y2={yBarAt(0)} stroke="#3a4048" />
        {!gelInfo.insufficient && !gelInfo.notReached && (
          <>
            <line x1={xAt(gelInfo.time)} x2={xAt(gelInfo.time)} y1={mT} y2={H - mB} stroke="#4ade80" strokeDasharray="4 2" />
            <text x={xAt(gelInfo.time)} y={mT + 8} textAnchor="middle" fontSize={9} fill="#4ade80" fontWeight={700}>gel · {gelInfo.time.toFixed(0)}min</text>
          </>
        )}
        {stasiMinus5Time !== null && (
          <>
            <line x1={xAt(stasiMinus5Time)} x2={xAt(stasiMinus5Time)} y1={mT} y2={H - mB} stroke="#fde047" strokeDasharray="4 2" />
            <text x={xAt(stasiMinus5Time)} y={mT + 20} textAnchor="middle" fontSize={9} fill="#fde047" fontWeight={700}>T-5°C · {stasiMinus5Time.toFixed(0)}min</text>
          </>
        )}
        {stasiTime !== null && (
          <>
            <line x1={xAt(stasiTime)} x2={xAt(stasiTime)} y1={mT} y2={H - mB} stroke="#fde047" strokeDasharray="4 2" />
            <text x={xAt(stasiTime)} y={mT + 32} textAnchor="middle" fontSize={9} fill="#fde047" fontWeight={700}>T stasi · {stasiTime.toFixed(0)}min</text>
          </>
        )}
        <path d={pressPath} fill="none" stroke="#c98bf2" strokeWidth={1.6} />
        <path d={vuotoPath} fill="none" stroke="#5b9bd5" strokeWidth={1.6} />
        <path d={ariaPath} fill="none" stroke="#f2a93c" strokeWidth={2} />
        {thermalDataAvailable && <path d={stampoPath} fill="none" stroke="#4fd1c5" strokeWidth={2} />}
        {hover && (
          <>
            <line x1={xAt(hover.t)} x2={xAt(hover.t)} y1={mT} y2={H - mB} stroke="#ecf0f2" strokeOpacity={0.35} />
            <circle cx={xAt(hover.t)} cy={yTempAt(hover.aria)} r={3} fill="#f2a93c" />
            {thermalDataAvailable && hover.stampo !== null && <circle cx={xAt(hover.t)} cy={yTempAt(hover.stampo)} r={3} fill="#4fd1c5" />}
          </>
        )}
      </svg>
      {hover && (
        <div style={{
          position: "absolute", top: 4, right: 6, background: "#1b1f24", border: "1px solid #2a3038",
          borderRadius: 6, padding: "6px 9px", fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace",
          color: "#ecf0f2", lineHeight: 1.6, pointerEvents: "none",
        }}>
          <div style={{ color: "#8b93a1" }}>t = {hover.t.toFixed(0)} min</div>
          <div style={{ color: "#f2a93c" }}>aria {hover.aria.toFixed(1)}°C</div>
          {thermalDataAvailable && hover.stampo !== null && <div style={{ color: "#4fd1c5" }}>stampo {hover.stampo.toFixed(1)}°C</div>}
          <div style={{ color: "#c98bf2" }}>P {hover.pressione.toFixed(2)} bar</div>
          <div style={{ color: "#5b9bd5" }}>vuoto {hover.vuoto.toFixed(2)} bar</div>
        </div>
      )}
    </div>
  );
}

function ChartLegend({ thermalDataAvailable }) {
  const items = [
    { c: "#f2a93c", l: "T aria autoclave" },
    ...(thermalDataAvailable ? [{ c: "#4fd1c5", l: "T stampo (stimata)" }] : []),
    { c: "#c98bf2", l: "Pressione (bar)" },
    { c: "#5b9bd5", l: "Vuoto (bar)" },
  ];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "#8b93a1" }}>
          <span style={{ width: 10, height: 2, background: it.c, display: "inline-block" }} />
          {it.l}
        </div>
      ))}
    </div>
  );
}

function App() {
  const [toolKey, setToolKey] = useState("al5083");
  const [partKey, setPartKey] = useState("dt120");

  const toolBase = TOOL_MATERIALS.find(m => m.key === toolKey);
  const partBase = PART_RESINS.find(r => r.key === partKey);

  const [toolCte, setToolCte] = useState(toolBase.cte);
  const [toolDensity, setToolDensity] = useState(toolBase.density);
  const [toolK, setToolK] = useState(toolBase.k);
  const [toolCp, setToolCp] = useState(toolBase.cp);

  const [partCte, setPartCte] = useState(2);

  const [nSides, setNSides] = useState(2);
  const [thicknessMm, setThicknessMm] = useState(20);
  const [hConv, setHConv] = useState(80);
  const [chartExpanded, setChartExpanded] = useState(false);

  const initCycle = defaultCycle();
  const [cycleInitial, setCycleInitial] = useState(initCycle.initial);
  const [cyclePhases, setCyclePhases] = useState(initCycle.phases);

  useEffect(() => {
    const t = TOOL_MATERIALS.find(m => m.key === toolKey);
    setToolCte(t.cte); setToolDensity(t.density); setToolK(t.k); setToolCp(t.cp);
  }, [toolKey]);

  useEffect(() => {
    // Il CTE parte non viene piu impostato dal datasheet della resina: resta un valore libero
    // (default 2 µm/m·K, tipico letteratura CFRP quasi-isotropico) editabile dall'utente.
    // Il ciclo di cura NON viene piu ricalcolato al cambio resina/materiale: resta quello impostato
    // dall'utente in sezione 04. Usare "ripristina default" per riportarlo al ciclo di default fisso.
  }, [partKey]);

  const resetCureCycle = () => {
    const c = defaultCycle();
    setCycleInitial(c.initial);
    setCyclePhases(c.phases);
  };

  /* ---------------- Simulazione termica + pressione + vuoto ---------------- */
  const sim = useMemo(() => {
    const rows = buildTimeline(cycleInitial, cyclePhases);
    const tTotal = rows[rows.length - 1].t + 4;
    const nominalPeakT = Math.max(...rows.map(r => r.temp));

    const Lc_m = (nSides === 2 ? thicknessMm / 2 : thicknessMm) / 1000;
    const thermalDataAvailable = !!(toolK && toolCp && toolDensity);

    let Bi = null, tauMin = null, lumpedValid = null;
    const points = [];
    const dt = Math.max(tTotal / 320, 0.2);

    if (thermalDataAvailable) {
      Bi = (hConv * Lc_m) / toolK;
      const tauSec = (toolDensity * toolCp * Lc_m) / hConv;
      tauMin = tauSec / 60;
      lumpedValid = Bi < 0.1;

      let tStampo = cycleInitial.temp;
      for (let t = 0; t <= tTotal; t += dt) {
        const tAria = interpAt(rows, t, "temp");
        const p = interpAt(rows, t, "press");
        const v = interpAt(rows, t, "vacuum");
        points.push({
          t: Math.round(t * 10) / 10, aria: Math.round(tAria * 10) / 10, stampo: Math.round(tStampo * 10) / 10,
          pressione: Math.round(p * 100) / 100, vuoto: Math.round(v * 100) / 100,
        });
        tStampo = tStampo + (dt * (tAria - tStampo)) / Math.max(tauMin, 0.001);
      }
    } else {
      for (let t = 0; t <= tTotal; t += dt) {
        const tAria = interpAt(rows, t, "temp");
        const p = interpAt(rows, t, "press");
        const v = interpAt(rows, t, "vacuum");
        points.push({
          t: Math.round(t * 10) / 10, aria: Math.round(tAria * 10) / 10, stampo: null,
          pressione: Math.round(p * 100) / 100, vuoto: Math.round(v * 100) / 100,
        });
      }
    }

    const peakStampo = thermalDataAvailable
      ? Math.max(...points.map(p => p.stampo ?? -Infinity))
      : nominalPeakT;

    let stasiMinus5Time = null, stasiTime = null;
    if (thermalDataAvailable) {
      for (const p of points) {
        if (stasiMinus5Time === null && p.stampo !== null && p.stampo >= nominalPeakT - 5) stasiMinus5Time = p.t;
        if (stasiTime === null && p.stampo !== null && p.stampo >= nominalPeakT - 0.5) stasiTime = p.t;
        if (stasiMinus5Time !== null && stasiTime !== null) break;
      }
    }

    return { points, rows, Bi, tauMin, lumpedValid, peakStampo, thermalDataAvailable, nominalPeakT, tTotal, stasiMinus5Time, stasiTime };
  }, [cycleInitial, cyclePhases, nSides, thicknessMm, hConv, toolK, toolCp, toolDensity]);

  /* ---------------- Coefficiente di scala (a fine cura / picco) ---------------- */
  const result = useMemo(() => {
    const deltaT = sim.peakStampo - cycleInitial.temp;
    const hasPartCte = partCte !== null && partCte !== undefined;
    const alphaTool = (toolCte || 0) * 1e-6;
    const alphaPart = (partCte || 0) * 1e-6;
    const deltaAlpha = alphaTool - alphaPart;
    const scaleFactor = hasPartCte ? 1 - deltaAlpha * deltaT : null;
    const mmPerMeter = scaleFactor !== null ? (scaleFactor - 1) * 1000 : null;
    return { deltaT, hasPartCte, alphaTool, alphaPart, deltaAlpha, scaleFactor, mmPerMeter };
  }, [sim.peakStampo, cycleInitial.temp, toolCte, partCte]);

  /* ---------------- Punto di gel: incrocio gel-time resina x dilatazione stampo ---------------- */
  const gelInfo = useMemo(() => {
    const model = buildGelModel(partBase.gelPoints);
    if (!model) return { insufficient: true, singlePoint: null };
    const dt = sim.points.length > 1 ? sim.points[1].t - sim.points[0].t : 0.5;
    let cum = 0;
    for (let i = 0; i < sim.points.length; i++) {
      const p = sim.points[i];
      const T = sim.thermalDataAvailable ? p.stampo : p.aria;
      cum += dt / model.tGelAt(T);
      if (cum >= 1) {
        return {
          insufficient: false, notReached: false, method: model.method,
          time: p.t, tStampo: p.stampo, tAria: p.aria,
          extrapolated: T < model.tMin || T > model.tMax,
          usedAirFallback: !sim.thermalDataAvailable,
          range: [model.tMin, model.tMax], nPoints: partBase.gelPoints.length, refPoint: model.refPoint,
        };
      }
    }
    return { insufficient: false, notReached: true, method: model.method, range: [model.tMin, model.tMax], nPoints: partBase.gelPoints.length };
  }, [sim.points, sim.thermalDataAvailable, partBase]);

  const gelScale = useMemo(() => {
    if (!result.hasPartCte || gelInfo.insufficient || gelInfo.notReached) return null;
    const deltaTgel = gelInfo.tStampo - cycleInitial.temp;
    const scale = 1 - result.deltaAlpha * deltaTgel;
    return { deltaTgel, scale, mmPerMeter: (scale - 1) * 1000 };
  }, [gelInfo, result, cycleInitial.temp]);

  /* ---------------- Tg stimata a fine cottura ---------------- */
  const tgInfo = useMemo(() => {
    const dwellMin = timeAtPeak(sim.rows, sim.nominalPeakT);
    return { ...estimateTg(partBase.tgTable, sim.nominalPeakT, dwellMin), dwellMin };
  }, [sim.rows, sim.nominalPeakT, partBase]);

  const fmt = (x, d = 2) => (x === null || x === undefined || Number.isNaN(x) ? "—" : x.toFixed(d));

  const chartMeta = useMemo(() => {
    const stepTimes = sim.rows.slice(1).map(r => Math.round(r.t));
    const gelTimeR = (!gelInfo.insufficient && !gelInfo.notReached) ? Math.round(gelInfo.time) : null;
    const stasiM5R = sim.stasiMinus5Time !== null ? Math.round(sim.stasiMinus5Time) : null;
    const stasiR = sim.stasiTime !== null ? Math.round(sim.stasiTime) : null;
    const tickSet = new Set(stepTimes);
    [gelTimeR, stasiM5R, stasiR].forEach(v => { if (v !== null) tickSet.add(v); });
    const axisTicks = Array.from(tickSet).sort((a, b) => a - b);
    const tickColorFor = (t) => {
      if (gelTimeR !== null && t === gelTimeR) return "#4ade80";
      if ((stasiM5R !== null && t === stasiM5R) || (stasiR !== null && t === stasiR)) return "#fde047";
      return "#ffffff";
    };
    return { axisTicks, tickColorFor };
  }, [sim.rows, gelInfo, sim.stasiMinus5Time, sim.stasiTime]);

  return (
    <div style={{
      background: "#14171a", minHeight: "100%", padding: "28px 22px",
      fontFamily: "'Inter', sans-serif", color: "#ecf0f2",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
        input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
        select { color-scheme: dark; }
        .main-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media (min-width: 900px) { .main-grid { grid-template-columns: 1fr 1fr; gap: 18px; } }
        .grid-2 { display: grid; grid-template-columns: 1fr; gap: 10px; }
        @media (min-width: 560px) { .grid-2 { grid-template-columns: 1fr 1fr; } }
        .grid-3 { display: grid; grid-template-columns: 1fr; gap: 10px; }
        @media (min-width: 560px) { .grid-3 { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 760px) { .grid-3 { grid-template-columns: 1fr 1fr 1fr; } }
        .cycle-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      `}</style>

      <div style={{ marginBottom: 24, borderBottom: "1px solid #2a3038", paddingBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f2a93c" }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#8b93a1", letterSpacing: "0.12em" }}>
            TOOLING · AUTOCLAVE CURE
          </span>
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
          Coefficiente di scala stampi/modelli
        </h1>
        <p style={{ color: "#8b93a1", fontSize: 13, marginTop: 6, maxWidth: 760 }}>
          Compensazione dimensionale per differenza di dilatazione termica tra stampo e parte. Il ciclo si costruisce
          a fasi-tempo; il coefficiente di scala e calcolato sia a fine cura (T di picco) sia al punto di gel della
          resina, incrociando i dati di gel-time del datasheet con la dilatazione simulata dello stampo.
        </p>
      </div>

      <div className="main-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <Panel>
            <SectionTitle n="01" title="Materiale stampo / modello" />
            <select value={toolKey} onChange={(e) => setToolKey(e.target.value)}
              style={{
                width: "100%", marginTop: 10, marginBottom: 6, background: "#14171a",
                border: "1px solid #2a3038", borderRadius: 5, color: "#ecf0f2",
                fontFamily: "'Inter', sans-serif", fontSize: 13.5, padding: "9px 10px",
              }}>
              {["Metallo", "Board epossidica", "Composito", "Composito tooling"].map(g => (
                <optgroup key={g} label={g}>
                  {TOOL_MATERIALS.filter(m => m.group === g).map(m => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div style={{ borderTop: "1px solid #2a3038", marginTop: 6 }}>
              <Field label="CTE (α)" value={toolCte} onChange={setToolCte} unit="µm/m·K" kind={toolBase.cteSrc} />
              <Field label="Densità" value={toolDensity} onChange={setToolDensity} unit="kg/m³" kind={toolBase.densitySrc} step="1" />
              <Field label="Conducibilità k" value={toolK} onChange={setToolK} unit="W/m·K" kind={toolBase.kSrc} />
              <Field label="Calore specifico cp" value={toolCp} onChange={setToolCp} unit="J/kg·K" kind={toolBase.cpSrc} step="1" />
            </div>
            {toolBase.cteRange && (
              <div style={{ fontSize: 11, color: "#5b6470", marginTop: 4 }}>
                range dichiarato CTE: {toolBase.cteRange[0]}–{toolBase.cteRange[1]} µm/m·K
              </div>
            )}
            <div style={{ fontSize: 11.5, color: "#6b7480", marginTop: 10, lineHeight: 1.5 }}>{toolBase.note}</div>
          </Panel>

          <Panel>
            <SectionTitle n="02" title="Resina del pre-impregnato (parte)" />
            <select value={partKey} onChange={(e) => setPartKey(e.target.value)}
              style={{
                width: "100%", marginTop: 10, marginBottom: 6, background: "#14171a",
                border: "1px solid #2a3038", borderRadius: 5, color: "#ecf0f2",
                fontFamily: "'Inter', sans-serif", fontSize: 13.5, padding: "9px 10px",
              }}>
              {PART_RESINS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
            <div style={{ borderTop: "1px solid #2a3038", marginTop: 6 }}>
              <Field label="CTE laminato parte (α)" value={partCte} onChange={setPartCte} unit="µm/m·K" kind="stima" />
            </div>
            <div style={warnBox("#e8b23d")}>
              Default 2 µm/m·K (riferimento di letteratura per laminato CFRP quasi-isotropico, range tipico 2–4):
              non dipende dalla resina selezionata — sostituire con il valore reale del proprio laminato quando
              disponibile.
            </div>
            <div style={{ fontSize: 11.5, color: "#6b7480", marginTop: 10, lineHeight: 1.5 }}>{partBase.note}</div>
          </Panel>

          <Panel>
            <SectionTitle n="03" title="Geometria e trasmissione del calore" />
            <div style={{ display: "flex", gap: 8, marginTop: 10, marginBottom: 4 }}>
              {[1, 2].map(n => (
                <button key={n} onClick={() => setNSides(n)}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: 5, cursor: "pointer",
                    background: nSides === n ? "#4fd1c522" : "#14171a",
                    border: `1px solid ${nSides === n ? "#4fd1c5" : "#2a3038"}`,
                    color: nSides === n ? "#4fd1c5" : "#8b93a1",
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, fontWeight: 600,
                  }}>
                  {n} {n === 1 ? "lato" : "lati"} esposti
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "#5b6470", marginBottom: 6 }}>
              {nSides === 1 ? "Es. stampo massiccio su struttura di supporto isolante." : "Es. guscio sottile esposto all'aria autoclave su entrambe le facce."}
            </div>
            <div style={{ borderTop: "1px solid #2a3038" }}>
              <Field label="Spessore medio stampo" value={thicknessMm} onChange={setThicknessMm} unit="mm" step="1" />
              <Field label="Coefficiente di convezione h" value={hConv} onChange={setHConv} unit="W/m²K" step="1" />
            </div>
            <div style={{ fontSize: 11, color: "#5b6470", marginTop: 4 }}>h tipico in autoclave: 50–150 W/m²K (default 80, come da simulazione gia nel progetto)</div>
          </Panel>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <Panel>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <SectionTitle n="04" title="Ciclo di cura (fasi a tempo)" />
              <button onClick={resetCureCycle} style={{
                background: "none", border: "1px solid #2a3038", color: "#8b93a1",
                borderRadius: 5, padding: "5px 10px", fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                cursor: "pointer",
              }}>↺ ripristina default</button>
            </div>
            <div style={{ marginTop: 12 }}>
              <CycleTable initial={cycleInitial} setInitial={setCycleInitial} phases={cyclePhases} setPhases={setCyclePhases} />
            </div>
            <div style={{ fontSize: 10.5, color: "#5b6470", marginTop: 10, borderTop: "1px solid #2a3038", paddingTop: 8 }}>
              Vuoto espresso come valore negativo (bar di depressione). Le curve di pressione e vuoto sono a scopo di
              documentazione: il coefficiente di scala dipende unicamente dal profilo di temperatura.
            </div>
          </Panel>

          <Panel>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <SectionTitle n="05" title="Risposta termica, pressione e vuoto" />
              <button onClick={() => setChartExpanded(true)} style={{
                background: "none", border: "1px solid #2a3038", color: "#8b93a1",
                borderRadius: 5, padding: "5px 10px", fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                cursor: "pointer", flexShrink: 0,
              }}>⛶ schermo intero</button>
            </div>
            <div style={{ height: 220, marginTop: 12 }}>
              <AutoclaveChart points={sim.points} tTotal={sim.tTotal} nominalPeakT={sim.nominalPeakT}
                thermalDataAvailable={sim.thermalDataAvailable} axisTicks={chartMeta.axisTicks} tickColorFor={chartMeta.tickColorFor}
                gelInfo={gelInfo} stasiMinus5Time={sim.stasiMinus5Time} stasiTime={sim.stasiTime} expanded={false} />
            </div>
            <ChartLegend thermalDataAvailable={sim.thermalDataAvailable} />

            {sim.thermalDataAvailable ? (
              <div className="grid-3" style={{ marginTop: 10 }}>
                <MiniStat label="Numero di Biot" value={fmt(sim.Bi, 4)} sub={sim.lumpedValid ? "≪ 0.1 · modello valido" : "≥ 0.1 · gradiente non trascurabile"} warn={!sim.lumpedValid} />
                <MiniStat label="Costante τ" value={`${fmt(sim.tauMin, 1)} min`} sub="ρ·cp·Lc/h" />
                <MiniStat label="T stampo picco" value={`${fmt(sim.peakStampo, 1)} °C`} sub={`ritardo ${fmt(sim.nominalPeakT - sim.peakStampo, 1)} °C`} />
              </div>
            ) : (
              <div style={warnBox("#e4572e")}>
                Conducibilita k e/o calore specifico cp non disponibili per questo materiale stampo: il ritardo
                termico non e calcolabile. Il calcolo assume che lo stampo raggiunga la temperatura nominale di picco
                ({fmt(sim.nominalPeakT, 1)}°C) e — per il punto di gel — usa la temperatura dell'aria al posto della
                temperatura stampo.
              </div>
            )}
          </Panel>

          {chartExpanded && (
            <>
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#14171a", zIndex: 999 }} />
              <div style={{
                position: "fixed", top: 52, left: 0, right: 0, bottom: 0, zIndex: 1000,
                padding: "8px 12px 16px", boxSizing: "border-box", overflowY: "auto",
              }}>
                {/* Larghezza sempre = schermo (mai scroll orizzontale, mai overflow): è il tempo/durata
                    del ciclo a comprimersi per adattarsi allo schermo, non lo schermo a doversi allargare.
                    L'altezza è indipendente e pensata per una lettura comoda, non vincolata al rapporto
                    larghezza/altezza del grafico. */}
                <div style={{ width: "100%", height: "min(55vh, 520px)" }}>
                  <AutoclaveChart points={sim.points} tTotal={sim.tTotal} nominalPeakT={sim.nominalPeakT}
                    thermalDataAvailable={sim.thermalDataAvailable} axisTicks={chartMeta.axisTicks} tickColorFor={chartMeta.tickColorFor}
                    gelInfo={gelInfo} stasiMinus5Time={sim.stasiMinus5Time} stasiTime={sim.stasiTime} expanded={true} />
                </div>
              </div>
              <div style={{
                position: "fixed", top: 14, left: 14, zIndex: 1001,
                fontSize: 10.5, color: "#5b6470", fontFamily: "'JetBrains Mono', monospace",
              }}>tocca o trascina sul grafico per leggere i valori</div>
              <button onClick={() => setChartExpanded(false)} style={{
                position: "fixed", top: 10, right: 14, zIndex: 1001,
                background: "#1b1f24", border: "1px solid #2a3038", color: "#ecf0f2",
                borderRadius: 5, padding: "8px 14px", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer",
              }}>✕ chiudi</button>
            </>
          )}

          <Panel style={{ background: "linear-gradient(180deg, #1b1f24 0%, #191d22 100%)", border: "1px solid #f2a93c33" }}>
            <SectionTitle n="06" title="Coefficiente di scala — a fine cura (picco)" />
            {result.hasPartCte ? (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 14, marginBottom: 8 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 36, fontWeight: 700, color: "#f2a93c" }}>
                    {result.scaleFactor.toFixed(5)}
                  </span>
                  <span style={{ fontSize: 13, color: "#8b93a1" }}>
                    {result.mmPerMeter >= 0 ? "+" : ""}{fmt(result.mmPerMeter, 3)} mm / m nominale
                  </span>
                </div>
                <div style={{
                  borderTop: "1px solid #2a3038", paddingTop: 10, fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11.5, color: "#8b93a1", lineHeight: 1.9,
                }}>
                  <div>fattore = 1 − Δα · ΔT</div>
                  <div>Δα = α<sub>stampo</sub> − α<sub>parte</sub> = {fmt(result.deltaAlpha * 1e6, 2)} µm/m·K</div>
                  <div>ΔT = T<sub>stampo,picco</sub> − T<sub>iniziale</sub> = {fmt(sim.peakStampo, 1)} − {fmt(cycleInitial.temp, 1)} = {fmt(result.deltaT, 1)} °C</div>
                </div>
              </>
            ) : (
              <div style={warnBox("#e4572e")}>
                CTE della parte non disponibile: inserire un valore nel campo "CTE laminato parte" (sezione 02) per
                calcolare il coefficiente di scala.
              </div>
            )}
          </Panel>

          <Panel style={{ border: "1px solid #e8b23d33" }}>
            <SectionTitle n="07" title="Punto di gel e Tg stimata" />

            {gelInfo.insufficient ? (
              <div style={warnBox("#e4572e")}>
                Nessun dato di gel-time disponibile per questa resina: il punto di gel non e calcolabile. Fornisci
                almeno un punto gel-time/temperatura dal datasheet o da prove interne per attivare il calcolo.
              </div>
            ) : gelInfo.notReached ? (
              <div style={warnBox("#e4572e")}>
                Con il ciclo attuale il punto di gel non viene raggiunto entro la durata simulata (modello valido
                {" "}{gelInfo.range[0]}–{gelInfo.range[1]}°C): verificare i tempi di mantenimento della sezione 04.
              </div>
            ) : (
              <>
                <div className="grid-3" style={{ marginTop: 12 }}>
                  <MiniStat label="Tempo al gel" value={`${fmt(gelInfo.time, 0)} min`} sub={`${((gelInfo.time / sim.tTotal) * 100).toFixed(0)}% del ciclo`} />
                  <MiniStat label="T stampo al gel" value={`${fmt(gelInfo.tStampo, 1)} °C`} sub={`aria: ${fmt(gelInfo.tAria, 1)}°C`} />
                  {gelInfo.method === "q10" ? (
                    <MiniStat label="Metodo" value="Regola Q10" sub={`da ${gelInfo.refPoint.t}°C/${gelInfo.refPoint.tGel.toFixed(1)}min`} warn />
                  ) : (
                    <MiniStat label="Fit su" value={`${gelInfo.nPoints} punti`} sub={gelInfo.extrapolated ? "extrapolato oltre range dati" : `range dati ${gelInfo.range[0]}–${gelInfo.range[1]}°C`} warn={gelInfo.extrapolated} />
                  )}
                </div>
                {gelInfo.usedAirFallback && (
                  <div style={warnBox("#e8b23d")}>
                    Ritardo termico non calcolabile per il materiale stampo selezionato: il punto di gel e stato
                    stimato sulla temperatura dell'aria autoclave invece che sulla temperatura reale dello stampo.
                  </div>
                )}
                {gelInfo.method === "q10" && (
                  <div style={warnBox("#e8b23d")}>
                    Stima basata sulla regola empirica "il tempo di gel si dimezza ogni +10°C" applicata all'unico
                    punto disponibile dal datasheet ({gelInfo.refPoint.t}°C / {gelInfo.refPoint.tGel.toFixed(1)} min),
                    estrapolato di {fmt(gelInfo.tStampo - gelInfo.refPoint.t, 0)}°C rispetto al punto noto — non e un
                    fit su dati multipli specifici della resina: verificare se possibile con prove sperimentali.
                  </div>
                )}
                {gelInfo.method === "arrhenius" && gelInfo.extrapolated && (
                  <div style={warnBox("#e8b23d")}>
                    La temperatura al momento del gel cade fuori dal range di temperature testate nel datasheet
                    ({gelInfo.range[0]}–{gelInfo.range[1]}°C): stima estrapolata, confidenza ridotta.
                  </div>
                )}

                {gelScale && (
                  <div className="grid-2" style={{ marginTop: 14 }}>
                    <div style={{ background: "#14171a", border: "1px solid #e8b23d55", borderRadius: 6, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, color: "#e8b23d", marginBottom: 4 }}>SCALA AL GEL</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: "#e8b23d" }}>{gelScale.scale.toFixed(5)}</div>
                      <div style={{ fontSize: 10.5, color: "#8b93a1", marginTop: 2 }}>{gelScale.mmPerMeter >= 0 ? "+" : ""}{fmt(gelScale.mmPerMeter, 3)} mm/m · ΔT={fmt(gelScale.deltaTgel, 1)}°C</div>
                    </div>
                    <div style={{ background: "#14171a", border: "1px solid #f2a93c55", borderRadius: 6, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, color: "#f2a93c", marginBottom: 4 }}>SCALA A FINE CURA</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: "#f2a93c" }}>{fmt(result.scaleFactor, 5)}</div>
                      <div style={{ fontSize: 10.5, color: "#8b93a1", marginTop: 2 }}>{result.mmPerMeter >= 0 ? "+" : ""}{fmt(result.mmPerMeter, 3)} mm/m · ΔT={fmt(result.deltaT, 1)}°C</div>
                    </div>
                  </div>
                )}
                <div style={{ fontSize: 10.5, color: "#5b6470", marginTop: 8, lineHeight: 1.5 }}>
                  Il gel point segna il momento in cui la resina passa da liquido/viscoso a rete reticolata: da qui in
                  poi la parte e vincolata dimensionalmente allo stampo. Il confronto fra i due coefficienti indica
                  quanto la dilatazione residua tra gel e fine cura contribuisce allo scostamento dimensionale finale.
                </div>
              </>
            )}

            <div style={{ borderTop: "1px solid #2a3038", marginTop: 14, paddingTop: 12 }}>
              <div style={{ fontSize: 11, color: "#8b93a1", marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>Tg stimata a fine cottura</div>
              {tgInfo.insufficient ? (
                <div style={warnBox("#e4572e")}>Tg non stimabile: {tgInfo.note}</div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: "#4fd1c5" }}>{fmt(tgInfo.tg, 0)}°C</span>
                    <span style={{ fontSize: 11, color: "#5b6470" }}>a {fmt(sim.nominalPeakT, 0)}°C · {fmt(tgInfo.dwellMin, 0)} min di mantenimento simulato</span>
                    {tgInfo.extrapolated && <Badge kind="stima" />}
                  </div>
                  {tgInfo.durationWarning && <div style={warnBox("#e8b23d")}>{tgInfo.durationWarning}</div>}
                  <div style={{ fontSize: 10.5, color: "#5b6470", marginTop: 6 }}>
                    Stima da tabella cura→Tg del datasheet (interpolazione lineare in temperatura), non da modello
                    cinetico: non tiene conto di attivazione/durata in modo continuo.
                  </div>
                </>
              )}
            </div>
          </Panel>
        </div>
      </div>

      <div style={{ marginTop: 22, paddingTop: 14, borderTop: "1px solid #2a3038" }}>
        <div style={{ fontSize: 11, color: "#5b6470", lineHeight: 1.7, fontFamily: "'JetBrains Mono', monospace" }}>
          Fonti: Atlas Aluminium DS 5083 (2013) · EN AW-6082-T651 TDS · RAMPF WB-0691/0700/0890 TDS · Microtex E6-215/E6-215LW/HW TDS ·
          Cytec CYFORM 22 TDS Rev.0 · Syensqo LTM212 TDS · SAATI ER450 TDS · ST DT1205 / DT120MatrixTDS scheda processo.
          Gel-time e Tg stimati per interpolazione/estrapolazione dai punti discreti dei datasheet (vedi badge di
          confidenza in sezione 07) — non sostituiscono una caratterizzazione cinetica completa (DSC/rheometria).
          Tutti i valori sono di riferimento: verificare con certificati di conformita del lotto e dati sperimentali.
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub, warn }) {
  return (
    <div style={{ background: "#14171a", border: "1px solid #2a3038", borderRadius: 6, padding: "9px 10px" }}>
      <div style={{ fontSize: 10, color: "#5b6470", marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 600, color: "#ecf0f2" }}>{value}</div>
      <div style={{ fontSize: 10, color: warn ? "#e4572e" : "#5b6470", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

window.__CTEApp = App;
