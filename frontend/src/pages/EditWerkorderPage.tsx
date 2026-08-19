import {
  useEffect,
  useState
} from 'react';

import {
  Link,
  Navigate,
  useNavigate,
  useParams
} from 'react-router-dom';

import WerkorderForm from '../components/WerkorderForm';

import {
  getWerkorderDetail
} from '../services/werkorderService';

import type {
  WerkorderDetail
} from '../types/Werkorder';

export default function EditWerkorderPage() {
  const { id } =
    useParams<{
      id: string;
    }>();

  const navigate =
    useNavigate();

  const [
    detail,
    setDetail
  ] = useState<
    WerkorderDetail | null
  >(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    const loadDraft =
      async () => {
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
        } catch (
          error: unknown
        ) {
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

    void loadDraft();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Laden...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <Link
            to="/werkorders"
            className="text-blue-600 hover:underline text-sm"
          >
            ← Terug naar overzicht
          </Link>

          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return null;
  }

  if (
    Boolean(
      detail.is_voltooid
    )
  ) {
    return (
      <Navigate
        to={`/werkorders/${detail.id}`}
        replace
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <WerkorderForm
        initialDetail={
          detail
        }
        existingDraftId={
          detail.id
        }
      />
    </div>
  );
}