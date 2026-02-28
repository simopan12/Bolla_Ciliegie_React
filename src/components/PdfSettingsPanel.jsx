import { useState } from "react";
import { X, Save, RotateCcw, CheckCircle, FileText } from "lucide-react";
import {
  getMittente,
  getDestinatario,
  saveMittente,
  saveDestinatario,
  DEFAULT_MITTENTE,
  DEFAULT_DESTINATARIO,
} from "../utils/generateDDT";

// ─────────────────────────────────────────────
// Componente campo editabile — aspetto "testo su carta"
// ─────────────────────────────────────────────
function DocInput({ value, onChange, bold, placeholder, width }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder ?? ""}
      title="Clicca per modificare"
      style={{
        background: "transparent",
        border: "none",
        borderBottom: "1.5px dashed #c0c8d0",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "9pt",
        fontWeight: bold ? "bold" : "normal",
        lineHeight: "1.65",
        padding: "0 3px",
        outline: "none",
        width: width ?? "100%",
        display: "block",
        boxSizing: "border-box",
        transition: "border-color 0.15s, background 0.15s",
        cursor: "text",
        color: "#000",
      }}
      onFocus={(e) => {
        e.target.style.borderBottomColor = "#2563eb";
        e.target.style.background = "rgba(37,99,235,0.04)";
      }}
      onBlur={(e) => {
        e.target.style.borderBottomColor = "#c0c8d0";
        e.target.style.background = "transparent";
      }}
    />
  );
}

// Riga con label in grassetto + input inline
function DocLabeledInput({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "4px", lineHeight: "1.65" }}>
      <span style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "9pt", fontWeight: "bold", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        style={{
          background: "transparent",
          border: "none",
          borderBottom: "1.5px dashed #c0c8d0",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "9pt",
          lineHeight: "1.65",
          padding: "0 3px",
          outline: "none",
          flex: 1,
          minWidth: 0,
          cursor: "text",
          color: "#000",
          transition: "border-color 0.15s, background 0.15s",
        }}
        onFocus={(e) => {
          e.target.style.borderBottomColor = "#2563eb";
          e.target.style.background = "rgba(37,99,235,0.04)";
        }}
        onBlur={(e) => {
          e.target.style.borderBottomColor = "#c0c8d0";
          e.target.style.background = "transparent";
        }}
      />
    </div>
  );
}

// Riga indirizzo: CAP + Città + (Prov)
function AddressRow({ cap, citta, prov, onChangeCap, onChangeCitta, onChangeProv }) {
  const inlineStyle = (w) => ({
    background: "transparent",
    border: "none",
    borderBottom: "1.5px dashed #c0c8d0",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "9pt",
    lineHeight: "1.65",
    padding: "0 3px",
    outline: "none",
    width: w,
    cursor: "text",
    color: "#000",
    transition: "border-color 0.15s, background 0.15s",
  });
  const focusH = (e) => {
    e.target.style.borderBottomColor = "#2563eb";
    e.target.style.background = "rgba(37,99,235,0.04)";
  };
  const blurH = (e) => {
    e.target.style.borderBottomColor = "#c0c8d0";
    e.target.style.background = "transparent";
  };
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "3px", lineHeight: "1.65", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "9pt" }}>
      <input type="text" value={cap}   onChange={onChangeCap}   style={inlineStyle("52px")} onFocus={focusH} onBlur={blurH} title="CAP" />
      <input type="text" value={citta} onChange={onChangeCitta} style={{ ...inlineStyle("1px"), flex: 1 }} onFocus={focusH} onBlur={blurH} title="Città" />
      <span>(</span>
      <input type="text" value={prov}  onChange={onChangeProv}  style={inlineStyle("22px")} onFocus={focusH} onBlur={blurH} title="Provincia" />
      <span>)</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Pannello principale
