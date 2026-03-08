import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Printer, DollarSign, Pencil, Trash2,
  RefreshCw, AlertCircle, Plus, Check,
} from "lucide-react";
import { getBolle, deleteBolla, confirmBolla } from "../api/tauriCommands";
import { generateDDT } from "../utils/generateDDT";
import { formatDate, formatKg, formatEuro } from "../utils/formatters";
import PriceModal from "./PriceModal";
import ConfirmDialog from "./ConfirmDialog";

// ── Stats bar ───────────────────────────────────────────────────
function StatsBar({ bolle }) {
  const now = new Date();
  const yyyyMM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const nonStampate = bolle.filter((b) => b.state === "NON_STAMPATA").length;
  const inAttesa    = bolle.filter((b) => b.state === "IN_ATTESA").length;

  const confermateMese = bolle.filter(
    (b) => b.state === "CONFERMATA" && b.emissionDate?.slice(0, 7) === yyyyMM
  );
  const kgMese     = confermateMese.reduce((s, b) => s + b.totalKg, 0);
  const ricavoMese = confermateMese.reduce((s, b) => s + (b.totalRevenue ?? 0), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="card p-3 flex flex-col gap-0.5">
        <span className="text-xs text-gray-400 uppercase tracking-wide">Non stampate</span>
        <span className={`text-2xl font-bold ${nonStampate > 0 ? "text-red-600" : "text-gray-300"}`}>
          {nonStampate}
        </span>
      </div>
      <div className="card p-3 flex flex-col gap-0.5">
        <span className="text-xs text-gray-400 uppercase tracking-wide">In attesa</span>
        <span className={`text-2xl font-bold ${inAttesa > 0 ? "text-amber-500" : "text-gray-300"}`}>
          {inAttesa}
        </span>
      </div>
      <div className="card p-3 flex flex-col gap-0.5">
        <span className="text-xs text-gray-400 uppercase tracking-wide">KG confermati (mese)</span>
        <span className="text-2xl font-bold text-sage-700">
          {kgMese > 0 ? formatKg(kgMese) : "—"}
        </span>
      </div>
      <div className="card p-3 flex flex-col gap-0.5">
        <span className="text-xs text-gray-400 uppercase tracking-wide">Ricavo confermato (mese)</span>
        <span className="text-2xl font-bold text-sage-700">
          {ricavoMese > 0 ? formatEuro(ricavoMese) : "—"}
        </span>
      </div>
    </div>
  );
}

// ── State badge ─────────────────────────────────────────────────
function StateBadge({ state }) {
  const map = {
    NON_STAMPATA: ["badge-red",   "Non Stampata"],
    IN_ATTESA:    ["badge-amber", "In Attesa"],
    CONFERMATA:   ["badge-green", "Confermata"],
  };
  const [cls, label] = map[state] ?? ["badge-gray", state];
  return <span className={cls}>{label}</span>;
}

