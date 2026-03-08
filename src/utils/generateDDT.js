import { formatDate, formatDateTime } from "./formatters";
import { SPECIAL_VARIETIES } from "../components/BollaForm";

// ─────────────────────────────────────────────
// Dati fissi di default — usati se non override in localStorage
// ─────────────────────────────────────────────
// NOTA: questi valori di default sono vuoti — configura mittente e destinatario
// direttamente dall'app (sezione Impostazioni). I dati vengono salvati in localStorage.
export const DEFAULT_MITTENTE = {
  nome:  "",
  via:   "",
  cap:   "",
  citta: "",
  prov:  "",
  email: "",
  piva:  "",
  cf:    "",
  tel:   "",
};

export const DEFAULT_DESTINATARIO = {
  nome:  "",
  sub:   "",
  via:   "",
  cap:   "",
  citta: "",
  prov:  "",
  piva:  "",
  tel:   "",
  sdi:   "",
};

const LS_MIT = "ddt_mittente";
const LS_DST = "ddt_destinatario";

export function getMittente() {
  try {
    const s = localStorage.getItem(LS_MIT);
    return s ? { ...DEFAULT_MITTENTE, ...JSON.parse(s) } : { ...DEFAULT_MITTENTE };
  } catch {
    return { ...DEFAULT_MITTENTE };
  }
}

export function getDestinatario() {
  try {
    const s = localStorage.getItem(LS_DST);
    return s ? { ...DEFAULT_DESTINATARIO, ...JSON.parse(s) } : { ...DEFAULT_DESTINATARIO };
  } catch {
    return { ...DEFAULT_DESTINATARIO };
  }
}

export function saveMittente(data) {
  localStorage.setItem(LS_MIT, JSON.stringify(data));
}

