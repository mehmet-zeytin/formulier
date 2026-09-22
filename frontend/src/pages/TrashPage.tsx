import {
  useEffect,
  useState
} from 'react';

import {
  Link,
  useNavigate
} from 'react-router-dom';

import {
  deleteWerkorderPermanently,
  getTrashWerkorders,
  restoreWerkorder
} from '../services/werkorderService';

import {
  getCurrentUserFromServer
} from '../services/authService';

import type {
  Werkorder
} from '../types/Werkorder';


const getErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (
    typeof error ===
      'object' &&
    error !== null &&
    'response' in error
  ) {
    const apiError =
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

    return (
      apiError
        .response
        ?.data
        ?.message ??
      fallback
    );
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return fallback;
};


export default function TrashPage() {
  const navigate =
    useNavigate();

  const [
    werkorders,
    setWerkorders
  ] =
    useState<Werkorder[]>(
      []
    );

  const [
    loading,
    setLoading
  ] =
    useState(
      true
    );

  const [
    error,
    setError
  ] =
    useState(
      ''
    );

  const [
    busyId,
    setBusyId
  ] =
    useState<number | null>(
      null
    );


  const loadTrash =
    async (): Promise<void> => {
      try {
        setLoading(
          true
        );

        setError(
          ''
        );

        const user =
          await getCurrentUserFromServer();

        if (
          user.role !==
          'owner'
        ) {
          navigate(
            '/werkorders',
            {
              replace:
                true
            }
          );

          return;
        }

        const data =
          await getTrashWerkorders();

        setWerkorders(
          data
        );
      } catch (
        error: unknown
      ) {
        setError(
          getErrorMessage(
            error,
            'De prullenbak kon niet worden geladen.'
          )
        );
      } finally {
        setLoading(
          false
        );
      }
    };


  useEffect(
    () => {
      void loadTrash();
    },
    []
  );


  const handleRestore =
    async (
      werkorder: Werkorder
    ): Promise<void> => {
      const confirmed =
        window.confirm(
          `Wilt u werkorder ${werkorder.werkorder_id} herstellen?`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        setBusyId(
          werkorder.id
        );

        await restoreWerkorder(
          werkorder.id
        );

        setWerkorders(
          current =>
            current.filter(
              item =>
                item.id !==
                werkorder.id
            )
        );
      } catch (
        error: unknown
      ) {
        window.alert(
          getErrorMessage(
            error,
            'De werkorder kon niet worden hersteld.'
          )
        );
      } finally {
        setBusyId(
          null
        );
      }
    };


  const handlePermanentDelete =
    async (
      werkorder: Werkorder
    ): Promise<void> => {
      const confirmed =
        window.confirm(
          `Weet u zeker dat u werkorder ${werkorder.werkorder_id} definitief wilt verwijderen?\n\nDeze actie kan niet via de applicatie ongedaan worden gemaakt.`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        setBusyId(
          werkorder.id
        );

        await deleteWerkorderPermanently(
          werkorder.id
        );

        setWerkorders(
          current =>
            current.filter(
              item =>
                item.id !==
                werkorder.id
            )
        );
      } catch (
        error: unknown
      ) {
        window.alert(
          getErrorMessage(
            error,
            'De werkorder kon niet definitief worden verwijderd.'
          )
        );
      } finally {
        setBusyId(
          null
        );
      }
    };


  if (
    loading
  ) {
    return (
      <div className="p-8 text-center text-gray-500">
        Laden...
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/werkorders"
          className="text-blue-600 hover:underline text-sm"
        >
          ← Terug naar overzicht
        </Link>

        <div className="mt-4 bg-white rounded shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Prullenbak
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Hier staan verwijderde werkorders. U kunt deze herstellen of definitief verwijderen.
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {!error &&
            werkorders.length ===
              0 && (
              <p className="mt-6 text-gray-500">
                De prullenbak is leeg.
              </p>
            )}

          <div className="mt-6 space-y-3">
            {werkorders.map(
              werkorder => (
                <div
                  key={
                    werkorder.id
                  }
                  className="border border-gray-200 rounded p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {
                          werkorder.werkorder_id
                        }
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        Datum:{' '}
                        {
                          werkorder.datum
                            .split(
                              '-'
                            )
                            .reverse()
                            .join(
                              '-'
                            )
                        }
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={
                          busyId ===
                          werkorder.id
                        }
                        onClick={() =>
                          void handleRestore(
                            werkorder
                          )
                        }
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium px-4 py-2 rounded"
                      >
                        Herstellen
                      </button>

                      <button
                        type="button"
                        disabled={
                          busyId ===
                          werkorder.id
                        }
                        onClick={() =>
                          void handlePermanentDelete(
                            werkorder
                          )
                        }
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm font-medium px-4 py-2 rounded"
                      >
                        Definitief verwijderen
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}