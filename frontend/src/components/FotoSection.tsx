import {
  useState
} from 'react';

export interface FotoItem {
  beschrijving: string;
  file: File | null;
  previewUrl: string;
  genomenOp: string | null;
}

interface FotoSectionProps {
  fotos: FotoItem[];
  onChange: (
    fotos: FotoItem[]
  ) => void;
}

const createEmptyFoto =
  (): FotoItem => ({
    beschrijving: '',
    file: null,
    previewUrl: '',
    genomenOp: null
  });

export default function FotoSection({
  fotos,
  onChange
}: FotoSectionProps) {
  const [
    enlargedUrl,
    setEnlargedUrl
  ] = useState<string | null>(
    null
  );

  const addEmptyRow = () => {
    onChange([
      ...fotos,
      createEmptyFoto()
    ]);
  };

  const updateBeschrijving = (
    index: number,
    value: string
  ) => {
    const updated = [
      ...fotos
    ];

    updated[index] = {
      ...updated[index],
      beschrijving: value
    };

    onChange(updated);
  };

  const updateFile = (
    index: number,
    file: File
  ) => {
    const updated = [
      ...fotos
    ];

    const oldPreviewUrl =
      updated[index]
        ?.previewUrl;

    if (oldPreviewUrl) {
      URL.revokeObjectURL(
        oldPreviewUrl
      );
    }

    const previewUrl =
      URL.createObjectURL(
        file
      );

    updated[index] = {
      ...updated[index],
      file,
      previewUrl,

      /*
       * Bewaart het moment waarop
       * de foto is gekozen of gemaakt.
       */
      genomenOp:
        new Date().toISOString()
    };

    onChange(updated);
  };

  const clearFile = (
    index: number
  ) => {
    const updated = [
      ...fotos
    ];

    const previewUrl =
      updated[index]
        ?.previewUrl;

    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    updated[index] = {
      ...updated[index],
      file: null,
      previewUrl: '',
      genomenOp: null
    };

    onChange(updated);
  };

  const removeRow = (
    index: number
  ) => {
    const foto =
      fotos[index];

    if (foto?.previewUrl) {
      URL.revokeObjectURL(
        foto.previewUrl
      );
    }

    const updated =
      fotos.filter(
        (_, currentIndex) =>
          currentIndex !== index
      );

    onChange(
      updated.length > 0
        ? updated
        : [createEmptyFoto()]
    );
  };

  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-gray-900 mb-3">
        Foto&apos;s en beschrijvingen
      </h3>

      {fotos.map(
        (foto, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded p-3 mb-3"
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <label className="block text-sm text-gray-700">
                Beschrijving
              </label>

              {fotos.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    removeRow(
                      index
                    )
                  }
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Rij verwijderen
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="Beschrijving, bijvoorbeeld WAN of modem"
              value={
                foto.beschrijving
              }
              onChange={event =>
                updateBeschrijving(
                  index,
                  event.target.value
                )
              }
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3"
            />

            {foto.previewUrl && (
              <div className="relative inline-block mb-3">
                <img
                  src={
                    foto.previewUrl
                  }
                  alt="Voorbeeld"
                  onClick={() =>
                    setEnlargedUrl(
                      foto.previewUrl
                    )
                  }
                  className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-90 transition"
                />

                <button
                  type="button"
                  onClick={() =>
                    clearFile(
                      index
                    )
                  }
                  className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow"
                  title="Foto verwijderen"
                >
                  ×
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <label className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 cursor-pointer bg-white truncate">
                {foto.file
                  ? foto.file.name
                  : 'Geen bestand geselecteerd'}

                <input
                  type="file"
                  accept="image/*"
                  onChange={event => {
                    const file =
                      event.target
                        .files?.[0];

                    if (file) {
                      updateFile(
                        index,
                        file
                      );
                    }
                  }}
                  className="hidden"
                />
              </label>

              <label className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded cursor-pointer whitespace-nowrap text-center">
                Foto maken

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={event => {
                    const file =
                      event.target
                        .files?.[0];

                    if (file) {
                      updateFile(
                        index,
                        file
                      );
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {foto.file &&
              foto.genomenOp && (
                <p className="mt-2 text-xs text-gray-500">
                  Geselecteerd:{' '}
                  {new Date(
                    foto.genomenOp
                  ).toLocaleString(
                    'nl-NL'
                  )}
                </p>
              )}
          </div>
        )
      )}

      <button
        type="button"
        onClick={
          addEmptyRow
        }
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded"
      >
        Foto toevoegen
      </button>

      {enlargedUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() =>
            setEnlargedUrl(
              null
            )
          }
        >
          <div
            className="relative max-w-3xl w-full"
            onClick={event =>
              event.stopPropagation()
            }
          >
            <img
              src={
                enlargedUrl
              }
              alt="Vergrote foto"
              className="w-full max-h-[80vh] object-contain rounded"
            />

            <button
              type="button"
              onClick={() =>
                setEnlargedUrl(
                  null
                )
              }
              className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300"
              title="Sluiten"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}