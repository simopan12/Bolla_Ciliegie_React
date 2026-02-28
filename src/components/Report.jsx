import { useState } from "react";
import {
  Search, RefreshCw, AlertCircle, TrendingUp,
  Leaf, Scissors, Award, Scale,
} from "lucide-react";
import { getReport } from "../api/tauriCommands";
import { formatEuro, formatKg, firstDayOfMonthISO, todayISO } from "../utils/formatters";

const SPECIAL_VARIETIES = ["Rossi", "Piccoli", "Scarti", "Rossi Sila", "Susine California", "Susine Ruth Gerstetter"];

// Palette colori
const SAGE_600   = "#35742e";
const SAGE_400   = "#66ae59";
const SAGE_200   = "#c2e1ba";
const AMBER_600  = "#d97706";
const AMBER_400  = "#f59e0b";
const AMBER_200  = "#fde68a";

// Colori per varietà multiple nel bar chart
const VARIETY_COLORS = [
  "#35742e","#45913b","#5aad4e","#72c764","#8dd97c",
  "#a7e89b","#bef0b5","#d4f8ce","#e8fce4","#f4fff0",
];
const SPECIAL_COLORS = {
  Rossi:                    "#dc2626",
  Piccoli:                  "#f59e0b",
  Scarti:                   "#9ca3af",
  "Rossi Sila":             "#b91c1c",
  "Susine California":      "#7c3aed",
  "Susine Ruth Gerstetter": "#6d28d9",
};

