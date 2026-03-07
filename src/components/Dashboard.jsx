import { useState, useEffect } from "react";
import { getYearlyStats } from "../api/tauriCommands";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();
const COLORS_PIE = ["#4a7c59", "#f59e0b", "#8b5cf6", "#6b7280"];
const COLORS_BAR = ["#4a7c59", "#86efac", "#f59e0b", "#fbbf24", "#8b5cf6"];

function formatEur(val) {
  if (val >= 1000) return "€" + (val / 1000).toFixed(1) + "k";
  return "€" + val.toFixed(0);
}
function formatEurFull(val) {
  return val.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

const customTooltipStyle = {
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "8px 12px",
  fontSize: "12px",
};

function KPICard({ label, value, sub, trend, trendVal }) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-gray-400";
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      {trendVal !== undefined && (
        <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trendColor}`}>
          <TrendIcon size={12} />
          {trendVal > 0 ? "+" : ""}{trendVal.toFixed(1)}% vs anno prec.
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const years = Array.from({ length: 6 }, (_, i) => selectedYear - 5 + i);
        const data = await getYearlyStats(years);
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedYear]);

  const current = stats.find((s) => s.year === selectedYear);
  const prev = stats.find((s) => s.year === selectedYear - 1);

  function pct(curr, prev) {
    if (!prev || prev === 0) return undefined;
    return ((curr - prev) / Math.abs(prev)) * 100;
  }

  function trendDir(pctVal) {
    if (pctVal === undefined) return "neutral";
    return pctVal > 0 ? "up" : pctVal < 0 ? "down" : "neutral";
  }

  // Data for charts
  const areaData = stats.map((s) => ({
    year: s.year,
    Ricavi: s.ricavi,
    Costi: s.costiManodopera + s.costiVari + s.ammortamenti,
    Margine: s.margine,
  }));

  const pieData = current
    ? [
        { name: "Manodopera", value: current.costiManodopera },
        { name: "Trattamenti/Altro", value: current.costiVari },
        { name: "Ammortamenti", value: current.ammortamenti },
      ].filter((d) => d.value > 0)
    : [];

  // Bar chart: top varietà per anno
  const allVarieta = [...new Set(stats.flatMap((s) => s.ricaviPerVarieta.map((v) => v.variety)))];
  const barData = stats.map((s) => {
    const obj = { year: s.year };
    allVarieta.forEach((v) => {
      const found = s.ricaviPerVarieta.find((r) => r.variety === v);
      obj[v] = found ? found.ricavi : 0;
    });
    return obj;
  });

  const lineData = stats.map((s) => ({ year: s.year, Margine: s.margine }));

  const top3 = current?.ricaviPerVarieta.slice(0, 3) ?? [];
  const medals = ["🥇", "🥈", "🥉"];

  const ricaviPct = pct(current?.ricavi, prev?.ricavi);
  const marginePct = pct(current?.margine, prev?.margine);
  const kgPct = pct(current?.kgTotali, prev?.kgTotali);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sage-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          {Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* KPI Cards — riga 1: valori assoluti */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Ricavi"
          value={current ? formatEurFull(current.ricavi) : "—"}
          trend={trendDir(ricaviPct)}
          trendVal={ricaviPct}
        />
        <KPICard
          label="Costi totali"
          value={current ? formatEurFull(current.costiManodopera + current.costiVari + current.ammortamenti) : "—"}
          sub={current ? `Manod. ${formatEurFull(current.costiManodopera)}` : ""}
        />
        <KPICard
          label="Margine netto"
          value={current ? formatEurFull(current.margine) : "—"}
          trend={trendDir(marginePct)}
          trendVal={marginePct}
        />
        <KPICard
          label="KG totali"
          value={current ? (current.kgTotali / 1000).toFixed(2) + " t" : "—"}
          trend={trendDir(kgPct)}
          trendVal={kgPct}
        />
      </div>

      {/* KPI Cards — riga 2: per kg */}
      {current && current.kgTotali > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <KPICard
            label="Costo manodopera / kg"
            value={"€ " + (current.costiManodopera / current.kgTotali).toFixed(3)}
            sub="costo raccolta per ogni kg venduto"
          />
          <KPICard
            label="Prezzo medio / kg"
            value={"€ " + (current.ricavi / current.kgTotali).toFixed(3)}
            sub="ricavo medio per ogni kg venduto"
          />
          <KPICard
            label="Margine / kg"
            value={"€ " + (current.margine / current.kgTotali).toFixed(3)}
            sub="margine netto per ogni kg venduto"
          />
        </div>
      )}

      {/* Area Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Ricavi vs Costi — ultimi 6 anni</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={areaData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="gRicavi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4a7c59" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4a7c59" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gCosti" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={formatEur} tick={{ fontSize: 12 }} width={60} />
            <Tooltip contentStyle={customTooltipStyle} formatter={(v) => formatEurFull(v)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="Ricavi" stroke="#4a7c59" fill="url(#gRicavi)" strokeWidth={2} />
            <Area type="monotone" dataKey="Costi" stroke="#f59e0b" fill="url(#gCosti)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bar + Pie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Ricavi per varietà (anni)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatEur} tick={{ fontSize: 11 }} width={55} />
              <Tooltip contentStyle={customTooltipStyle} formatter={(v) => formatEurFull(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {allVarieta.slice(0, 5).map((v, i) => (
                <Bar key={v} dataKey={v} stackId="a" fill={COLORS_BAR[i % COLORS_BAR.length]} radius={i === allVarieta.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Composizione costi {selectedYear}</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={customTooltipStyle} formatter={(v) => formatEurFull(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
              Nessun dato costi per {selectedYear}
            </div>
          )}
        </div>
      </div>

      {/* Line Chart Margine */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Margine netto nel tempo</h2>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={lineData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={formatEur} tick={{ fontSize: 12 }} width={60} />
            <Tooltip contentStyle={customTooltipStyle} formatter={(v) => formatEurFull(v)} />
            <Line
              type="monotone"
              dataKey="Margine"
              stroke="#4a7c59"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#4a7c59" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top 3 varietà */}
      {top3.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Top varietà {selectedYear}</h2>
          <div className="flex gap-4">
            {top3.map((v, i) => (
              <div key={v.variety} className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl mb-1">{medals[i]}</p>
                <p className="font-semibold text-gray-900">{v.variety}</p>
                <p className="text-sm text-sage-700 font-medium">{formatEurFull(v.ricavi)}</p>
                <p className="text-xs text-gray-400">{v.kg.toFixed(0)} kg</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.every((s) => s.ricavi === 0) && (
        <div className="text-center py-10 text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p>Nessun dato disponibile. Aggiungi bolle confermate, presenze e costi per visualizzare la dashboard.</p>
        </div>
      )}
    </div>
  );
}
