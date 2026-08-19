import type {
  Materiaal
} from '../types/Werkorder';

interface MateriaalSectionProps {
  title: string;

  tip:
    | 'klant'
    | 'bedrijf'
    | 'verkoop';

  placeholder: string;

  materialen:
    Materiaal[];

  onChange: (
    materialen: Materiaal[]
  ) => void;
}

export default function MateriaalSection({
  title,
  tip,
  placeholder,
  materialen,
  onChange
}: MateriaalSectionProps) {
  const addRow = () => {
    onChange([
      ...materialen,
      {
        tip,
        naam: '',
        aantal: 0,
        eenheid: ''
      }
    ]);
  };

  const updateRow = (
    index: number,
    field: keyof Materiaal,
    value: string | number
  ) => {
    const updated = [
      ...materialen
    ];

    updated[index] = {
      ...updated[index],
      [field]: value
    };

    onChange(updated);
  };

  const removeRow = (
    index: number
  ) => {
    const updated =
      materialen.filter(
        (_, currentIndex) =>
          currentIndex !== index
      );

    onChange(
      updated.length > 0
        ? updated
        : [
            {
              tip,
              naam: '',
              aantal: 0,
              eenheid: ''
            }
          ]
    );
  };

  return (
    <div className="mb-6 pb-6 border-b border-gray-200">
      <h3 className="text-base font-semibold text-gray-900 mb-3">
        {title}
      </h3>

      {materialen.map(
        (materiaal, index) => (
          <div
            key={index}
            className="grid grid-cols-1 sm:grid-cols-[1fr_110px_120px_36px] gap-2 mb-2 items-center"
          >
            <input
              type="text"
              placeholder={
                placeholder
              }
              value={
                materiaal.naam
              }
              onChange={event =>
                updateRow(
                  index,
                  'naam',
                  event.target.value
                )
              }
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Aantal"
              value={
                materiaal.aantal ||
                ''
              }
              onChange={event =>
                updateRow(
                  index,
                  'aantal',
                  Math.max(
                    0,
                    Number(
                      event.target
                        .value
                    )
                  )
                )
              }
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />

            <input
              type="text"
              placeholder="Eenheid"
              value={
                materiaal.eenheid ??
                ''
              }
              onChange={event =>
                updateRow(
                  index,
                  'eenheid',
                  event.target.value
                )
              }
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />

            <button
              type="button"
              onClick={() =>
                removeRow(
                  index
                )
              }
              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-600"
              title="Materiaal verwijderen"
            >
              ×
            </button>
          </div>
        )
      )}

      <button
        type="button"
        onClick={
          addRow
        }
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded"
      >
        Materiaal toevoegen
      </button>
    </div>
  );
}