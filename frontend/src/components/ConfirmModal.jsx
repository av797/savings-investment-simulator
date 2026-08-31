export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  danger       = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-lg font-bold text-white mb-1.5">{title}</h2>
          <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{message}</p>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl px-4 py-2.5 transition-colors text-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 font-semibold rounded-xl px-4 py-2.5 transition-colors text-sm ${
              danger
                ? 'bg-red-500 hover:bg-red-400 text-white'
                : 'bg-emerald-400 hover:bg-emerald-300 text-gray-950'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}