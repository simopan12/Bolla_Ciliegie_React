import { useState, useEffect, useCallback } from "react";
import {
  getPresenze,
  getDipendenti,
  createPresenza,
  updatePresenza,
  deletePresenza,
  getCostiVari,
  createCostoVario,
  updateCostoVario,
  deleteCostoVario,
  getAttrezzature,
  createAttrezzatura,
  updateAttrezzatura,
  deleteAttrezzatura,
} from "../api/tauriCommands";
import { Plus, Trash2, Pencil, X } from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();
const TIPI_LAVORO = ["POTATURA", "RACCOLTA", "TRATTAMENTO", "ALTRO"];
const CATEGORIE_COSTO = ["POTATURA", "TRATTAMENTO", "ALTRO"];

function formatEur(val) {
  return val.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

// ── Presenze Tab ─────────────────────────────────────────────────────────────

function PresenzeTab({ year }) {
  const [presenze, setPresenze] = useState([]);
  const [dipendenti, setDipendenti] = useState([]);
  const [filterDip, setFilterDip] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ dipendenteId: "", data: "", ore: 8, costoOrario: 0, tipoLavoro: "RACCOLTA", note: "" });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const [p, d] = await Promise.all([getPresenze(year), getDipendenti()]);
    setPresenze(p);
    setDipendenti(d);
    if (!form.dipendenteId && d.length > 0) setForm((f) => ({ ...f, dipendenteId: d[0].id }));
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const filtered = filterDip ? presenze.filter((p) => p.dipendenteId === Number(filterDip)) : presenze;
  const totale = filtered.reduce((s, p) => s + p.costoTotale, 0);

  function openNew() {
    setEditing(null);
    const d = dipendenti[0];
    setForm({ dipendenteId: d?.id ?? "", data: "", ore: 8, costoOrario: d?.costoOrarioDefault ?? 0, tipoLavoro: "RACCOLTA", note: "" });
    setShowModal(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({ dipendenteId: p.dipendenteId, data: p.data, ore: p.ore, costoOrario: p.costoOrario, tipoLavoro: p.tipoLavoro ?? "ALTRO", note: p.note ?? "" });
    setShowModal(true);
  }

  async function save(e) {
    e.preventDefault();
    setLoading(true);
    const payload = {
      dipendenteId: Number(form.dipendenteId),
      data: form.data,
      ore: parseFloat(form.ore),
      costoOrario: parseFloat(form.costoOrario),
      tipoLavoro: form.tipoLavoro || null,
      note: form.note || null,
    };
    try {
      if (editing) await updatePresenza(editing.id, payload);
      else await createPresenza(payload);
      setShowModal(false);
      await load();
    } catch (err) {
      alert("Errore: " + err);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id) {
    if (!confirm("Eliminare questa presenza?")) return;
    await deletePresenza(id);
    await load();
  }

  function onDipChange(id) {
    const d = dipendenti.find((d) => d.id === Number(id));
    setForm((f) => ({ ...f, dipendenteId: id, costoOrario: d?.costoOrarioDefault ?? 0 }));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
        <div className="flex gap-3 items-center">
          <select className="border rounded-lg px-3 py-1.5 text-sm" value={filterDip} onChange={(e) => setFilterDip(e.target.value)}>
            <option value="">Tutti i dipendenti</option>
            {dipendenti.map((d) => <option key={d.id} value={d.id}>{d.nome} {d.cognome}</option>)}
          </select>
          <span className="text-sm text-gray-500">Totale: <strong>{formatEur(totale)}</strong></span>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 bg-sage-700 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-sage-800">
          <Plus size={14} /> Aggiungi presenza
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-3 py-2 text-left">Data</th>
              <th className="px-3 py-2 text-left">Dipendente</th>
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-right">Ore</th>
              <th className="px-3 py-2 text-right">€/h</th>
              <th className="px-3 py-2 text-right">Totale</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-3 py-2">{p.data}</td>
                <td className="px-3 py-2">{p.dipendenteNome}</td>
                <td className="px-3 py-2">
                  <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{p.tipoLavoro || "—"}</span>
                </td>
                <td className="px-3 py-2 text-right">{p.ore}</td>
                <td className="px-3 py-2 text-right">{formatEur(p.costoOrario)}</td>
                <td className="px-3 py-2 text-right font-medium">{formatEur(p.costoTotale)}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-sage-700 p-1"><Pencil size={13} /></button>
                    <button onClick={() => remove(p.id)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-gray-400 py-6 text-sm">Nessuna presenza trovata.</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="font-bold text-lg">{editing ? "Modifica presenza" : "Nuova presenza"}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <div>
                <label className="label">Dipendente *</label>
                <select className="input" required value={form.dipendenteId} onChange={(e) => onDipChange(e.target.value)}>
                  {dipendenti.map((d) => <option key={d.id} value={d.id}>{d.nome} {d.cognome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Data *</label>
                  <input className="input" type="date" required value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
                </div>
                <div>
                  <label className="label">Ore *</label>
                  <input className="input" type="number" step="0.5" min="0.5" required value={form.ore} onChange={(e) => setForm({ ...form, ore: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Costo orario €/h *</label>
                  <input className="input" type="number" step="0.01" min="0" required value={form.costoOrario} onChange={(e) => setForm({ ...form, costoOrario: e.target.value })} />
                </div>
                <div>
                  <label className="label">Tipo lavoro</label>
                  <select className="input" value={form.tipoLavoro} onChange={(e) => setForm({ ...form, tipoLavoro: e.target.value })}>
                    {TIPI_LAVORO.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Note</label>
                <input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">Annulla</button>
                <button type="submit" disabled={loading} className="flex-1 bg-sage-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-sage-800 disabled:opacity-50">
                  {loading ? "Salvataggio…" : "Salva"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Spese Varie Tab ──────────────────────────────────────────────────────────

function SpeseVarieTab({ year }) {
  const [costi, setCosti] = useState([]);
  const [filterCat, setFilterCat] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ categoria: "TRATTAMENTO", data: "", importo: 0, descrizione: "", note: "" });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const data = await getCostiVari(year);
    setCosti(data);
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const filtered = filterCat ? costi.filter((c) => c.categoria === filterCat) : costi;
  const totale = filtered.reduce((s, c) => s + c.importo, 0);

  function openNew() {
    setEditing(null);
    setForm({ categoria: "TRATTAMENTO", data: "", importo: 0, descrizione: "", note: "" });
    setShowModal(true);
  }

  function openEdit(c) {
    setEditing(c);
    setForm({ categoria: c.categoria, data: c.data, importo: c.importo, descrizione: c.descrizione, note: c.note ?? "" });
    setShowModal(true);
  }

  async function save(e) {
    e.preventDefault();
    setLoading(true);
    const payload = {
      categoria: form.categoria,
      data: form.data,
      importo: parseFloat(form.importo),
      descrizione: form.descrizione.trim(),
      note: form.note || null,
    };
    try {
      if (editing) await updateCostoVario(editing.id, payload);
      else await createCostoVario(payload);
      setShowModal(false);
      await load();
    } catch (err) {
      alert("Errore: " + err);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id) {
    if (!confirm("Eliminare questa spesa?")) return;
    await deleteCostoVario(id);
    await load();
  }

  const catColors = { POTATURA: "bg-amber-50 text-amber-700", TRATTAMENTO: "bg-purple-50 text-purple-700", ALTRO: "bg-gray-100 text-gray-700" };

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
        <div className="flex gap-3 items-center">
          <select className="border rounded-lg px-3 py-1.5 text-sm" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="">Tutte le categorie</option>
            {CATEGORIE_COSTO.map((c) => <option key={c}>{c}</option>)}
          </select>
          <span className="text-sm text-gray-500">Totale: <strong>{formatEur(totale)}</strong></span>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 bg-sage-700 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-sage-800">
          <Plus size={14} /> Aggiungi spesa
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-3 py-2 text-left">Data</th>
              <th className="px-3 py-2 text-left">Categoria</th>
              <th className="px-3 py-2 text-left">Descrizione</th>
              <th className="px-3 py-2 text-right">Importo</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-3 py-2">{c.data}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${catColors[c.categoria] ?? "bg-gray-100"}`}>{c.categoria}</span>
                </td>
                <td className="px-3 py-2">{c.descrizione}</td>
                <td className="px-3 py-2 text-right font-medium">{formatEur(c.importo)}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(c)} className="text-gray-400 hover:text-sage-700 p-1"><Pencil size={13} /></button>
                    <button onClick={() => remove(c.id)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-gray-400 py-6 text-sm">Nessuna spesa trovata.</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="font-bold text-lg">{editing ? "Modifica spesa" : "Nuova spesa"}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Categoria *</label>
                  <select className="input" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                    {CATEGORIE_COSTO.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Data *</label>
                  <input className="input" type="date" required value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Descrizione *</label>
                <input className="input" required value={form.descrizione} onChange={(e) => setForm({ ...form, descrizione: e.target.value })} />
              </div>
              <div>
                <label className="label">Importo € *</label>
                <input className="input" type="number" step="0.01" min="0" required value={form.importo} onChange={(e) => setForm({ ...form, importo: e.target.value })} />
              </div>
              <div>
                <label className="label">Note</label>
                <textarea className="input" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">Annulla</button>
                <button type="submit" disabled={loading} className="flex-1 bg-sage-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-sage-800 disabled:opacity-50">
                  {loading ? "Salvataggio…" : "Salva"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Attrezzature Tab ─────────────────────────────────────────────────────────

function AttrezzatureTab() {
  const [attrezzature, setAttrezzature] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nome: "", descrizione: "", valoreAcquisto: 0, dataAcquisto: "", anniVitaUtile: 10, note: "" });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const data = await getAttrezzature();
    setAttrezzature(data);
  };

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm({ nome: "", descrizione: "", valoreAcquisto: 0, dataAcquisto: "", anniVitaUtile: 10, note: "" });
    setShowModal(true);
  }

  function openEdit(a) {
    setEditing(a);
    setForm({ nome: a.nome, descrizione: a.descrizione ?? "", valoreAcquisto: a.valoreAcquisto, dataAcquisto: a.dataAcquisto, anniVitaUtile: a.anniVitaUtile, note: a.note ?? "" });
    setShowModal(true);
  }

  async function save(e) {
    e.preventDefault();
    setLoading(true);
    const payload = {
      nome: form.nome.trim(),
      descrizione: form.descrizione || null,
      valoreAcquisto: parseFloat(form.valoreAcquisto),
      dataAcquisto: form.dataAcquisto,
      anniVitaUtile: parseInt(form.anniVitaUtile),
      note: form.note || null,
    };
    try {
      if (editing) await updateAttrezzatura(editing.id, payload);
      else await createAttrezzatura(payload);
      setShowModal(false);
      await load();
    } catch (err) {
      alert("Errore: " + err);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id) {
    if (!confirm("Disattivare questa attrezzatura?")) return;
    await deleteAttrezzatura(id);
    await load();
  }

  const currentYear = new Date().getFullYear();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">Le quote annue di ammortamento vengono calcolate automaticamente.</p>
        <button onClick={openNew} className="flex items-center gap-1.5 bg-sage-700 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-sage-800">
          <Plus size={14} /> Nuova attrezzatura
        </button>
      </div>

      <div className="grid gap-3">
        {attrezzature.filter((a) => a.attiva).map((a) => {
          const annoAcquisto = parseInt(a.dataAcquisto.substring(0, 4));
          const annoFine = annoAcquisto + a.anniVitaUtile;
          const anniResidui = Math.max(0, annoFine - currentYear);
          const valoreResiduo = a.quotaAnnua * anniResidui;
          return (
            <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{a.nome}</p>
                {a.descrizione && <p className="text-xs text-gray-500 mt-0.5">{a.descrizione}</p>}
                <div className="flex gap-6 mt-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Valore acquisto</p>
                    <p className="font-medium">{formatEur(a.valoreAcquisto)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Quota annua</p>
                    <p className="font-medium text-amber-600">{formatEur(a.quotaAnnua)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Anni residui</p>
                    <p className="font-medium">{anniResidui} / {a.anniVitaUtile}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Valore residuo</p>
                    <p className="font-medium">{formatEur(valoreResiduo)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">Acquisto: {a.dataAcquisto} · Fine ammort.: {annoFine}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(a)} className="text-gray-400 hover:text-sage-700 p-1.5"><Pencil size={14} /></button>
                <button onClick={() => remove(a.id)} className="text-gray-400 hover:text-red-600 p-1.5"><Trash2 size={14} /></button>
              </div>
            </div>
          );
        })}
        {attrezzature.filter((a) => a.attiva).length === 0 && (
          <p className="text-center text-gray-400 py-6 text-sm">Nessuna attrezzatura attiva.</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="font-bold text-lg">{editing ? "Modifica attrezzatura" : "Nuova attrezzatura"}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              <div>
                <label className="label">Nome *</label>
                <input className="input" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div>
                <label className="label">Descrizione</label>
                <input className="input" value={form.descrizione} onChange={(e) => setForm({ ...form, descrizione: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Valore acquisto € *</label>
                  <input className="input" type="number" step="0.01" min="0" required value={form.valoreAcquisto} onChange={(e) => setForm({ ...form, valoreAcquisto: e.target.value })} />
                </div>
                <div>
                  <label className="label">Data acquisto *</label>
                  <input className="input" type="date" required value={form.dataAcquisto} onChange={(e) => setForm({ ...form, dataAcquisto: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Vita utile (anni) *</label>
                <input className="input" type="number" min="1" max="50" required value={form.anniVitaUtile} onChange={(e) => setForm({ ...form, anniVitaUtile: e.target.value })} />
                {form.valoreAcquisto > 0 && form.anniVitaUtile > 0 && (
                  <p className="text-xs text-gray-500 mt-1">Quota annua: {formatEur(parseFloat(form.valoreAcquisto) / parseInt(form.anniVitaUtile))}</p>
                )}
              </div>
              <div>
                <label className="label">Note</label>
                <textarea className="input" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">Annulla</button>
                <button type="submit" disabled={loading} className="flex-1 bg-sage-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-sage-800 disabled:opacity-50">
                  {loading ? "Salvataggio…" : "Salva"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Costi Component ─────────────────────────────────────────────────────

const TABS = ["Presenze", "Spese Varie", "Attrezzature"];

export default function Costi() {
  const [activeTab, setActiveTab] = useState(0);
  const [year, setYear] = useState(CURRENT_YEAR);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Gestione Costi</h1>
        {activeTab < 2 && (
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border rounded-lg px-3 py-1.5 text-sm"
          >
            {Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === i ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        {activeTab === 0 && <PresenzeTab year={year} />}
        {activeTab === 1 && <SpeseVarieTab year={year} />}
        {activeTab === 2 && <AttrezzatureTab />}
      </div>
    </div>
  );
}
