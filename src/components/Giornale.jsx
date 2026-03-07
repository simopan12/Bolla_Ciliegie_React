import { useState, useEffect, useCallback } from "react";
import { BookOpen, Plus, Pencil, Trash2, X } from "lucide-react";
import {
  getGiornale,
  createGiornaleEntry,
  updateGiornaleEntry,
  deleteGiornaleEntry,
} from "../api/tauriCommands";
import { STANDARD_VARIETIES, SPECIAL_VARIETIES } from "./BollaForm";

const ALL_VARIETIES = [...STANDARD_VARIETIES, ...SPECIAL_VARIETIES];
const CURRENT_YEAR = new Date().getFullYear();

const STATI = [
  { value: "NON_PRONTO",   label: "Non pronto",   color: "bg-gray-100 text-gray-600" },
  { value: "QUASI_PRONTO", label: "Quasi pronto", color: "bg-yellow-100 text-yellow-700" },
  { value: "PRONTO",       label: "Pronto",       color: "bg-green-100 text-green-700" },
  { value: "RACCOLTO",     label: "Raccolto",     color: "bg-blue-100 text-blue-700" },
];

function statoInfo(value) {
  return STATI.find((s) => s.value === value) ?? STATI[0];
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

const emptyForm = {
  data: todayISO(),
  varieta: ALL_VARIETIES[0],
  statoLotto: "NON_PRONTO",
  calibroStimato: "",
  note: "",
};

export default function Giornale() {
  const [entries, setEntries] = useState([]);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGiornale(year);
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(entry) {
    setEditing(entry);
    setForm({
      data: entry.data,
      varieta: entry.varieta,
      statoLotto: entry.statoLotto,
      calibroStimato: entry.calibroStimato ?? "",
      note: entry.note ?? "",
    });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    const payload = {
      data: form.data,
      varieta: form.varieta,
      statoLotto: form.statoLotto,
      calibroStimato: form.calibroStimato || null,
      note: form.note || null,
    };
    try {
      if (editing) {
        await updateGiornaleEntry(editing.id, payload);
      } else {
        await createGiornaleEntry(payload);
      }
      setShowModal(false);
      load();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id) {
    await deleteGiornaleEntry(id);
    setConfirmDelete(null);
    load();
  }

  // Group entries by date for a cleaner view
  const grouped = entries.reduce((acc, e) => {
    (acc[e.data] = acc[e.data] || []).push(e);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={22} className="text-sage-700" />
          <h1 className="text-2xl font-bold text-gray-800">Giornale di Raccolta</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border rounded-lg px-3 py-1.5 text-sm"
          >
            {Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button className="btn-primary btn-sm" onClick={openNew}>
            <Plus size={14} />
            Nuova nota
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-2 flex-wrap">
        {STATI.map((s) => (
          <span key={s.value} className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>
            {s.label}
          </span>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-700" />
        </div>
      ) : dates.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p>Nessuna nota per il {year}.</p>
          <p className="text-sm mt-1">Inizia registrando lo stato dei lotti giorno per giorno.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dates.map((date) => (
            <div key={date} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Date header */}
              <div className="bg-gray-50 border-b border-gray-100 px-4 py-2">
                <p className="text-sm font-semibold text-gray-700">
                  {new Date(date + "T12:00:00").toLocaleDateString("it-IT", {
                    weekday: "long", day: "numeric", month: "long",
                  })}
                </p>
              </div>
              {/* Entries for this date */}
              <div className="divide-y divide-gray-50">
                {grouped[date].map((entry) => {
                  const stato = statoInfo(entry.statoLotto);
                  return (
                    <div key={entry.id} className="px-4 py-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{entry.varieta}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stato.color}`}>
                            {stato.label}
                          </span>
                          {entry.calibroStimato && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              Calibro: {entry.calibroStimato}
                            </span>
                          )}
                        </div>
                        {entry.note && (
                          <p className="text-sm text-gray-500 mt-1 leading-snug">{entry.note}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          className="btn-secondary btn-sm"
                          onClick={() => openEdit(entry)}
                          title="Modifica"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="btn-danger btn-sm"
                          onClick={() => setConfirmDelete(entry.id)}
                          title="Elimina"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-800">
                {editing ? "Modifica nota" : "Nuova nota di campo"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Data *</label>
                  <input
                    type="date"
                    className="input"
                    required
                    value={form.data}
                    onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Varietà *</label>
                  <select
                    className="input"
                    value={form.varieta}
                    onChange={(e) => setForm((p) => ({ ...p, varieta: e.target.value }))}
                  >
                    {ALL_VARIETIES.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Stato lotto *</label>
                  <select
                    className="input"
                    value={form.statoLotto}
                    onChange={(e) => setForm((p) => ({ ...p, statoLotto: e.target.value }))}
                  >
                    {STATI.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Calibro stimato</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="es. 28-30mm"
                    value={form.calibroStimato}
                    onChange={(e) => setForm((p) => ({ ...p, calibroStimato: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="label">Note (colore, consistenza, indicazioni compratore…)</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  placeholder="Es: buon colore, Brix elevato, compratore dice di aspettare ancora 2 giorni…"
                  value={form.note}
                  onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Annulla
                </button>
                <button type="submit" className="btn-primary">
                  {editing ? "Salva modifiche" : "Aggiungi nota"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <p className="font-semibold text-gray-800">Eliminare questa nota?</p>
            <p className="text-sm text-gray-500">L'operazione non è reversibile.</p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>
                Annulla
              </button>
              <button className="btn-danger" onClick={() => handleDelete(confirmDelete)}>
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