// ── Main component ───────────────────────────────────────────────
export default function BolleList() {
  const navigate = useNavigate();
  const [bolle, setBolle] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // Price modal
  const [priceModalBolla, setPriceModalBolla] = useState(null);

  // PDF settings panel

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError,  setDeleteError]  = useState(null);

  // Confirm loading
  const [confirmingId, setConfirmingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBolle();
      setBolle(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Actions ─────────────────────────────────────────────────────
  function handlePrint(bolla) {
    generateDDT(bolla);
  }

  async function handleConfirm(bolla) {
    setConfirmingId(bolla.id);
    try {
      await confirmBolla(bolla.id);
      await load();
    } catch (e) {
      alert("Errore durante la conferma: " + e);
    } finally {
      setConfirmingId(null);
    }
  }

  function handleDeleteRequest(bolla) {
    setDeleteTarget(bolla);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteBolla(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setDeleteError(String(e));
    }
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Elenco Bolle</h1>
        <div className="flex gap-2">
          <button className="btn-secondary btn-sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Aggiorna
          </button>
          <button className="btn-primary" onClick={() => navigate("/nuova")}>
            <Plus size={15} />
            Nuova Bolla
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {!loading && bolle.length > 0 && <StatsBar bolle={bolle} />}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Table card */}
      <div className="card overflow-hidden">
        {loading && bolle.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-400">
            <RefreshCw size={20} className="animate-spin mr-2" />
            Caricamento…
          </div>
        ) : bolle.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <span className="text-4xl mb-2">🍒</span>
            <p className="text-sm">Nessuna bolla presente. Crea la prima!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">N°</th>
                  <th className="px-4 py-3 text-left">Data Emissione</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-right">Totale KG</th>
                  <th className="px-4 py-3 text-center">Stato</th>
                  <th className="px-4 py-3 text-right">Ricavo</th>
                  <th className="px-4 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bolle.map((b) => {
                  const isSelected = b.id === selectedId;
                  return (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedId(isSelected ? null : b.id)}
                      className={`table-row-hover ${isSelected ? "table-row-selected" : ""}`}
                    >
                      <td className="px-4 py-3 font-semibold text-sage-700">
                        #{b.progressiveNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatDate(b.emissionDate)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {b.cliente?.nome ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatKg(b.totalKg)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StateBadge state={b.state} />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-sage-700">
                        {b.totalRevenue ? formatEuro(b.totalRevenue) : "—"}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">

                          {/* Stampa DDT — sempre disponibile */}
                          <button
                            title="Stampa DDT"
                            className="btn-secondary btn-sm"
                            onClick={() => handlePrint(b)}
                          >
                            <Printer size={13} />
                          </button>

                          {/* Prezzi — tutte le bolle */}
                          <button
                            title="Inserisci / Modifica Prezzi"
                            className="btn-amber btn-sm"
                            onClick={() => setPriceModalBolla(b)}
                          >
                            <DollarSign size={13} />
                          </button>

                          {/* Modifica — tutte le bolle */}
                          <button
                            title="Modifica"
                            className="btn-secondary btn-sm"
                            onClick={() => navigate(`/modifica/${b.id}`)}
                          >
                            <Pencil size={13} />
                          </button>

                          {/* Conferma — solo se non ancora confermata */}
                          {b.state !== "CONFERMATA" && (
                            <button
                              title="Conferma Bolla"
                              className="btn-green btn-sm"
                              disabled={confirmingId === b.id}
                              onClick={() => handleConfirm(b)}
                            >
                              {confirmingId === b.id ? (
                                <RefreshCw size={13} className="animate-spin" />
                              ) : (
                                <Check size={13} />
                              )}
                            </button>
                          )}

                          {/* Elimina — tutte le bolle */}
                          <button
                            title="Elimina"
                            className="btn-danger btn-sm"
                            onClick={() => handleDeleteRequest(b)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Table footer — totals */}
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200 text-sm font-semibold">
                  <td colSpan={3} className="px-4 py-2 text-gray-600">
                    Totali ({bolle.length} bolle)
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatKg(bolle.reduce((s, b) => s + b.totalKg, 0))}
                  </td>
                  <td />
                  <td className="px-4 py-2 text-right text-sage-700">
                    {formatEuro(bolle.reduce((s, b) => s + (b.totalRevenue ?? 0), 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Selected bolla detail panel */}
      {selectedId && (() => {
        const b = bolle.find((x) => x.id === selectedId);
        if (!b) return null;
        return (
          <div className="card p-4">
            <h2 className="font-semibold text-gray-700 mb-3">
              Dettaglio Bolla #{b.progressiveNumber}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase text-gray-500 border-b">
                    <th className="pb-2 text-left">Varietà</th>
                    <th className="pb-2 text-left">Data Raccolta</th>
                    <th className="pb-2 text-right">KG</th>
                    <th className="pb-2 text-right">Prezzo/KG</th>
                    <th className="pb-2 text-right">Ricavo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {b.righe.map((r) => (
                    <tr key={r.id}>
                      <td className="py-1.5 font-medium">{r.variety}</td>
                      <td className="py-1.5 text-gray-500 text-xs">
                        {r.harvestDate ? formatDate(r.harvestDate) : "—"}
                      </td>
                      <td className="py-1.5 text-right">
                        {r.kg > 0 ? formatKg(r.kg) : "—"}
                      </td>
                      <td className="py-1.5 text-right">
                        {r.pricePerKg != null ? formatEuro(r.pricePerKg) : "—"}
                      </td>
                      <td className="py-1.5 text-right text-sage-700">
                        {r.revenue != null ? formatEuro(r.revenue) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {b.notes && (
              <p className="mt-3 text-sm text-gray-600">
                <span className="font-semibold">Note:</span> {b.notes}
              </p>
            )}
          </div>
        );
      })()}

      {/* Price modal */}
      {priceModalBolla && (
        <PriceModal
          bolla={priceModalBolla}
          onClose={() => setPriceModalBolla(null)}
          onSuccess={() => {
            setPriceModalBolla(null);
            load();
          }}
        />
      )}

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Elimina Bolla"
        message={
          deleteTarget
            ? deleteTarget.state === "CONFERMATA"
              ? `ATTENZIONE: la bolla #${deleteTarget.progressiveNumber} è CONFERMATA. Eliminarla rimuoverà i dati dal report vendite. Continuare?`
              : deleteTarget.state === "IN_ATTESA"
              ? `La bolla #${deleteTarget.progressiveNumber} è IN ATTESA. Eliminarla è irreversibile. Continuare?`
              : `Eliminare definitivamente la bolla #${deleteTarget.progressiveNumber}?`
            : ""
        }
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        danger
      />

      {/* Delete error */}
      {deleteError && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white text-sm rounded-lg px-4 py-3 shadow-lg">
          {deleteError}
        </div>
      )}

    </div>
  );
}
