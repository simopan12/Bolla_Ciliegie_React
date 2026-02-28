import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Star, RefreshCw, AlertCircle, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import {
  getClienti, createCliente, updateCliente, deleteCliente, setClientePredefinito,
} from "../api/tauriCommands";

const emptyForm = () => ({
  nome: "", sub: "", via: "", cap: "", citta: "", prov: "", piva: "", tel: "", sdi: "",
});

function ClienteForm({ initial, onSave, onCancel, saving, error }) {
  const [form, setForm] = useState(initial ?? emptyForm());
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  function handleSave() {
    const payload = {
      nome:  form.nome.trim(),
      sub:   form.sub.trim()   || null,
      via:   form.via.trim()   || null,
      cap:   form.cap.trim()   || null,
      citta: form.citta.trim() || null,
      prov:  form.prov.trim()  || null,
      piva:  form.piva.trim()  || null,
      tel:   form.tel.trim()   || null,
      sdi:   form.sdi.trim()   || null,
    };
    onSave(payload);
  }

  return (
    <div className="card p-4 space-y-3">
      <h2 className="font-semibold text-gray-700 text-sm">
        {initial ? "Modifica cliente" : "Nuovo cliente"}
      </h2>

      <div className="grid grid-cols-1 gap-2">
        <div>
          <label className="label">Ragione Sociale / Nome *</label>
          <input className="input" value={form.nome} onChange={set("nome")}
            placeholder="es. Azzani Francesco & C. SRL" autoFocus />
        </div>
        <div>
          <label className="label">Sottotitolo</label>
          <input className="input" value={form.sub} onChange={set("sub")}
            placeholder="es. A SOCIO UNICO" />
        </div>
        <div>
          <label className="label">Via / Indirizzo</label>
          <input className="input" value={form.via} onChange={set("via")}
            placeholder="es. Via per Spilamberto 1670" />
        </div>
        <div className="grid grid-cols-[80px_1fr_60px] gap-2">
          <div>
            <label className="label">CAP</label>
            <input className="input" value={form.cap} onChange={set("cap")} placeholder="41058" />
          </div>
          <div>
            <label className="label">Città</label>
            <input className="input" value={form.citta} onChange={set("citta")} placeholder="Vignola" />
          </div>
          <div>
            <label className="label">Prov.</label>
            <input className="input" value={form.prov} onChange={set("prov")} placeholder="MO" maxLength={2} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">P.IVA</label>
            <input className="input" value={form.piva} onChange={set("piva")} placeholder="03031270360" />
          </div>
          <div>
            <label className="label">Cod. SDI</label>
            <input className="input" value={form.sdi} onChange={set("sdi")} placeholder="W7YVJK9" />
          </div>
        </div>
        <div>
          <label className="label">Telefono</label>
          <input className="input" value={form.tel} onChange={set("tel")} placeholder="059 772230" />
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <p className="text-xs text-gray-400">
        Via, CAP, Città e P.IVA vengono usati nel DDT quando questo cliente è selezionato sulla bolla.
      </p>

      <div className="flex gap-2 justify-end">
        <button className="btn-secondary btn-sm" onClick={onCancel}>
          <X size={13} /> Annulla
        </button>
        <button className="btn-primary btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
          Salva
        </button>
      </div>
    </div>
  );
}

