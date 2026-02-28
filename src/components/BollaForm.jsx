import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, Save, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { createBolla, updateBolla, getBolla, getClienti } from "../api/tauriCommands";
import { todayISO } from "../utils/formatters";

// ─────────────────────────────────────────────
// Variety lists
// ─────────────────────────────────────────────

export const STANDARD_VARIETIES = [
  "Bigarreaux", "Early", "Nimba", "Aryana", "Lorenz", "Samba",
  "Marisa", "Cristallina", "Saretta", "Ferrovia",
];

export const SPECIAL_VARIETIES = ["Rossi", "Piccoli", "Scarti", "Rossi Sila", "Susine California", "Susine Ruth Gerstetter"];

const PADELLA_KG = 3;

// ─────────────────────────────────────────────
// Empty row factories
// ─────────────────────────────────────────────

const emptyStdRow  = () => ({ variety: STANDARD_VARIETIES[0], harvestDate: todayISO(), numPadelle: "" });
const emptySpecRow = () => ({ variety: SPECIAL_VARIETIES[0], numPadelle: "" });

// ─────────────────────────────────────────────
// Standard row — variety + harvestDate + numPadelle (kg auto)
// ─────────────────────────────────────────────

function StandardRow({ index, row, onChange, onRemove, errors }) {
  const isFirst = index === 0;
  const err = errors[`std_${index}`] || {};
  const autoKg = row.numPadelle !== "" ? parseInt(row.numPadelle) * PADELLA_KG : null;

  return (
    <div className="grid grid-cols-[1fr_140px_110px_36px] gap-2 items-start">
      {/* Varietà */}
      <div>
        {isFirst && <label className="label">Varietà *</label>}
        <select
          className="input"
          value={row.variety}
          onChange={(e) => onChange(index, "variety", e.target.value)}
        >
          {STANDARD_VARIETIES.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <p className="text-xs text-green-600 mt-0.5 font-medium">
          Prodotto destinato all'IGP
        </p>
      </div>

      {/* Data Raccolta */}
      <div>
        {isFirst && <label className="label">Data Raccolta *</label>}
        <input
          type="date"
          className={`input ${err.harvestDate ? "input-error" : ""}`}
          value={row.harvestDate}
          onChange={(e) => onChange(index, "harvestDate", e.target.value)}
        />
        {err.harvestDate && <p className="text-xs text-red-500 mt-0.5">{err.harvestDate}</p>}
      </div>

      {/* N° Padelle → KG auto */}
      <div>
        {isFirst && <label className="label">N° Padelle *</label>}
        <input
          type="number" min="0" step="1"
          className={`input ${err.numPadelle ? "input-error" : ""}`}
          placeholder="es. 4"
          value={row.numPadelle}
          onChange={(e) => onChange(index, "numPadelle", e.target.value)}
        />
        {err.numPadelle && <p className="text-xs text-red-500 mt-0.5">{err.numPadelle}</p>}
        {autoKg !== null && (
          <p className="text-xs text-sage-600 mt-0.5">= {autoKg} kg</p>
        )}
      </div>

      {/* Remove */}
      <div className={isFirst ? "mt-5" : ""}>
        <button
          type="button"
          className="btn-danger btn-sm w-full justify-center"
          onClick={() => onRemove(index)}
          title="Rimuovi"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Special row — variety + numPadelle only (kg inserito con i prezzi)
// ─────────────────────────────────────────────

function SpecialRow({ index, row, onChange, onRemove, errors }) {
  const isFirst = index === 0;
  const err = errors[`spec_${index}`] || {};

  return (
    <div className="grid grid-cols-[1fr_110px_36px] gap-2 items-start">
      {/* Categoria */}
      <div>
        {isFirst && <label className="label">Categoria</label>}
        <select
          className="input"
          value={row.variety}
          onChange={(e) => onChange(index, "variety", e.target.value)}
        >
          {SPECIAL_VARIETIES.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      {/* N° Padelle */}
      <div>
        {isFirst && <label className="label">N° Padelle *</label>}
        <input
          type="number" min="0" step="1"
          className={`input ${err.numPadelle ? "input-error" : ""}`}
          placeholder="es. 2"
          value={row.numPadelle}
          onChange={(e) => onChange(index, "numPadelle", e.target.value)}
        />
        {err.numPadelle && <p className="text-xs text-red-500 mt-0.5">{err.numPadelle}</p>}
        <p className="text-xs text-gray-400 mt-0.5">KG inseriti con i prezzi</p>
      </div>

      {/* Remove */}
      <div className={isFirst ? "mt-5" : ""}>
        <button
          type="button"
          className="btn-danger btn-sm w-full justify-center"
          onClick={() => onRemove(index)}
          title="Rimuovi"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main form component
// ─────────────────────────────────────────────

export default function BollaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [stdRows,  setStdRows]  = useState([emptyStdRow()]);
  const [specRows, setSpecRows] = useState([]);

  const [pickupDatetime, setPickupDatetime] = useState("");
  const [notes,          setNotes]          = useState("");
  const [clienteId,      setClienteId]      = useState(null);
  const [clienti,        setClienti]        = useState([]);
  const [errors,         setErrors]         = useState({});
  const [saving,         setSaving]         = useState(false);
  const [loadingEdit,    setLoadingEdit]    = useState(isEdit);
  const [loadError,      setLoadError]      = useState(null);

  // ── Load clienti ──────────────────────────────────────────────
  useEffect(() => {
    getClienti().then((list) => {
      setClienti(list);
      if (!isEdit) {
        const def = list.find((c) => c.predefinito === 1);
        if (def) setClienteId(def.id);
      }
    });
  }, [isEdit]);

  // ── Load for edit ────────────────────────────────────────────
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const b = await getBolla(Number(id));
        setPickupDatetime(b.pickupDatetime ? b.pickupDatetime.slice(0, 16) : "");
        setNotes(b.notes ?? "");
        setClienteId(b.clienteId ?? null);

        const std  = b.righe.filter((r) => !SPECIAL_VARIETIES.includes(r.variety));
        const spec = b.righe.filter((r) => SPECIAL_VARIETIES.includes(r.variety));

        setStdRows(
          std.length > 0
            ? std.map((r) => ({
                variety:     r.variety,
                harvestDate: r.harvestDate ? r.harvestDate.split("T")[0] : todayISO(),
                numPadelle:  r.numPadelle != null ? String(r.numPadelle) : "",
              }))
            : [emptyStdRow()]
        );
        setSpecRows(
          spec.map((r) => ({
            variety:    r.variety,
            numPadelle: r.numPadelle != null ? String(r.numPadelle) : "",
          }))
        );
      } catch (e) {
        setLoadError(String(e));
      } finally {
        setLoadingEdit(false);
      }
    })();
  }, [id, isEdit]);

  // ── Row helpers ──────────────────────────────────────────────
  const addStdRow     = () => setStdRows((p) => [...p, emptyStdRow()]);
  const removeStdRow  = (i) => setStdRows((p) => p.filter((_, idx) => idx !== i));
  const updateStdRow  = (i, field, val) =>
    setStdRows((p) => p.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));

  const addSpecRow    = () => setSpecRows((p) => [...p, emptySpecRow()]);
  const removeSpecRow = (i) => setSpecRows((p) => p.filter((_, idx) => idx !== i));
  const updateSpecRow = (i, field, val) =>
    setSpecRows((p) => p.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));

  // ── Totals ────────────────────────────────────────────────────
  const totalKg = stdRows.reduce(
    (s, r) => s + (parseInt(r.numPadelle) || 0) * PADELLA_KG,
    0
  );

  // ── Validation ────────────────────────────────────────────────
  function validate() {
    const errs = {};

    if (stdRows.length === 0) {
      errs.global = "Aggiungere almeno una varietà standard.";
    }

    stdRows.forEach((r, i) => {
      const e = {};
      const pad = parseInt(r.numPadelle);
      if (!r.numPadelle || isNaN(pad) || pad <= 0) e.numPadelle = "Obbligatorio (> 0)";
      if (Object.keys(e).length) errs[`std_${i}`] = e;
    });

    specRows.forEach((r, i) => {
      const e = {};
      const pad = parseInt(r.numPadelle);
      if (!r.numPadelle || isNaN(pad) || pad <= 0) e.numPadelle = "Obbligatorio (> 0)";
      if (Object.keys(e).length) errs[`spec_${i}`] = e;
    });

    return errs;
  }

  // ── Submit ────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSaving(true);

    const payload = {
      pickupDatetime: pickupDatetime || null,
      notes: notes.trim() || null,
      clienteId: clienteId ?? null,
      righe: [
        ...stdRows.map((r) => ({
          variety:     r.variety,
          kg:          (parseInt(r.numPadelle) || 0) * PADELLA_KG,
          numPadelle:  parseInt(r.numPadelle) || null,
          harvestDate: r.harvestDate || null,
        })),
        ...specRows.map((r) => ({
          variety:     r.variety,
          kg:          0.0,
          numPadelle:  parseInt(r.numPadelle) || null,
          harvestDate: null,
        })),
      ],
    };

    try {
      if (isEdit) {
        await updateBolla(Number(id), payload);
      } else {
        await createBolla(payload);
      }
      navigate("/");
    } catch (e) {
      setErrors({ global: String(e) });
    } finally {
      setSaving(false);
    }
  }

  // ── Loading / error states ────────────────────────────────────
  if (loadingEdit) {
    return (
      <div className="flex items-center justify-center h-60 text-gray-400">
        <RefreshCw size={20} className="animate-spin mr-2" />
        Caricamento bolla…
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
        <AlertCircle size={16} />
        {loadError}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" className="btn-secondary btn-sm" onClick={() => navigate("/")}>
          <ArrowLeft size={14} />
          Indietro
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          {isEdit ? "Modifica Bolla" : "Nuova Bolla"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Global error */}
        {errors.global && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            <AlertCircle size={16} />
            {errors.global}
          </div>
        )}

        {/* ── Cliente ───────────────────────────────────────────── */}
        {clienti.length > 0 && (
          <div className="card p-5">
            <label className="label">Cliente</label>
            <select
              className="input"
              value={clienteId ?? ""}
              onChange={(e) => setClienteId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">— Nessun cliente —</option>
              {clienti.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}{c.predefinito === 1 ? " (predefinito)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ── Pickup datetime ────────────────────────────────────── */}
        <div className="card p-5">
          <label className="label">Data/Ora Ritiro (opzionale)</label>
          <input
            type="datetime-local"
            className="input"
            value={pickupDatetime}
            onChange={(e) => setPickupDatetime(e.target.value)}
          />
        </div>

        {/* ── Standard varieties ─────────────────────────────────── */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-700 text-sm">
                Ciliegie Standard
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                N° padelle obbligatorio — KG calcolato automaticamente (1 pad = {PADELLA_KG} kg)
              </p>
            </div>
            <div className="flex items-center gap-3">
              {totalKg > 0 && (
                <span className="text-sm font-semibold text-sage-700">
                  Tot: {totalKg} kg
                </span>
              )}
              <button type="button" className="btn-primary btn-sm" onClick={addStdRow}>
                <Plus size={13} />
                Aggiungi varietà
              </button>
            </div>
          </div>

          {stdRows.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-3">
              Aggiungi almeno una varietà.
            </p>
          )}

          <div className="space-y-2">
            {stdRows.map((row, i) => (
              <StandardRow
                key={i}
                index={i}
                row={row}
                onChange={updateStdRow}
                onRemove={removeStdRow}
                errors={errors}
              />
            ))}
          </div>
        </div>

        {/* ── Special section: Rossi / Piccoli / Scarti ─────────── */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-700 text-sm">
                Rossi / Piccoli / Scarti
                <span className="ml-2 text-xs font-normal text-gray-400">(opzionale)</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Inserisci solo il numero di padelle — i KG vengono inseriti con i prezzi
              </p>
            </div>
            <button type="button" className="btn-secondary btn-sm" onClick={addSpecRow}>
              <Plus size={13} />
              Aggiungi
            </button>
          </div>

          {specRows.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-3">
              Nessuna voce aggiunta. Clicca "Aggiungi" se necessario.
            </p>
          )}

          <div className="space-y-2">
            {specRows.map((row, i) => (
              <SpecialRow
                key={i}
                index={i}
                row={row}
                onChange={updateSpecRow}
                onRemove={removeSpecRow}
                errors={errors}
              />
            ))}
          </div>
        </div>

        {/* ── Notes ─────────────────────────────────────────────── */}
        <div className="card p-5">
          <label className="label">Note (opzionale)</label>
          <textarea
            className="input resize-none" rows={3}
            placeholder="Inserisci note aggiuntive…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* ── Submit ────────────────────────────────────────────── */}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => navigate("/")}>
            Annulla
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
            {isEdit ? "Salva Modifiche" : "Crea Bolla"}
          </button>
        </div>
      </form>
    </div>
  );
}
