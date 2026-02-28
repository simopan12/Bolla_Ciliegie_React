import { AlertTriangle } from "lucide-react";

/**
 * Simple confirmation modal.
 * Props: open, title, message, onConfirm, onCancel, danger
 */
export default function ConfirmDialog({
  open,
  title = "Conferma",
  message,
  onConfirm,
  onCancel,
  danger = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 z-10">
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-full ${danger ? "bg-red-100" : "bg-amber-100"}`}>
            <AlertTriangle
              size={20}
              className={danger ? "text-red-600" : "text-amber-600"}
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {message && (
              <p className="text-sm text-gray-600 mt-1">{message}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onCancel}>
            Annulla
          </button>
          <button
            className={danger ? "btn-danger" : "btn-amber"}
            onClick={onConfirm}
          >
            Conferma
          </button>
        </div>
      </div>
    </div>
  );
}
