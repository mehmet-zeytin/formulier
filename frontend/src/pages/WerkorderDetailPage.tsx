import { useEffect, useState } from 'react';

import {
  Link,
  useNavigate,
  useParams
} from 'react-router-dom';

import {
  deleteFoto,
  getWerkorderDetail
} from '../services/werkorderService';

import type {
  Foto,
  Materiaal,
  WerkorderDetail
} from '../types/Werkorder';

const tipLabels: Record<
  Materiaal['tip'],
  string
> = {
  klant:
    'Gebruikte materialen van de klant',

  bedrijf:
    'Geleverde goederen vanuit ons als bedrijf',

  verkoop:
    'Extra gebruikte materialen van ons (verkoop)'
};

export default function WerkorderDetailPage() {
  const { id } =
    useParams<{ id: string }>();

  const navigate = useNavigate();

  const [detail, setDetail] =
    useState<WerkorderDetail | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [
    selectedFoto,
    setSelectedFoto
  ] = useState<Foto | null>(null);

  const [
    deletingFotoId,
    setDeletingFotoId
  ] = useState<number | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setError('');

        const numericId =
          Number(id);

        if (
          !Number.isInteger(
            numericId
          ) ||
          numericId <= 0
        ) {
          setError(
            'Ongeldig werkorder-ID.'
          );
          return;
        }

        const data =
          await getWerkorderDetail(
            numericId
          );

        setDetail(data);
      } catch (error: unknown) {
        const status =
          typeof error ===
            'object' &&
          error !== null &&
          'response' in error
            ? (
                error as {
                  response?: {
                    status?: number;
                  };
                }
              ).response?.status
            : undefined;

        if (status === 401) {
          navigate(
            '/login',
            {
              replace: true
            }
          );
          return;
        }

        if (status === 403) {
          setError(
            'U heeft geen toegang tot deze werkorder.'
          );
          return;
        }

        if (status === 404) {
          setError(
            'Werkorder niet gevonden.'
          );
          return;
        }

        setError(
          'De werkorder kon niet worden geladen.'
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchDetail();
  }, [id, navigate]);

  const handleDeleteFoto =
    async (
      fotoId: number
    ) => {
      if (!detail) {
        return;
      }

      const confirmed =
        window.confirm(
          'Weet u zeker dat u deze foto wilt verwijderen?'
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingFotoId(
          fotoId
        );

        await deleteFoto(
          detail.id,
          fotoId
        );

        setDetail(
          current => {
            if (!current) {
              return current;
            }

            return {
              ...current,
              fotos:
                current.fotos.filter(
                  foto =>
                    foto.id !==
                    fotoId
                )
            };
          }
        );
      } catch {
        window.alert(
          'De foto kon niet worden verwijderd.'
        );
      } finally {
        setDeletingFotoId(
          null
        );
      }
    };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Laden...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        {error}
      </div>
    );
  }

  if (!detail) {
    return null;
  }

  const isDraft =
    !Boolean(
      detail.is_voltooid
    );

  const materialenPerTip = (
    tip: Materiaal['tip']
  ) =>
    detail.materialen.filter(
      materiaal =>
        materiaal.tip === tip
    );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded shadow p-6">
        <div className="flex justify-between items-start gap-4">
          <Link
            to="/werkorders"
            className="text-blue-600 hover:underline text-sm"
          >
            ← Terug naar overzicht
          </Link>

          <span
            className={`text-xs font-medium px-3 py-1 rounded-full ${
              isDraft
                ? 'bg-blue-100 text-blue-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {isDraft
              ? 'Concept'
              : 'Afgerond'}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mt-4">
          {detail.werkorder_id}
        </h1>

        {isDraft && (
          <Link
            to={`/werkorders/${detail.id}/edit`}
            className="mt-5 inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded"
          >
            Verdergaan met concept
          </Link>
        )}

        <div className="grid grid-cols-2 gap-4 my-6 text-sm">
          <div>
            <span className="text-gray-500">
              Aankomsttijd
            </span>

            <p className="font-medium">
              {detail.aankomsttijd ??
                '-'}
            </p>
          </div>

          <div>
            <span className="text-gray-500">
              Eindtijd
            </span>

            <p className="font-medium">
              {detail.eindtijd ??
                '-'}
            </p>
          </div>

          <div>
            <span className="text-gray-500">
              Datum
            </span>

            <p className="font-medium">
              {detail.datum
                .split('-')
                .reverse()
                .join('-')}
            </p>
          </div>

          <div>
            <span className="text-gray-500">
              Status
            </span>

            <p className="font-medium">
              {detail.status ??
                'Nog niet ingevuld'}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <span className="text-gray-500 text-sm">
            Uitgevoerde werkzaamheden
          </span>

          <p className="mt-1 whitespace-pre-wrap">
            {detail
              .uitgevoerde_werkzaamheden ??
              'Nog niet ingevuld'}
          </p>
        </div>

        {(
          [
            'klant',
            'bedrijf',
            'verkoop'
          ] as Materiaal['tip'][]
        ).map(tip => {
          const items =
            materialenPerTip(
              tip
            );

          if (
            items.length === 0
          ) {
            return null;
          }

          return (
            <div
              key={tip}
              className="mb-6"
            >
              <h3 className="font-semibold mb-2">
                {
                  tipLabels[
                    tip
                  ]
                }
              </h3>

              {items.map(
                materiaal => (
                  <p
                    key={
                      materiaal.id
                    }
                    className="text-sm"
                  >
                    {
                      materiaal.naam
                    }{' '}
                    —{' '}
                    {
                      materiaal.aantal
                    }{' '}
                    {
                      materiaal.eenheid ??
                      ''
                    }
                  </p>
                )
              )}
            </div>
          );
        })}

        {detail.materialen
          .length === 0 && (
          <div className="mb-6">
            <h3 className="font-semibold">
              Materialen
            </h3>

            <p className="text-sm text-gray-500 mt-2">
              Geen materialen geregistreerd.
            </p>
          </div>
        )}

        <div>
          <h3 className="font-semibold mb-3">
            Foto&apos;s en beschrijvingen
          </h3>

          {detail.fotos.length ===
          0 ? (
            <p className="text-sm text-gray-500">
              Geen foto&apos;s geregistreerd.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {detail.fotos.map(
                foto => (
                  <div
                    key={foto.id}
                    className="relative"
                  >
                    <img
                      src={`http://localhost:3000${foto.bestandspad}`}
                      alt={
                        foto.beschrijving ??
                        'Werkorderfoto'
                      }
                      onClick={() =>
                        setSelectedFoto(
                          foto
                        )
                      }
                      className="w-full h-40 object-cover rounded cursor-pointer"
                    />

                    {isDraft && (
                      <button
                        type="button"
                        disabled={
                          deletingFotoId ===
                          foto.id
                        }
                        onClick={() =>
                          void handleDeleteFoto(
                            foto.id
                          )
                        }
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7"
                      >
                        ✕
                      </button>
                    )}

                    {foto.beschrijving && (
                      <p className="text-sm text-gray-600 mt-1">
                        {
                          foto.beschrijving
                        }
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {selectedFoto && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() =>
            setSelectedFoto(null)
          }
        >
          <img
            src={`http://localhost:3000${selectedFoto.bestandspad}`}
            alt={
              selectedFoto.beschrijving ??
              'Werkorderfoto'
            }
            className="max-w-3xl max-h-[85vh] object-contain"
          />
        </div>
      )}
    </div>
  );
}