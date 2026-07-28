import type { Materiaal } from '../types/Werkorder';

interface MateriaalSectionProps {
  title: string;
  tip: 'klant' | 'bedrijf' | 'verkoop';
  placeholder: string;
  materialen: Materiaal[];
  onChange: (materialen: Materiaal[]) => void;
}

export default function MateriaalSection({ title, tip, placeholder, materialen, onChange }: MateriaalSectionProps) {

  const addRow = () => {
    onChange([...materialen, { tip, naam: '', aantal: 0 }]);
  };

  const updateRow = (index: number, field: keyof Materiaal, value: string | number) => {
    const updated = [...materialen];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeRow = (index: number) => {
    onChange(materialen.filter((_, i) => i !== index));
  };

  return (
    <div className="mb-6 pb-6 border-b border-gray-200">
      <h3 className="text-base font-semibold text-gray-900 mb-3">{title}</h3>

      {materialen.map((materiaal, index) => (
        <div key={index} className="flex gap-2 mb-2 items-center">
          <input
            type="text"
            placeholder={placeholder}
            value={materiaal.naam}
            onChange={(e) => updateRow(index, 'naam', e.target.value)}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Aantal"
            value={materiaal.aantal || ''}
            onChange={(e) => updateRow(index, 'aantal', Math.max(0, Number(e.target.value)))}
            className="w-28 border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => removeRow(index)}
            className="text-gray-400 hover:text-red-600 px-1"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded"
      >
        Materiaal toevoegen
      </button>
    </div>
  );
}