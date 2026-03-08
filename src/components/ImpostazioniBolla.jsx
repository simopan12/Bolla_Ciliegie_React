import { useState, useEffect } from "react";
import { Plus, Save, Trash2, CheckCircle, Star } from "lucide-react";
import {
  getClienti, createCliente, updateCliente, deleteCliente, setClientePredefinito,
  getMittenti, createMittente, updateMittente, deleteMittente, setMittentePredefinito,
} from "../api/tauriCommands";

// ─────────────────────────────────────────────
// Field helper
// ─────────────────────────────────────────────
function Field({ label, value, onChange, hint, maxLength, half }) {
  return (
    <div className={half ? "col-span-1" : ""}>
      <label className="label">{label}</label>
      <input
        className="input"
        value={value ?? ""}
        onChange={onChange}
        maxLength={maxLength}
      />
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
// Generic CRUD panel
// ─────────────────────────────────────────────
function CrudPanel({ title, items, emptyForm, fields, onSave, onDelete, onSetDefault }) {
  const [selected, setSelected] = useState(null); // id or null (null = new)
  const [form, setForm]         = useState(emptyForm);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState(null);

  function selectItem(item) {
    setSelected(item.id);
    setForm({ ...emptyForm, ...item });
    setError(null);
    setSaved(false);
  }

  function startNew() {
    setSelected(null);
    setForm(emptyForm);
    setError(null);
    setSaved(false);
  }

  function f(key) {
    return {
      value: form[key] ?? "",
      onChange: (e) => setForm((p) => ({ ...p, [key]: e.target.value })),
    };
  }

  async function handleSave() {
    setError(null);
    try {
      const newId = await onSave(selected, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      if (selected === null && newId) setSelected(newId);
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleDelete() {
    if (selected === null) return;
    setError(null);
    try {
      await onDelete(selected);
      setSelected(null);
      setForm(emptyForm);
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleDefault() {
    if (selected === null) return;
    try {
      await onSetDefault(selected);
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div className="card p-5 space-y-4 flex flex-col">
      <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b pb-2">
        {title}
      </h2>

      {/* Dropdown */}
      <div className="flex gap-2">
        <select
          className="input flex-1"
          value={selected ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "") {
              startNew();
            } else {
              const item = items.find((x) => x.id === Number(v));
              if (item) selectItem(item);
            }
          }}
        >
          <option value="">— Nuovo —</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}{item.predefinito === 1 ? " ★" : ""}
            </option>
          ))}
        </select>
        <button className="btn-secondary btn-sm" onClick={startNew} title="Nuovo">
          <Plus size={14} />
        </button>
      </div>

      {/* Form */}
      <div className="space-y-3 flex-1">
        {fields(f)}
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button className="btn-primary btn-sm" onClick={handleSave}>
          {saved ? <CheckCircle size={14} /> : <Save size={14} />}
          {saved ? "Salvato!" : selected === null ? "Crea" : "Salva"}
        </button>
        {selected !== null && (
          <>
            <button
              className="btn-secondary btn-sm"
              onClick={handleDefault}
              title="Imposta come predefinito"
            >
              <Star size={14} />
              Predefinito
            </button>
            <button className="btn-danger btn-sm" onClick={handleDelete}>
              <Trash2 size={14} />
              Elimina
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function ImpostazioniBolla() {
  const [clienti,  setClienti]  = useState([]);
  const [mittenti, setMittenti] = useState([]);

  async function reload() {
    const [c, m] = await Promise.all([getClienti(), getMittenti()]);
    setClienti(c);
    setMittenti(m);
  }

  useEffect(() => { reload(); }, []);

  // ── Clienti (destinatari) ──────────────────────────
  const EMPTY_CLIENTE = { nome: "", sub: "", via: "", cap: "", citta: "", prov: "", piva: "", tel: "", sdi: "" };

  function clienteFields(f) {
    return (
      <div className="space-y-2">
        <Field label="Nome / Ragione Sociale *" {...f("nome")} />
        <Field label="Sottotitolo" {...f("sub")} hint='es. "A SOCIO UNICO"' />
        <Field label="Via e numero civico" {...f("via")} />
        <div className="grid grid-cols-[80px_1fr_52px] gap-2">
          <Field label="CAP" {...f("cap")} />
          <Field label="Città" {...f("citta")} />
          <Field label="Prov." {...f("prov")} maxLength={2} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="P.IVA" {...f("piva")} />
          <Field label="Cod. SDI" {...f("sdi")} />
        </div>
        <Field label="Telefono" {...f("tel")} />
      </div>
    );
  }

  async function saveCliente(id, form) {
    const payload = {
      nome: form.nome, sub: form.sub || null, via: form.via || null,
      cap: form.cap || null, citta: form.citta || null, prov: form.prov || null,
      piva: form.piva || null, tel: form.tel || null, sdi: form.sdi || null,
    };
    let newId = null;
    if (id === null) {
      newId = await createCliente(payload);
    } else {
      await updateCliente(id, payload);
    }
    await reload();
    return newId;
  }

  async function removeCliente(id) {
    await deleteCliente(id);
    await reload();
  }

  async function defaultCliente(id) {
    await setClientePredefinito(id);
    await reload();
  }

  // ── Mittenti ──────────────────────────────────────
  const EMPTY_MITTENTE = { nome: "", via: "", cap: "", citta: "", prov: "", piva: "", cf: "", tel: "", email: "" };

  function mittenteFields(f) {
    return (
      <div className="space-y-2">
        <Field label="Nome / Ragione Sociale *" {...f("nome")} />
        <Field label="Via e numero civico" {...f("via")} />
        <div className="grid grid-cols-[80px_1fr_52px] gap-2">
          <Field label="CAP" {...f("cap")} />
          <Field label="Città" {...f("citta")} />
          <Field label="Prov." {...f("prov")} maxLength={2} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="P.IVA" {...f("piva")} />
          <Field label="Codice Fiscale" {...f("cf")} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Telefono" {...f("tel")} />
          <Field label="Email" {...f("email")} />
        </div>
      </div>
    );
  }

  async function saveMittente(id, form) {
    const payload = {
      nome: form.nome, via: form.via || null, cap: form.cap || null,
      citta: form.citta || null, prov: form.prov || null, piva: form.piva || null,
      cf: form.cf || null, tel: form.tel || null, email: form.email || null,
    };
    let newId = null;
    if (id === null) {
      newId = await createMittente(payload);
    } else {
      await updateMittente(id, payload);
    }
    await reload();
    return newId;
  }

  async function removeMittente(id) {
    await deleteMittente(id);
    await reload();
  }

  async function defaultMittente(id) {
    await setMittentePredefinito(id);
    await reload();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Impostazioni Bolla</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <CrudPanel
          title="Mittenti"
          items={mittenti}
          emptyForm={EMPTY_MITTENTE}
          fields={mittenteFields}
          onSave={saveMittente}
          onDelete={removeMittente}
          onSetDefault={defaultMittente}
        />
        <CrudPanel
          title="Clienti / Destinatari"
          items={clienti}
          emptyForm={EMPTY_CLIENTE}
          fields={clienteFields}
          onSave={saveCliente}
          onDelete={removeCliente}
          onSetDefault={defaultCliente}
        />
      </div>
    </div>
  );
}