export function saveDestinatario(data) {
  localStorage.setItem(LS_DST, JSON.stringify(data));
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function h(s) {
  if (!s && s !== 0) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function n(val, d = 2) {
  if (val == null || isNaN(Number(val))) return "";
  return Number(val).toFixed(d).replace(".", ",");
}

// KG: se intero stampa senza decimali, altrimenti 2 decimali
function kg(val) {
  if (val == null || isNaN(Number(val))) return "";
  const num = Number(val);
  const isInt = Math.abs(num - Math.round(num)) < 1e-9;
  return isInt ? String(Math.round(num)) : n(num, 2);
}

function isSpecial(variety) {
  return SPECIAL_VARIETIES.includes(variety);
}

// ─────────────────────────────────────────────
// Contenuto DDT
// ─────────────────────────────────────────────
function buildContent(bolla) {
  // Mittente: usa snap DB se presente, altrimenti fallback localStorage (vecchie bolle)
  const m = bolla.mittente;
  const mitDefault = getMittente();
  const MITTENTE = m
    ? { nome: m.nome ?? "", via: m.via ?? "", cap: m.cap ?? "", citta: m.citta ?? "",
        prov: m.prov ?? "", piva: m.piva ?? "", cf: m.cf ?? "", tel: m.tel ?? "", email: m.email ?? "" }
    : mitDefault;

  // Destinatario: usa snap dal cliente selezionato; fallback alle impostazioni globali
  const c = bolla.cliente;
  const DESTINATARIO = (c && c.nome)
    ? { nome: c.nome, sub: c.sub ?? "", via: c.via ?? "", cap: c.cap ?? "", citta: c.citta ?? "", prov: c.prov ?? "", piva: c.piva ?? "", tel: c.tel ?? "", sdi: c.sdi ?? "" }
    : getDestinatario();

  const righe = bolla.righe || [];
  const numStr = String(bolla.progressiveNumber).padStart(4, "0");
  const dataDDT = formatDate(bolla.emissionDate);
  const pickup = bolla.pickupDatetime ? formatDateTime(bolla.pickupDatetime) : "";

  // Determine if post-sale (specials have kg)
  const isPostSale = bolla.state !== "NON_STAMPATA";

  // Build product rows (3 colonne: padelle, descrizione, quantita)
  const prodRows = righe
    .map((r) => {
      const spec = isSpecial(r.variety);

      // Colonna 1: N° padelle vendute
      const padelle = r.numPadelle ?? "";

      // Colonna 3: Quantita (KG X) solo se va mostrata
      const showKg = !spec || (spec && isPostSale && Number(r.kg) > 0);
      const kgCell = showKg ? `KG ${kg(r.kg)}` : "";

      // Colonna 2: descrizione TUTTO SU UNA SOLA RIGA per varieta standard
      const descCell = spec
        ? h(r.variety)
        : `Padelle duroni ${h(r.variety)}<br><strong>Prodotto destinato all'IGP</strong>${
            r.harvestDate ? `<br>Data raccolta ${formatDate(r.harvestDate)}` : ""
          }`;

      return `
        <tr>
          <td class="col-pad">${h(padelle)}</td>
          <td class="col-desc">${descCell}</td>
          <td class="col-qty">${kgCell}</td>
        </tr>`;
    })
    .join("");

  // Total KG
  const stdKg = righe
    .filter((r) => !isSpecial(r.variety))
    .reduce((s, r) => s + (Number(r.kg) || 0), 0);

  const specKg = righe
    .filter((r) => isSpecial(r.variety))
    .reduce((s, r) => s + (Number(r.kg) || 0), 0);

  const totalKg = isPostSale ? stdKg + specKg : stdKg;

  // Valore numerico (senza "KG" davanti) per evitare "KG KG"
  const totalKgValue =
    isPostSale || specKg === 0 ? `${kg(totalKg)}` : `${kg(stdKg)} *`;

  // Totale padelle (N° Colli)
  const totalPadelle = righe.reduce((s, r) => s + (Number(r.numPadelle) || 0), 0);

  return `
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;font-size:10pt;color:#000;background:#fff}

.ddt-page{
  width:185mm;
  margin:0 auto;
  padding:8mm 0 4mm;
}

@media print{
  .ddt-page{padding:0;width:100%}
  @page{size:A4 portrait;margin:10mm 12mm}
}

/* Fascia nera */
.ddt-header{
  background:#000;
  color:#fff;
  text-align:center;
  padding:8px 10px;
  font-size:14pt;
  font-weight:bold;
  letter-spacing:2px;
  text-transform:uppercase;
  margin-bottom:6px;
}

/* Layout due colonne */
.two-col{display:flex;gap:5px;margin-bottom:5px}
.col-left{flex:1.2}
.col-right{flex:0.8;display:flex;flex-direction:column;gap:5px}

/* Box generici */
.box{border:1px solid #000;font-size:9pt;line-height:1.6;padding:5px 7px}
.box-title{font-weight:bold;font-size:9.5pt;text-transform:uppercase;margin-bottom:3px;border-bottom:1px solid #000;padding-bottom:2px}
.box-sep{border-top:1px solid #ccc;margin:3px 0}

/* Doc box */
.doc-box{font-size:9pt;padding:5px 7px}
.doc-box .doc-title{font-weight:bold;text-align:center;font-size:10pt;text-transform:uppercase;margin-bottom:4px}

/* N.: 0001 20/06/2026 su una riga */
.doc-inline{
  display:flex;
  align-items:baseline;
  gap:10px;
  font-weight:bold;
  font-size:9.5pt;
}
.doc-lbl{font-weight:bold}
.doc-num{font-weight:bold}
.doc-date{font-weight:bold}

/* Causale */
.causale-box{display:flex;border:1px solid #000;margin-bottom:5px}
.caus-cell{flex:1;padding:4px 7px;font-size:9pt;line-height:1.8}
.caus-cell+.caus-cell{border-left:1px solid #000}

/* Tabella prodotti */
.prod-table{width:100%;border-collapse:collapse;margin-bottom:5px;font-size:9pt}
.prod-table th{
  background:#e0e0e0;
  border:1px solid #000;
  padding:4px 6px;
  font-weight:bold;
  font-size:9pt;
}
.th-l{text-align:left}
.th-c{text-align:center}
.th-r{text-align:right}
.prod-table td{border:1px solid #000;padding:3px 6px}

/* 3 colonne: padelle, descrizione, quantita */
.col-pad{width:12%;text-align:center}
.col-desc{width:73%;text-align:left}
.col-qty{width:15%;text-align:right}

.tot-row td{
  font-weight:bold;
  font-size:10pt;
  background:#f4f4f4;
  padding:4px 6px;
  border:1px solid #000;
}
.tot-cell{
  text-align:right;
  font-weight:bold;
}

/* Info boxes */
.info-row{display:flex;gap:5px;margin-bottom:5px}
.info-box{flex:1;border:1px solid #000;padding:4px 7px;font-size:9pt;min-height:14mm}
.info-box-title{font-weight:bold;font-size:8.5pt;text-transform:uppercase;margin-bottom:2px}

/* Note */
.note-box{border:1px solid #000;padding:5px 7px;margin-bottom:5px;min-height:50mm;font-size:9pt}
.note-title{font-weight:bold;margin-bottom:4px}

/* Firme */
.firma-row{display:flex;gap:5px}
.firma-box{flex:1;border:1px solid #000;padding:5px 7px;min-height:28mm;font-size:9pt}
.firma-title{font-weight:bold;text-transform:uppercase;font-size:9pt}
</style>

<div class="ddt-page">

  <div class="ddt-header">Documento di Trasporto</div>

  <div class="two-col">
    <div class="col-left">
      <div class="box" style="height:100%">
        <div class="box-title">Mittente</div>
        <div><strong>${h(MITTENTE.nome)}</strong></div>
        <div>${h(MITTENTE.via)}</div>
        <div>${h(MITTENTE.cap)} ${h(MITTENTE.citta)} (${h(MITTENTE.prov)})</div>
        <div><strong>Email:</strong> ${h(MITTENTE.email)}</div>
        <div><strong>P.IVA:</strong> ${h(MITTENTE.piva)}</div>
        <div><strong>C.F.:</strong> ${h(MITTENTE.cf)}</div>
        <div><strong>Tel:</strong> ${h(MITTENTE.tel)}</div>
      </div>
    </div>

    <div class="col-right">
      <div class="box doc-box">
        <div class="doc-title">Documento di Trasporto</div>
        <div class="doc-inline">
          <span class="doc-lbl">N.:</span>
          <span class="doc-num">${numStr}</span>
          <span class="doc-date">${dataDDT}</span>
        </div>
      </div>

      <div class="box" style="flex:1">
        <div class="box-title">Destinatario</div>
        <div><strong>${h(DESTINATARIO.nome)}</strong></div>
        ${DESTINATARIO.sub ? `<div>${h(DESTINATARIO.sub)}</div>` : ""}
        <div>${h(DESTINATARIO.via)}</div>
        <div>${h(DESTINATARIO.cap)} ${h(DESTINATARIO.citta)} (${h(DESTINATARIO.prov)})</div>
        <div><strong>P.IVA:</strong> ${h(DESTINATARIO.piva)}</div>
        <div><strong>Cod. SDI:</strong> ${h(DESTINATARIO.sdi)}</div>
        <div><strong>Tel:</strong> ${h(DESTINATARIO.tel)}</div>
      </div>
    </div>
  </div>

  <div class="causale-box">
    <div class="caus-cell">Causale del Trasporto: <strong>VENDITA</strong></div>
    <div class="caus-cell">Mezzo di Trasporto: <strong>MITTENTE</strong></div>
  </div>

  <table class="prod-table">
    <thead>
      <tr>
        <th class="th-c">N&#176; padelle</th>
        <th class="th-l">Descrizione dei Beni</th>
        <th class="th-r">Quantit&#224;</th>
      </tr>
    </thead>
    <tbody>
      ${prodRows}
      <tr class="tot-row">
        <td colspan="2"></td>
        <td class="tot-cell">TOTALE KG ${h(totalKgValue)}</td>
      </tr>
    </tbody>
  </table>

  <div class="info-row">
    <div class="info-box">
      <div class="info-box-title">Luogo di Destinazione</div>
      <div>Sede del Destinatario</div>
    </div>
    <div class="info-box">
      <div class="info-box-title">Trasporto a Mezzo</div>
      <div>Mittente</div>
    </div>
  </div>

  <div class="info-row">
    <div class="info-box" style="flex:2">
      <div class="info-box-title">Data e Ora Ritiro</div>
      <div>${h(pickup)}</div>
    </div>
    <div class="info-box" style="flex:1">
      <div class="info-box-title">N&#176; Colli</div>
      <div>${totalPadelle > 0 ? h(totalPadelle) : ""}</div>
    </div>
  </div>

  <div class="note-box">
    <div class="note-title">Annotazioni:</div>
    <div>${bolla.notes ? h(bolla.notes) : ""}</div>
  </div>

  <div class="firma-row">
    <div class="firma-box">
      <div class="firma-title">Firma Mittente</div>
    </div>
    <div class="firma-box">
      <div class="firma-title">Firma Destinatario</div>
    </div>
  </div>

</div>`;
}

// ─────────────────────────────────────────────
// Export pubblico
// ─────────────────────────────────────────────
const OVERLAY_ID = "ddt-print-overlay";
const STYLE_ID = "ddt-print-style";

export function generateDDT(bolla) {
  document.getElementById(OVERLAY_ID)?.remove();
  document.getElementById(STYLE_ID)?.remove();

  const printStyle = document.createElement("style");
  printStyle.id = STYLE_ID;
  printStyle.textContent = `
    @media print {
      body > *:not(#${OVERLAY_ID}) {
        display: none !important;
        visibility: hidden !important;
      }
      #${OVERLAY_ID} {
        display: block !important;
        position: static !important;
        overflow: visible !important;
        height: auto !important;
      }
      #${OVERLAY_ID} .ddt-pbar {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(printStyle);

  const pbar = `
    <div class="ddt-pbar" style="
      position:sticky;top:0;z-index:9999;
      background:#1e1e1e;color:#fff;
      padding:7px 14px;
      display:flex;align-items:center;gap:10px;
      font-family:Arial,Helvetica,sans-serif;font-size:9pt;
    ">
      <button
        onclick="document.getElementById('${OVERLAY_ID}').remove();document.getElementById('${STYLE_ID}').remove();"
        style="background:#555;color:#fff;border:none;padding:5px 14px;
               font-size:9.5pt;font-family:Arial;cursor:pointer;">
        &#x2715; Chiudi
      </button>
      <button
        onclick="window.print()"
        style="background:#fff;color:#000;border:none;padding:5px 18px;
               font-size:9.5pt;font-family:Arial;cursor:pointer;font-weight:bold;">
        &#128424; Stampa / Salva PDF
      </button>
      <span style="font-size:7.5pt;color:#aaa;">
        Nel dialogo di stampa seleziona &ldquo;Salva come PDF&rdquo;
      </span>
    </div>`;

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.style.cssText =
    "position:fixed;top:0;left:0;right:0;bottom:0;" +
    "z-index:9998;background:white;overflow-y:auto;";
  overlay.innerHTML = pbar + buildContent(bolla);
  document.body.appendChild(overlay);

  return `DDT_bolla_${bolla.progressiveNumber}`;
}