export default function Clienti() {
  const [clienti,   setClienti]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [showNew,   setShowNew]   = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [expanded,  setExpanded]  = useState({});

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setClienti(await getClienti()); }
    catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(payload, id) {
    if (!payload.nome) { setFormError("Il nome è obbligatorio."); return; }
    setSaving(true); setFormError(null);
    try {
      if (id == null) await createCliente(payload);
      else            await updateCliente(id, payload);
      setShowNew(false); setEditingId(null);
      await load();
    } catch (e) { setFormError(String(e)); }
    finally { setSaving(false); }
  }

  async function handleSetDefault(id) {
    try { await setClientePredefinito(id); await load(); }
    catch (e) { setError(String(e)); }
  }

  async function handleDelete(id) {
    try { await deleteCliente(id); await load(); }
    catch (e) { setError(String(e)); }
  }

  function toggleExpand(id) {
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Clienti</h1>
        <button className="btn-primary btn-sm" onClick={() => { setShowNew(true); setEditingId(null); setFormError(null); }}>
          <Plus size={14} /> Nuovo Cliente
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {showNew && (
        <ClienteForm
          onSave={(p) => handleSave(p, null)}
          onCancel={() => { setShowNew(false); setFormError(null); }}
          saving={saving}
          error={formError}
        />
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-24 text-gray-400">
            <RefreshCw size={18} className="animate-spin mr-2" /> Caricamento…
          </div>
        ) : clienti.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-gray-400 text-sm">
            Nessun cliente. Aggiungine uno!
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {clienti.map((c) => (
              <div key={c.id}>
                {/* Row */}
                <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50">
                  <button
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => toggleExpand(c.id)}
                    title={expanded[c.id] ? "Comprimi" : "Espandi"}
                  >
                    {expanded[c.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  <div className="flex-1 font-medium text-gray-800">
                    {c.nome}
                    {c.predefinito === 1 && (
                      <span className="ml-2 text-xs bg-sage-100 text-sage-700 px-1.5 py-0.5 rounded font-normal">
                        predefinito
                      </span>
                    )}
                    {c.via && (
                      <span className="ml-2 text-xs text-gray-400 font-normal">{c.via}, {c.citta}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {c.predefinito !== 1 && (
                      <button title="Imposta come predefinito" className="btn-secondary btn-sm"
                        onClick={() => handleSetDefault(c.id)}>
                        <Star size={13} />
                      </button>
                    )}
                    <button title="Modifica" className="btn-secondary btn-sm"
                      onClick={() => { setEditingId(c.id); setShowNew(false); setFormError(null); }}>
                      <Pencil size={13} />
                    </button>
                    {c.predefinito !== 1 && (
                      <button title="Elimina" className="btn-danger btn-sm"
                        onClick={() => handleDelete(c.id)}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Edit form inline */}
                {editingId === c.id && (
                  <div className="px-4 pb-4">
                    <ClienteForm
                      initial={{ nome: c.nome, sub: c.sub ?? "", via: c.via ?? "", cap: c.cap ?? "",
                                 citta: c.citta ?? "", prov: c.prov ?? "", piva: c.piva ?? "",
                                 tel: c.tel ?? "", sdi: c.sdi ?? "" }}
                      onSave={(p) => handleSave(p, c.id)}
                      onCancel={() => { setEditingId(null); setFormError(null); }}
                      saving={saving}
                      error={formError}
                    />
                  </div>
                )}

                {/* Expanded detail */}
                {expanded[c.id] && editingId !== c.id && (
                  <div className="px-10 pb-3 text-xs text-gray-500 space-y-0.5">
                    {c.sub   && <div><span className="text-gray-400">Sottotitolo:</span> {c.sub}</div>}
                    {c.via   && <div><span className="text-gray-400">Indirizzo:</span> {c.via}, {c.cap} {c.citta} ({c.prov})</div>}
                    {c.piva  && <div><span className="text-gray-400">P.IVA:</span> {c.piva}</div>}
                    {c.sdi   && <div><span className="text-gray-400">Cod. SDI:</span> {c.sdi}</div>}
                    {c.tel   && <div><span className="text-gray-400">Tel:</span> {c.tel}</div>}
                    {!c.via  && <div className="text-gray-400 italic">Nessun indirizzo inserito — il DDT userà le impostazioni generali.</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Il cliente predefinito viene preselezionato su ogni nuova bolla.
        Se il cliente ha indirizzo e P.IVA, vengono usati automaticamente nel DDT.
      </p>
    </div>
  );
}
