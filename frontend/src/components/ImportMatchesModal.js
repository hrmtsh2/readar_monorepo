import React from 'react';

const ImportMatchesModal = ({ isOpen, onClose, matches = [], onMerge, onCreate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full z-10 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Import - Potential Matches</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">Close</button>
        </div>

        <div className="mt-4 max-h-72 overflow-y-auto text-sm text-gray-800">
          {(!matches || matches.length === 0) ? (
            <div className="text-gray-600">No suggested matches. All rows were imported.</div>
          ) : (
            <ul className="space-y-3">
              {matches.map((m, i) => {
                const r = m.row;
                const s = m.suggested || {};
                const rd = m.row_data || {};
                return (
                  <li key={i} className="p-3 border rounded bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">Row {r}: {m.title}</div>
                        <div className="text-xs text-gray-600">Suggested match: {s.title} — {s.author || '-'} (stock: {s.stock}) — score: {s.score}</div>
                        <div className="text-xs text-gray-600 mt-1">Row data: price: {rd.price}, stock: {rd.stock}, for_sale: {String(rd.is_for_sale)}</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => onCreate(m)} className="px-3 py-1 bg-blue-600 text-white rounded">Create new</button>
                        <button onClick={() => onMerge(m)} className="px-3 py-1 bg-green-600 text-white rounded">Merge stock</button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">Close</button>
        </div>
      </div>
    </div>
  );
};

export default ImportMatchesModal;