// ─────────────────────────────────────────────
// Grafico a barre orizzontali
// ─────────────────────────────────────────────
function HBarChart({ data, formatValue, emptyMsg }) {
  if (!data.length) {
    return <p className="text-xs text-gray-400 text-center py-4">{emptyMsg ?? "Nessun dato"}</p>;
  }
  const maxVal = Math.max(...data.map((d) => d.value), 0.001);
  return (
    <div className="space-y-2 py-1">
      {data.map(({ label, value, color }) => {
        const pct = Math.round((value / maxVal) * 100);
        return (
          <div key={label} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-24 text-right truncate shrink-0" title={label}>
              {label}
            </span>
            <div className="relative flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
              <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-semibold text-gray-700 z-10">
                {formatValue(value)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Grafico donut SVG — Standard vs Scarti
// ─────────────────────────────────────────────
function DonutSplit({ stdVal, specVal, stdLabel, specLabel, centerLabel, formatVal }) {
  const total = stdVal + specVal;
  if (total <= 0) return null;

  const cx = 70, cy = 70, r = 52, sw = 20;
  const circ = 2 * Math.PI * r;
  const stdPct  = stdVal  / total;
  const specPct = specVal / total;
  const stdDash  = stdPct  * circ;
  const specDash = specPct * circ;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="140" height="140" viewBox="0 0 140 140">
        {/* Traccia grigia di sfondo */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} />
        {/* Standard (verde) */}
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={SAGE_600} strokeWidth={sw}
          strokeDasharray={`${stdDash} ${circ}`}
          strokeDashoffset={0}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        {/* Speciali (ambra) */}
        {specPct > 0 && (
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke={AMBER_600} strokeWidth={sw}
            strokeDasharray={`${specDash} ${circ}`}
            strokeDashoffset={-stdDash}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        )}
        {/* Centro */}
        <text x={cx} y={cy - 10} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#374151">
          {Math.round(stdPct * 100)}%
        </text>
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="9" fill="#6b7280">
          {centerLabel}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="8" fill="#9ca3af">
          IGP
        </text>
      </svg>

      {/* Legenda */}
      <div className="w-full space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: SAGE_600 }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-700 truncate">{stdLabel}</p>
            <p className="text-xs text-gray-500">{formatVal(stdVal)}</p>
          </div>
        </div>
        {specPct > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: AMBER_600 }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">{specLabel}</p>
              <p className="text-xs text-gray-500">{formatVal(specVal)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Card riepilogo
// ─────────────────────────────────────────────
function SummaryCard({ label, value, sub, icon: Icon, accent, dim }) {
  return (
    <div className={`card p-4 ${dim ? "opacity-75" : ""}`}>
      <div className="flex items-start justify-between mb-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
        {Icon && <Icon size={15} className={accent} />}
      </div>
      <p className={`text-lg font-bold ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
// Tabella dettaglio varietà
// ─────────────────────────────────────────────
function VarietyTable({ rows, isSpecial }) {
  const totKg  = rows.reduce((s, r) => s + r.totalKg,      0);
  const totRev = rows.reduce((s, r) => s + r.totalRevenue,  0);
  const avgPriceOverall = totKg > 0 ? totRev / totKg : 0;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wide">
            <th className="px-4 py-2.5 text-left">Varietà</th>
            <th className="px-4 py-2.5 text-right">KG Totali</th>
            <th className="px-4 py-2.5 text-right">Ricavo</th>
            <th className="px-4 py-2.5 text-right">€/kg medio</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r) => (
            <tr key={r.variety} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-2.5 font-medium flex items-center gap-2">
                {isSpecial ? (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: SPECIAL_COLORS[r.variety] ?? AMBER_600 }}
                  />
                ) : (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SAGE_600 }} />
                )}
                {r.variety}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">
                {r.totalKg > 0 ? formatKg(r.totalKg) : <span className="text-gray-300">—</span>}
              </td>
              <td className="px-4 py-2.5 text-right font-medium tabular-nums" style={{ color: SAGE_600 }}>
                {r.totalRevenue > 0 ? formatEuro(r.totalRevenue) : <span className="text-gray-300">—</span>}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">
                {r.avgPrice > 0 ? (
                  <span className="font-semibold" style={{ color: AMBER_600 }}>
                    {formatEuro(r.avgPrice)}/kg
                  </span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 border-t-2 border-gray-300 font-bold text-sm">
            <td className="px-4 py-2.5">Subtotale</td>
            <td className="px-4 py-2.5 text-right tabular-nums">{formatKg(totKg)}</td>
            <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: SAGE_600 }}>
              {formatEuro(totRev)}
            </td>
            <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: AMBER_600 }}>
              {avgPriceOverall > 0 ? `${formatEuro(avgPriceOverall)}/kg` : "—"}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────
// Componente principale
// ─────────────────────────────────────────────
export default function Report() {
  const [startDate, setStartDate] = useState(firstDayOfMonthISO());
  const [endDate,   setEndDate]   = useState(todayISO());
  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [searched,  setSearched]  = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!startDate || !endDate) { setError("Selezionare entrambe le date."); return; }
    if (startDate > endDate)    { setError("La data inizio deve essere ≤ data fine."); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await getReport(startDate, endDate);
      setRows(data);
      setSearched(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  // ── Calcoli derivati ──────────────────────────────────────────
  const stdRows  = rows.filter((r) => !SPECIAL_VARIETIES.includes(r.variety));
  const specRows = rows.filter((r) =>  SPECIAL_VARIETIES.includes(r.variety));

  const totStdKg   = stdRows.reduce((s, r) => s + r.totalKg,      0);
  const totStdRev  = stdRows.reduce((s, r) => s + r.totalRevenue,  0);
  const totSpecKg  = specRows.reduce((s, r) => s + r.totalKg,      0);
  const totSpecRev = specRows.reduce((s, r) => s + r.totalRevenue, 0);
  const totKg      = totStdKg  + totSpecKg;
  const totRev     = totStdRev + totSpecRev;
  const avgStdPrice  = totStdKg  > 0 ? totStdRev  / totStdKg  : 0;
  const avgSpecPrice = totSpecKg > 0 ? totSpecRev / totSpecKg : 0;

  // Bar chart: KG per varietà (tutte, ordinate desc)
  const kgChartData = [...rows]
    .filter((r) => r.totalKg > 0)
    .sort((a, b) => b.totalKg - a.totalKg)
    .map((r, i) =>
      SPECIAL_VARIETIES.includes(r.variety)
        ? { label: r.variety, value: r.totalKg, color: SPECIAL_COLORS[r.variety] ?? AMBER_600 }
        : { label: r.variety, value: r.totalKg, color: VARIETY_COLORS[i % VARIETY_COLORS.length] }
    );

  // Bar chart: Prezzi medi per varietà — ordinati dal più alto al più basso
  const priceChartData = [...rows]
    .filter((r) => r.avgPrice > 0)
    .sort((a, b) => b.avgPrice - a.avgPrice)
    .map((r, i) => {
      // Colore: da verde scuro (alto) a giallo (basso)
      const maxI = Math.max(rows.filter((x) => x.avgPrice > 0).length - 1, 1);
      const t = i / maxI; // 0 = più caro, 1 = più economico
      const colors = ["#15803d","#16a34a","#22c55e","#4ade80","#86efac","#d97706","#f59e0b","#fbbf24","#fcd34d","#fde68a"];
      return {
        label: r.variety,
        value: r.avgPrice,
        color: colors[Math.min(Math.round(t * (colors.length - 1)), colors.length - 1)],
      };
    });

  // Bar chart: Ricavi per varietà standard (ordinate desc)
  const revChartData = [...stdRows]
    .filter((r) => r.totalRevenue > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .map((r, i) => ({
      label: r.variety,
      value: r.totalRevenue,
      color: VARIETY_COLORS[i % VARIETY_COLORS.length],
    }));

  return (
    <div className="space-y-4">
      {/* ── Header ─────────────────────────────────────────────── */}
      <h1 className="text-xl font-bold text-gray-800">Report Vendite</h1>

      {/* ── Filtro date ──────────────────────────────────────────── */}
      <div className="card p-5">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[160px]">
            <label className="label">Data inizio</label>
            <input type="date" className="input" value={startDate}
              onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="label">Data fine</label>
            <input type="date" className="input" value={endDate}
              onChange={(e) => setEndDate(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />}
            Cerca
          </button>
        </form>
      </div>

      {/* ── Errore ───────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ── Risultati ────────────────────────────────────────────── */}
      {searched && (
        rows.length === 0 ? (
          <div className="card flex flex-col items-center justify-center h-40 text-gray-400">
            <TrendingUp size={32} className="mb-2 opacity-40" />
            <p className="text-sm text-center">
              Nessun dato nel periodo selezionato.<br />
              Solo bolle in stato <strong>Confermata</strong> vengono incluse.
            </p>
          </div>
        ) : (
          <>
            {/* ── Cards riepilogo ─────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SummaryCard
                label="KG Totali"
                value={formatKg(totKg)}
                icon={Scale}
                accent="text-gray-800"
              />
              <SummaryCard
                label="Ricavo Totale"
                value={formatEuro(totRev)}
                icon={TrendingUp}
                accent="text-green-700"
              />
              <SummaryCard
                label="Varietà IGP"
                value={formatEuro(totStdRev)}
                sub={totStdKg > 0 ? `${formatKg(totStdKg)} · ${formatEuro(avgStdPrice)}/kg` : undefined}
                icon={Leaf}
                accent="text-sage-700"
              />
              <SummaryCard
                label="Categorie Speciali"
                value={totSpecRev > 0 ? formatEuro(totSpecRev) : "—"}
                sub={totSpecKg > 0 ? `${formatKg(totSpecKg)} · ${formatEuro(avgSpecPrice)}/kg` : "Nessun dato"}
                icon={Scissors}
                accent="text-amber-700"
                dim={totSpecRev === 0}
              />
            </div>

            {/* ── Sezione Grafici ───────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Grafico 1: KG per varietà */}
              <div className="card p-4 lg:col-span-2">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <Scale size={14} className="text-sage-600" />
                  Distribuzione KG per Varietà
                </h2>
                <HBarChart
                  data={kgChartData}
                  formatValue={formatKg}
                  emptyMsg="Nessun KG registrato"
                />
              </div>

              {/* Grafico 2: Donut standard vs scarti (KG) */}
              <div className="card p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <Award size={14} className="text-sage-600" />
                  Qualità vs Scarti
                </h2>
                <div className="flex justify-center">
                  <DonutSplit
                    stdVal={totStdKg}   specVal={totSpecKg}
                    stdLabel="Varietà IGP" specLabel="Categorie Speciali"
                    centerLabel="Varietà" formatVal={formatKg}
                  />
                </div>
                {totStdKg > 0 && totSpecKg > 0 && (
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Rapporto qualità/scarti in KG
                  </p>
                )}
              </div>

              {/* Grafico 3: Prezzi medi per varietà */}
              <div className="card p-4 lg:col-span-2">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <Award size={14} className="text-amber-600" />
                  Prezzi Medi — dal più redditizio
                </h2>
                {priceChartData.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    Nessun prezzo inserito ancora. Usa il tasto € sulle bolle.
                  </p>
                ) : (
                  <HBarChart
                    data={priceChartData}
                    formatValue={(v) => `${formatEuro(v)}/kg`}
                  />
                )}
              </div>

              {/* Grafico 4: Ricavi per varietà */}
              <div className="card p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-green-600" />
                  Ricavi vs Scarti
                </h2>
                <div className="flex justify-center">
                  <DonutSplit
                    stdVal={totStdRev}   specVal={totSpecRev}
                    stdLabel="Varietà IGP" specLabel="Categorie Speciali"
                    centerLabel="Varietà" formatVal={formatEuro}
                  />
                </div>
                {totStdRev > 0 && totSpecRev > 0 && (
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Rapporto ricavi qualità/scarti
                  </p>
                )}
              </div>
            </div>

            {/* ── Tabella Varietà Standard ──────────────────────────── */}
            {stdRows.length > 0 && (
              <div className="card overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-sage-50">
                  <Leaf size={15} className="text-sage-600" />
                  <h2 className="font-semibold text-sage-800 text-sm">Varietà Ciliegie IGP</h2>
                  <span className="ml-auto text-xs text-gray-400">{stdRows.length} varietà</span>
                </div>
                <VarietyTable rows={stdRows} isSpecial={false} />
              </div>
            )}

            {/* ── Tabella Scarti / Piccoli / Rossi ─────────────────── */}
            {specRows.length > 0 && (
              <div className="card overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-amber-50">
                  <Scissors size={15} className="text-amber-600" />
                  <h2 className="font-semibold text-amber-800 text-sm">Categorie Speciali</h2>
                  <span className="ml-auto text-xs text-gray-400">{specRows.length} voci</span>
                </div>
                <VarietyTable rows={specRows} isSpecial={true} />
              </div>
            )}

            {/* ── Riga totale generale ─────────────────────────────── */}
            <div className="card p-4">
              <div className="flex flex-wrap gap-6 items-center">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Totale Generale</p>
                  <p className="text-xl font-bold text-gray-800">{formatKg(totKg)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Ricavo Totale</p>
                  <p className="text-xl font-bold text-green-700">{formatEuro(totRev)}</p>
                </div>
                {(totStdRev > 0 || totSpecRev > 0) && totKg > 0 && (
                  <div className="ml-auto">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Prezzo Medio Ponderato</p>
                    <p className="text-xl font-bold text-amber-700">{formatEuro(totRev / totKg)}/kg</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
