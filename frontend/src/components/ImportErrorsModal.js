import React from 'react';

const ImportErrorsModal = ({ isOpen, onClose, errors }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full z-10 p-6">
        <div className="flex items-start">
          <h3 className="text-lg font-semibold">Import Errors</h3>
        </div>
        <div className="mt-4 max-h-72 overflow-y-auto text-sm text-gray-800">
          {(!errors || errors.length === 0) ? (
            <div className="text-gray-600">No errors to show.</div>
          ) : (
            <ul className="list-disc pl-5 space-y-2">
              {errors.map((err, i) => {
                const row = err.row ?? err.r ?? '?';
                const msg = err.message || err.error || err.detail || JSON.stringify(err);
                const title = err.title ? ` (title: ${err.title})` : '';
                return (
                  <li key={i}>
                    <span className="font-medium">Row {row}{title}:</span> {msg}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => {
              // Copy errors to clipboard in a readable format
              const text = (errors || []).map(e => {
                const row = e.row ?? e.r ?? '?';
                const msg = e.message || e.error || e.detail || JSON.stringify(e);
                const title = e.title ? ` (title: ${e.title})` : '';
                return `Row ${row}${title}: ${msg}`;
              }).join('\n');
              try {
                navigator.clipboard.writeText(text);
              } catch (e) {
                // ignore
              }
              onClose();
            }}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            Copy & Close
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Close</button>
        </div>
      </div>
    </div>
  );
};

export default ImportErrorsModal;