// ─────────────────────────────────────────────
export default function PdfSettingsPanel({ onClose }) {
  const [mit, setMit] = useState(getMittente());
  const [dst, setDst] = useState(getDestinatario());
  const [saved, setSaved] = useState(false);

  function m(key) {
    return {
      value: mit[key] ?? "",
      onChange: (e) => setMit((p) => ({ ...p, [key]: e.target.value })),
    };
  }
  function d(key) {
    return {
      value: dst[key] ?? "",
      onChange: (e) => setDst((p) => ({ ...p, [key]: e.target.value })),
    };
  }

  function handleSave() {
    saveMittente(mit);
    saveDestinatario(dst);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    if (window.confirm("Ripristinare i valori predefiniti per Mittente e Destinatario?")) {
      setMit({ ...DEFAULT_MITTENTE });
      setDst({ ...DEFAULT_DESTINATARIO });
    }
  }

  // stile testo fisso nel documento (non editabile)
  const docTxt = {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "9pt",
    lineHeight: "1.65",
    color: "#000",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        display: "flex", flexDirection: "column",
        background: "rgba(15,20,25,0.88)",
      }}
    >
      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div
        style={{
          background: "#1e1e1e", color: "#fff",
          padding: "8px 16px",
          display: "flex", alignItems: "center", gap: "10px",
          fontFamily: "Arial, Helvetica, sans-serif", fontSize: "9.5pt",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: "#444", color: "#fff", border: "none",
            padding: "5px 14px", cursor: "pointer", fontSize: "9.5pt",
            fontFamily: "Arial", borderRadius: "3px",
          }}
        >
          ✕ Chiudi
        </button>
        <button
          onClick={handleSave}
          style={{
            background: "#2563eb", color: "#fff", border: "none",
            padding: "5px 18px", cursor: "pointer", fontSize: "9.5pt",
            fontFamily: "Arial", fontWeight: "bold", borderRadius: "3px",
          }}
        >
          💾 Salva Modifiche
        </button>
        <button
          onClick={handleReset}
          style={{
            background: "#555", color: "#ddd", border: "none",
            padding: "5px 14px", cursor: "pointer", fontSize: "9pt",
            fontFamily: "Arial", borderRadius: "3px",
          }}
        >
          ↺ Default
        </button>
        <span style={{ color: "#888", fontSize: "8pt", marginLeft: "8px" }}>
          I campi sottolineati sono modificabili — clicca per editare
        </span>
        {saved && (
          <span style={{ marginLeft: "auto", color: "#4ade80", fontWeight: "bold", fontSize: "9.5pt" }}>
            ✓ Salvato!
          </span>
        )}
      </div>

      {/* ── Area carta scorrevole ─────────────────────────────────── */}
      <div
        style={{
          flex: 1, overflowY: "auto",
          display: "flex", justifyContent: "center", alignItems: "flex-start",
          padding: "32px 16px",
        }}
      >
        {/* Foglio A4 simulato */}
        <div
          style={{
            background: "#fff",
            width: "185mm",
            boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
            padding: "8mm 0 12mm",
            position: "relative",
          }}
        >
          {/* Watermark "MODIFICA" */}
          <div
            style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%) rotate(-35deg)",
              fontSize: "60pt", fontWeight: "bold",
              color: "rgba(37,99,235,0.04)",
              fontFamily: "Arial", whiteSpace: "nowrap",
              pointerEvents: "none", userSelect: "none", zIndex: 0,
            }}
          >
            MODIFICA
          </div>

          <div style={{ padding: "0 8mm", position: "relative", zIndex: 1 }}>

            {/* ── Header nero ─────────────────────────────────── */}
            <div style={{
              background: "#000", color: "#fff",
              textAlign: "center", padding: "8px 10px",
              fontSize: "14pt", fontWeight: "bold",
              letterSpacing: "2px", textTransform: "uppercase",
              marginBottom: "6px",
            }}>
              Documento di Trasporto
            </div>

            {/* ── Due colonne ──────────────────────────────────── */}
            <div style={{ display: "flex", gap: "5px", marginBottom: "5px" }}>

              {/* Colonna sinistra — Mittente */}
              <div style={{
                flex: "1.2",
                border: "1px solid #000",
                padding: "5px 7px",
                minHeight: "55mm",
              }}>
                <div style={{
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: "9.5pt", fontWeight: "bold",
                  textTransform: "uppercase",
                  borderBottom: "1px solid #000",
                  paddingBottom: "2px", marginBottom: "4px",
                }}>
                  Mittente
                </div>

                <DocInput bold {...m("nome")} placeholder="Nome / Ragione Sociale" />
                <DocInput {...m("via")} placeholder="Via e numero civico" />
                <AddressRow
                  cap={mit.cap} citta={mit.citta} prov={mit.prov}
                  onChangeCap={(e) => setMit((p) => ({ ...p, cap: e.target.value }))}
                  onChangeCitta={(e) => setMit((p) => ({ ...p, citta: e.target.value }))}
                  onChangeProv={(e) => setMit((p) => ({ ...p, prov: e.target.value }))}
                />
                <DocLabeledInput label="Email:" {...m("email")} />
                <DocLabeledInput label="P.IVA:" {...m("piva")} />
                <DocLabeledInput label="C.F.:" {...m("cf")} />
                <DocLabeledInput label="Tel:" {...m("tel")} />
              </div>

              {/* Colonna destra */}
              <div style={{ flex: "0.8", display: "flex", flexDirection: "column", gap: "5px" }}>

                {/* Box documento — non editabile */}
                <div style={{
                  border: "1px solid #000",
                  padding: "5px 7px",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: "9pt",
                }}>
                  <div style={{
                    fontWeight: "bold", textAlign: "center",
                    fontSize: "10pt", textTransform: "uppercase", marginBottom: "6px",
                  }}>
                    Documento di Trasporto
                  </div>
                  <div style={{ color: "#888", fontSize: "8pt", fontFamily: "Arial", textAlign: "center" }}>
                    <FileText size={12} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
                    N° e Data generati automaticamente
                  </div>
                </div>

                {/* Box Destinatario */}
                <div style={{
                  flex: 1,
                  border: "1px solid #000",
                  padding: "5px 7px",
                }}>
                  <div style={{
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: "9.5pt", fontWeight: "bold",
                    textTransform: "uppercase",
                    borderBottom: "1px solid #000",
                    paddingBottom: "2px", marginBottom: "4px",
                  }}>
                    Destinatario
                  </div>

                  <DocInput bold {...d("nome")} placeholder="Nome / Ragione Sociale" />
                  <DocInput {...d("sub")} placeholder="Sottotitolo (opzionale)" />
                  <DocInput {...d("via")} placeholder="Via e numero civico" />
                  <AddressRow
                    cap={dst.cap} citta={dst.citta} prov={dst.prov}
                    onChangeCap={(e) => setDst((p) => ({ ...p, cap: e.target.value }))}
                    onChangeCitta={(e) => setDst((p) => ({ ...p, citta: e.target.value }))}
                    onChangeProv={(e) => setDst((p) => ({ ...p, prov: e.target.value }))}
                  />
                  <DocLabeledInput label="P.IVA:" {...d("piva")} />
                  <DocLabeledInput label="Cod. SDI:" {...d("sdi")} />
                  <DocLabeledInput label="Tel:" {...d("tel")} />
                </div>
              </div>
            </div>

            {/* ── Causale — non editabile (informativo) ─────────── */}
            <div style={{
              display: "flex", border: "1px solid #000",
              marginBottom: "5px",
              fontFamily: "Arial, Helvetica, sans-serif", fontSize: "9pt",
            }}>
              <div style={{ flex: 1, padding: "4px 7px", lineHeight: "1.8" }}>
                Causale del Trasporto: <strong>VENDITA</strong>
              </div>
              <div style={{ flex: 1, padding: "4px 7px", lineHeight: "1.8", borderLeft: "1px solid #000" }}>
                Mezzo di Trasporto: <strong>MITTENTE</strong>
              </div>
            </div>

            {/* ── Nota informativa ─────────────────────────────────── */}
            <div style={{
              background: "#f0f7ff", border: "1px solid #93c5fd",
              borderRadius: "4px", padding: "8px 12px",
              fontFamily: "Arial, Helvetica, sans-serif", fontSize: "8.5pt",
              color: "#1e40af", lineHeight: "1.5",
            }}>
              <strong>ℹ Nota:</strong> La tabella prodotti, i totali e le firme vengono generati automaticamente
              dalle bolle — non sono modificabili qui.
              Solo Mittente e Destinatario sono personalizzabili e vengono salvati per tutte le stampe future.
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
