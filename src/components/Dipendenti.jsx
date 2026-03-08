import { useState, useEffect, useCallback } from "react";
import {
  getDipendenti,
  createDipendente,
  updateDipendente,
  deleteDipendente,
  getPresenze,
  createPresenza,
  deletePresenza,
} from "../api/tauriCommands";
import { UserPlus, ChevronDown, ChevronUp, Trash2, Pencil, Plus, X } from "lucide-react";

const TIPI_LAVORO = ["POTATURA", "RACCOLTA", "TRATTAMENTO", "ALTRO"];
const CURRENT_YEAR = new Date().getFullYear();

function formatEur(val) {
  return val.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

const emptyDip = { nome: "", cognome: "", ruolo: "", costoOrarioDefault: 0, telefono: "", note: "" };
const emptyPres = { dipendenteId: 0, data: "", ore: 8, costoOrario: 0, tipoLavoro: "RACCOLTA", note: "" };

export default function Dipendenti() {
  const [dipendenti, setDipendenti] = useState([]);
  const [presenze, setPresenze] = useState([]);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [expanded, setExpanded] = useState(null);
  const [showDipModal, setShowDipModal] = useState(false);
  const [editingDip, setEditingDip] = useState(null);
  const [dipForm, setDipForm] = useState(emptyDip);
  const [showPresModal, setShowPresModal] = useState(false);
  const [presForm, setPresForm] = useState(emptyPres);
  const [editingPres, setEditingPres] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const [dips, pres] = await Promise.all([
      getDipendenti(),
      getPresenze(year),
    ]);
    setDipendenti(dips);
    setPresenze(pres);
  }, [year]);

  useEffect(() => { load(); }, [load]);

  // ── Dipendente modal ──────────────────────────────
  function openNewDip() {
    setEditingDip(null);
    setDipForm(emptyDip);
    setShowDipModal(true);
  }

  function openEditDip(dip) {
    setEditingDip(dip);
    setDipForm({
      nome: dip.nome,
      cognome: dip.cognome,
      ruolo: dip.ruolo ?? "",
      costoOrarioDefault: dip.costoOrarioDefault,
      telefono: dip.telefono ?? "",
      note: dip.note ?? "",
    });
    setShowDipModal(true);
  }

  async function saveDip(e) {
    e.preventDefault();
    setLoading(true);
    const payload = {
      nome: dipForm.nome.trim(),
      cognome: dipForm.cognome.trim(),
      ruolo: dipForm.ruolo || null,
      costoOrarioDefault: parseFloat(dipForm.costoOrarioDefault) || 0,
      telefono: dipForm.telefono || null,
      note: dipForm.note || null,
    };
    try {
      if (editingDip) await updateDipendente(editingDip.id, payload);
      else await createDipendente(payload);
      setShowDipModal(false);
      await load();
    } catch (err) {
      alert("Errore: " + err);
    } finally {
      setLoading(false);
    }
  }

  async function removeDip(id) {
    if (!confirm("Eliminare il dipendente?")) return;
    try {
      await deleteDipendente(id);
      await load();
    } catch (err) {
      alert("Errore: " + err);
    }
  }

  // ── Presenza modal ────────────────────────────────
  function openNewPres(dipId, dipCostoOrario) {
    setEditingPres(null);
    setPresForm({ ...emptyPres, dipendenteId: dipId, costoOrario: dipCostoOrario });
    setShowPresModal(true);
  }

  async function savePres(e) {
    e.preventDefault();
    setLoading(true);
    const payload = {
      dipendenteId: presForm.dipendenteId,
      data: presForm.data,
      ore: parseFloat(presForm.ore),
      costoOrario: parseFloat(presForm.costoOrario),
      tipoLavoro: presForm.tipoLavoro || null,
      note: presForm.note || null,
    };
    try {
      if (editingPres) await updatePresenza(editingPres.id, payload);
      else await createPresenza(payload);
      setShowPresModal(false);
      await load();
    } catch (err) {
      alert("Errore: " + err);
    } finally {
      setLoading(false);
    }
  }

  async function removePres(id) {
    if (!confirm("Eliminare questa presenza?")) return;
    await deletePresenza(id);
    await load();
  }

  // ── Per dipendente: filtro presenze e totale ──────
  function presenzeOf(dipId) {
    return presenze.filter((p) => p.dipendenteId === dipId);
  }

  function oreAnno(dipId) {
    return presenzeOf(dipId).reduce((s, p) => s + p.ore, 0);
  }

  function costoAnno(dipId) {
    return presenzeOf(dipId).reduce((s, p) => s + p.costoTotale, 0);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dipendenti</h1>
        <div className="flex gap-3 items-center">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border rounded-lg px-3 py-1.5 text-sm"
          >
            {Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={openNewDip}
            className="flex items-center gap-2 bg-sage-700 text-white px-4 py-2 rounded-lg hover:bg-sage-800 transition-colors text-sm font-medium"
          >
            <UserPlus size={16} />
            Nuovo dipendente
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-4">
        {dipendenti.length === 0 && (
          <p className="text-gray-500 text-center py-8">Nessun dipendente. Aggiungine uno.</p>
        )}
        {dipendenti.map((dip) => {
          const isExpanded = expanded === dip.id;
          const pres = presenzeOf(dip.id);
          return (
            <div key={dip.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Card header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(isExpanded ? null : dip.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center font-bold text-sm">
                    {dip.nome[0]}{dip.cognome[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{dip.nome} {dip.cognome}</p>
                    <p className="text-xs text-gray-500">{dip.ruolo || "—"} · {formatEur(dip.costoOrarioDefault)}/h</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">{oreAnno(dip.id).toFixed(1)} h</p>
                    <p className="text-xs text-gray-500">{formatEur(costoAnno(dip.id))}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditDip(dip); }}
                      className="p-1.5 text-gray-400 hover:text-sage-700 rounded"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeDip(dip.id); }}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </div>
              </div>

              {/* Presenze inline */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-4 pb-4">
                  <div className="flex justify-between items-center py-3">
                    <p className="text-sm font-semibold text-gray-700">Presenze {year}</p>
                    <button
                      onClick={() => openNewPres(dip.id, dip.costoOrarioDefault)}
                      className="flex items-center gap-1 text-xs bg-sage-50 text-sage-700 border border-sage-200 px-3 py-1 rounded-lg hover:bg-sage-100"
                    >
                      <Plus size={12} /> Aggiungi presenza
                    </button>
                  </div>
                  {pres.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">Nessuna presenza registrata per quest'anno.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-500 border-b">
                          <th className="text-left pb-1">Data</th>
                          <th className="text-left pb-1">Ore</th>
                          <th className="text-left pb-1">Tipo</th>
                          <th className="text-right pb-1">Costo/h</th>
                          <th className="text-right pb-1">Totale</th>
                          <th className="pb-1"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {pres.map((p) => (
                          <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-1">{p.data}</td>
                            <td>{p.ore}</td>
                            <td>
                              <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
                                {p.tipoLavoro || "—"}
                              </span>
                            </td>
                            <td className="text-right">{formatEur(p.costoOrario)}</td>
                            <td className="text-right font-medium">{formatEur(p.costoTotale)}</td>
                            <td className="text-right">
                              <button
                                onClick={() => removePres(p.id)}
                                className="text-gray-300 hover:text-red-500 p-1"
                              >
                                <X size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="text-sm font-semibold text-gray-700">
                          <td className="pt-2">Totale</td>
                          <td>{oreAnno(dip.id).toFixed(1)} h</td>
                          <td colSpan={3} className="text-right pt-2">{formatEur(costoAnno(dip.id))}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Dipendente */}
      {showDipModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="font-bold text-lg">{editingDip ? "Modifica dipendente" : "Nuovo dipendente"}</h2>
              <button onClick={() => setShowDipModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={saveDip} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nome *</label>
                  <input className="input" required value={dipForm.nome} onChange={(e) => setDipForm({ ...dipForm, nome: e.target.value })} />
                </div>
                <div>
                  <label className="label">Cognome *</label>
                  <input className="input" required value={dipForm.cognome} onChange={(e) => setDipForm({ ...dipForm, cognome: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Ruolo</label>
                  <input className="input" value={dipForm.ruolo} onChange={(e) => setDipForm({ ...dipForm, ruolo: e.target.value })} />
                </div>
                <div>
                  <label className="label">Costo orario €/h *</label>
                  <input className="input" type="number" step="0.01" min="0" required value={dipForm.costoOrarioDefault} onChange={(e) => setDipForm({ ...dipForm, costoOrarioDefault: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Telefono</label>
                <input className="input" value={dipForm.telefono} onChange={(e) => setDipForm({ ...dipForm, telefono: e.target.value })} />
              </div>
              <div>
                <label className="label">Note</label>
                <textarea className="input" rows={2} value={dipForm.note} onChange={(e) => setDipForm({ ...dipForm, note: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowDipModal(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">Annulla</button>
                <button type="submit" disabled={loading} className="flex-1 bg-sage-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-sage-800 disabled:opacity-50">
                  {loading ? "Salvataggio…" : "Salva"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Presenza */}
      {showPresModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="font-bold text-lg">Aggiungi presenza</h2>
              <button onClick={() => setShowPresModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={savePres} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Data *</label>
                  <input className="input" type="date" required value={presForm.data} onChange={(e) => setPresForm({ ...presForm, data: e.target.value })} />
                </div>
                <div>
                  <label className="label">Ore *</label>
                  <input className="input" type="number" step="0.5" min="0.5" required value={presForm.ore} onChange={(e) => setPresForm({ ...presForm, ore: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Costo orario €/h</label>
                  <input className="input" type="number" step="0.01" min="0" required value={presForm.costoOrario} onChange={(e) => setPresForm({ ...presForm, costoOrario: e.target.value })} />
                  <p className="text-xs text-gray-400 mt-0.5">Ereditato dal dipendente</p>
                </div>
                <div>
                  <label className="label">Tipo lavoro</label>
                  <select className="input" value={presForm.tipoLavoro} onChange={(e) => setPresForm({ ...presForm, tipoLavoro: e.target.value })}>
                    {TIPI_LAVORO.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Note</label>
                <input className="input" value={presForm.note} onChange={(e) => setPresForm({ ...presForm, note: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPresModal(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">Annulla</button>
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
