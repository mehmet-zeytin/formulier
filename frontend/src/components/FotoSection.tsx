import { useState } from 'react';

export interface FotoItem {
  beschrijving: string;
  file: File | null;
  previewUrl: string;
}

interface FotoSectionProps {
  fotos: FotoItem[];
  onChange: (fotos: FotoItem[]) => void;
}

export default function FotoSection({ fotos, onChange }: FotoSectionProps) {
  const [enlargedUrl, setEnlargedUrl] = useState<string | null>(null);

  const addEmptyRow = () => {
    onChange([...fotos, { beschrijving: '', file: null, previewUrl: '' }]);
  };

  const updateBeschrijving = (index: number, value: string) => {
    const updated = [...fotos];
    updated[index] = { ...updated[index], beschrijving: value };
    onChange(updated);
  };

  const updateFile = (index: number, file: File) => {
    const updated = [...fotos];
    const previewUrl = URL.createObjectURL(file);
    updated[index] = { ...updated[index], file, previewUrl };
    onChange(updated);
  };

  const clearFile = (index: number) => {
    const updated = [...fotos];
    updated[index] = { ...updated[index], file: null, previewUrl: '' };
    onChange(updated);
  };

  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-gray-900 mb-3">Foto's en Beschrijvingen</h3>

      {fotos.map((foto, index) => (
        <div key={index} className="border border-gray-200 rounded p-3 mb-3">
          <label className="block text-sm text-gray-700 mb-1">Beschrijving</label>
          <input
            type="text"
            placeholder="Beschrijving (bijv. WAN, Modem)"
            value={foto.beschrijving}
            onChange={(e) => updateBeschrijving(index, e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3"
          />

          {foto.previewUrl && (
            <div className="relative inline-block mb-3">
              <img
                src={foto.previewUrl}
                alt="Voorbeeld"
                onClick={() => setEnlargedUrl(foto.previewUrl)}
                className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-90 transition"
              />
              <button
                type="button"
                onClick={() => clearFile(index)}
                className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow"
                title="Foto verwijderen"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <label className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 cursor-pointer bg-white truncate">
              {foto.file ? foto.file.name : 'Dosya seçilmedi'}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && updateFile(index, e.target.files[0])}
                className="hidden"
              />
            </label>

            <label className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded cursor-pointer whitespace-nowrap">
              Neem Foto
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => e.target.files && updateFile(index, e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addEmptyRow}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded"
      >
        Foto toevoegen
      </button>

      {enlargedUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setEnlargedUrl(null)}
        >
          <div className="relative max-w-3xl w-full">
            <img
              src={enlargedUrl}
              alt="Vergroot"
              className="w-full max-h-[80vh] object-contain rounded"
            />
            <button
              type="button"
              onClick={() => setEnlargedUrl(null)}
              className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300"
              title="Sluiten"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}