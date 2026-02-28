import { useState } from "react";
import { X, Check, AlertCircle, RefreshCw } from "lucide-react";
import { insertPrices } from "../api/tauriCommands";
import { formatKg, formatEuro } from "../utils/formatters";
import { SPECIAL_VARIETIES } from "./BollaForm";

function isSpecial(variety) {
  return SPECIAL_VARIETIES.includes(variety);
}

export default function PriceModal({ bolla, onClose, onSuccess }) {
  // Pre-fill prices from existing data
  const [prices, setPrices] = useState(() =>
    Object.fromEntries(
      bolla.righe.map((r) => [r.id, r.pricePerKg != null ? String(r.pricePerKg) : ""])
    )
  );

  // Kg inputs for specials — pre-fill if already set (kg > 0)
  const [kgInputs, setKgInputs] = useState(() =>
    Object.fromEntries(
      bolla.righe
        .filter((r) => isSpecial(r.variety))
        .map((r) => [r.id, r.kg > 0 ? String(r.kg) : ""])
    )
  );

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  function getEffectiveKg(riga) {
    if (isSpecial(riga.variety)) {
      const kg = parseFloat(kgInputs[riga.id]);
      return isNaN(kg) || kg <= 0 ? null : kg;
    }
    return riga.kg;
  }

  function getRevenue(riga) {
    const p = parseFloat(prices[riga.id]);
    if (isNaN(p) || p <= 0) return null;
    const kg = getEffectiveKg(riga);
    if (kg == null) return null;
    return kg * p;
  }

  const totalRevenue = bolla.righe.reduce((sum, r) => sum + (getRevenue(r) ?? 0), 0);

  const totalKg = bolla.righe.reduce((sum, r) => {
    const kg = getEffectiveKg(r);
    return sum + (kg ?? 0);
  }, 0);

  const allFilled = bolla.righe.every((r) => {
    const p = parseFloat(prices[r.id]);
    if (isNaN(p) || p <= 0) return false;
    if (isSpecial(r.variety)) {
      const kg = parseFloat(kgInputs[r.id]);
      if (isNaN(kg) || kg <= 0) return false;
    }
    return true;
  });

  async function handleConfirm() {
    if (!allFilled) {
      setError("Inserire prezzo per ogni varietà e KG per le categorie speciali (Rossi, Piccoli, Scarti, ecc.).");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = bolla.righe.map((r) => ({
        rigaId:     r.id,
        pricePerKg: parseFloat(prices[r.id]),
        kg:         isSpecial(r.variety) ? parseFloat(kgInputs[r.id]) : null,
      }));
      await insertPrices(bolla.id, payload);
      onSuccess();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 z-10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="font-bold text-gray-800">Inserisci Prezzi e KG</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Bolla #{bolla.progressiveNumber}
            </p>
          </div>
          <button
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Standard varieties */}
          {bolla.righe.filter((r) => !isSpecial(r.variety)).length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 mb-2">
                Ciliegie Standard
              </p>
              <div className="grid grid-cols-[1fr_80px_100px] gap-2 text-xs font-semibold uppercase text-gray-400 pb-1 border-b mb-2">
                <span>Varietà</span>
                <span className="text-right">KG</span>
                <span className="text-right">€/KG</span>
              </div>
              <div className="space-y-2">
                {bolla.righe.filter((r) => !isSpecial(r.variety)).map((r) => {
                  const rev = getRevenue(r);
                  return (
                    <div key={r.id} className="space-y-0.5">
                      <div className="grid grid-cols-[1fr_80px_100px] gap-2 items-center">
                        <span className="font-medium text-sm text-gray-800">{r.variety}</span>
                        <div className="text-right text-sm text-gray-600">{formatKg(r.kg)}</div>
                        <input
                          type="number" min="0" step="0.01" placeholder="0.00"
                          className="input text-right text-sm"
                          value={prices[r.id]}
                          onChange={(e) => setPrices((p) => ({ ...p, [r.id]: e.target.value }))}
                        />
                      </div>
                      {rev != null && (
                        <div className="text-right text-xs text-sage-600 font-medium">
                          Ricavo: {formatEuro(rev)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special varieties */}
          {bolla.righe.filter((r) => isSpecial(r.variety)).length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 mb-2">
                Categorie Speciali
              </p>
              <div className="grid grid-cols-[1fr_90px_100px] gap-2 text-xs font-semibold uppercase text-gray-400 pb-1 border-b mb-2">
                <span>Categoria</span>
                <span className="text-right">KG *</span>
                <span className="text-right">€/KG</span>
              </div>
              <div className="space-y-2">
                {bolla.righe.filter((r) => isSpecial(r.variety)).map((r) => {
                  const rev = getRevenue(r);
                  return (
                    <div key={r.id} className="space-y-0.5">
                      <div className="grid grid-cols-[1fr_90px_100px] gap-2 items-center">
                        <span className="font-medium text-sm text-gray-800">{r.variety}</span>
                        <input
                          type="number" min="0" step="0.01" placeholder="kg"
                          className="input text-right text-sm"
                          value={kgInputs[r.id] ?? ""}
                          onChange={(e) =>
                            setKgInputs((p) => ({ ...p, [r.id]: e.target.value }))
                          }
                        />
                        <input
                          type="number" min="0" step="0.01" placeholder="0.00"
                          className="input text-right text-sm"
                          value={prices[r.id]}
                          onChange={(e) =>
                            setPrices((p) => ({ ...p, [r.id]: e.target.value }))
                          }
                        />
                      </div>
                      {rev != null && (
                        <div className="text-right text-xs text-sage-600 font-medium">
                          Ricavo: {formatEuro(rev)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">Totale KG</span>
            <span className="text-sm font-bold">{formatKg(totalKg)}</span>
          </div>
          {totalRevenue > 0 && (
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-gray-700">Ricavo totale stimato</span>
              <span className="text-base font-bold text-sage-700">{formatEuro(totalRevenue)}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button className="btn-secondary flex-1" onClick={onClose} disabled={saving}>
              Annulla
            </button>
            <button
              className="btn-primary flex-1"
              onClick={handleConfirm}
              disabled={saving || !allFilled}
            >
              {saving ? <RefreshCw size={15} className="animate-spin" /> : <Check size={15} />}
              Salva Prezzi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
