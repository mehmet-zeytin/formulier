import {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Link,
  useNavigate
} from 'react-router-dom';

import {
  getAllWerkorders
} from '../services/werkorderService';

import {
  getCurrentUserFromServer,
  logout,
  type CurrentUserResponse
} from '../services/authService';

import type {
  Werkorder,
  WerkorderStatus
} from '../types/Werkorder';

type StatusFilter =
  | 'alle'
  | 'concept'
  | 'Voltooid'
  | 'Niet Voltooid'
  | 'In Afwachting';

export default function WerkordersPage() {
  const [
    werkorders,
    setWerkorders
  ] = useState<Werkorder[]>([]);

  const [
    searchQuery,
    setSearchQuery
  ] = useState('');

  const [
    statusFilter,
    setStatusFilter
  ] = useState<StatusFilter>(
    'alle'
  );

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState('');

  const [
    currentUser,
    setCurrentUser
  ] =
    useState<CurrentUserResponse | null>(
      null
    );

  const navigate =
    useNavigate();

  useEffect(() => {
    let active =
      true;

    const fetchWerkorders =
      async () => {
        try {
          setError('');

          /*
           * Actuele gebruiker ophalen
           * via de backend.
           *
           * Hierdoor gebruiken we niet
           * meer de mogelijk verouderde
           * rol uit het JWT.
           */
          const currentUserData =
            await getCurrentUserFromServer();

          if (!active) {
            return;
          }

          setCurrentUser(
            currentUserData
          );

          const data =
            await getAllWerkorders();

          if (!active) {
            return;
          }

          setWerkorders(
            data
          );
        } catch (
          error: unknown
        ) {
          if (!active) {
            return;
          }

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

          if (
            status === 401
          ) {
            navigate(
              '/login',
              {
                replace: true
              }
            );

            return;
          }

          setError(
            'Werkorders konden niet worden geladen.'
          );
        } finally {
          if (active) {
            setLoading(
              false
            );
          }
        }
      };

    void fetchWerkorders();

    return () => {
      active =
        false;
    };
  }, [navigate]);

  const filteredWerkorders =
    useMemo(() => {
      const normalizedSearch =
        searchQuery
          .trim()
          .toLowerCase();

      return werkorders.filter(
        werkorder => {
          const matchesSearch =
            !normalizedSearch ||
            werkorder
              .werkorder_id
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            (
              werkorder
                .uitgevoerde_werkzaamheden ??
              ''
            )
              .toLowerCase()
              .includes(
                normalizedSearch
              );

          let matchesStatus =
            true;

          if (
            statusFilter ===
            'concept'
          ) {
            matchesStatus =
              !werkorder
                .is_voltooid;
          } else if (
            statusFilter !==
            'alle'
          ) {
            matchesStatus =
              Boolean(
                werkorder
                  .is_voltooid
              ) &&
              werkorder.status ===
                statusFilter;
          }

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      werkorders,
      searchQuery,
      statusFilter
    ]);

  const handleLogout =
    (): void => {
      logout();

      navigate(
        '/login',
        {
          replace: true
        }
      );
    };

  const clearFilters =
    (): void => {
      setSearchQuery('');

      setStatusFilter(
        'alle'
      );
    };

  const getStatusLabel = (
    werkorder: Werkorder
  ): string => {
    if (
      !werkorder.is_voltooid
    ) {
      return 'Concept';
    }

    return (
      werkorder.status ??
      'Onbekend'
    );
  };

  const statusColor = (
    status:
      | WerkorderStatus
      | null,
    isVoltooid:
      | number
      | boolean
  ): string => {
    if (!isVoltooid) {
      return (
        'bg-blue-100 text-blue-700'
      );
    }

    if (
      status === 'Voltooid'
    ) {
      return (
        'bg-green-100 text-green-700'
      );
    }

    if (
      status ===
      'Niet Voltooid'
    ) {
      return (
        'bg-red-100 text-red-700'
      );
    }

    return (
      'bg-yellow-100 text-yellow-700'
    );
  };

  const formatDate = (
    date: string
  ): string => {
    const parts =
      date.split('-');

    if (
      parts.length !== 3
    ) {
      return date;
    }

    return parts
      .reverse()
      .join('-');
  };

  const canManageUsers =
    currentUser?.role ===
      'owner' ||
    currentUser?.role ===
      'admin';

  const filtersActive =
    searchQuery.trim() !==
      '' ||
    statusFilter !==
      'alle';

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Laden...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Werkorders
            </h1>

            {currentUser && (
              <p className="mt-1 text-sm text-gray-500">
                Ingelogd als{' '}
                {currentUser.email}{' '}
                (
                {currentUser.role}
                )
              </p>
            )}

            {canManageUsers && (
              <Link
                to="/users"
                className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Gebruikersbeheer
              </Link>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/werkorders/new"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Nieuw formulier
            </Link>

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Uitloggen
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 p-3 bg-red-100 text-red-700 rounded"
          >
            {error}
          </div>
        )}

        <div className="bg-white rounded shadow p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3">
            <div>
              <label
                htmlFor="werkorder-search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Zoeken
              </label>

              <input
                id="werkorder-search"
                type="search"
                value={
                  searchQuery
                }
                onChange={
                  event =>
                    setSearchQuery(
                      event.target
                        .value
                    )
                }
                placeholder="Werkorder-ID of werkzaamheden..."
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="status-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>

              <select
                id="status-filter"
                value={
                  statusFilter
                }
                onChange={
                  event =>
                    setStatusFilter(
                      event.target
                        .value as StatusFilter
                    )
                }
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="alle">
                  Alle
                </option>

                <option value="concept">
                  Concept
                </option>

                <option value="Voltooid">
                  Voltooid
                </option>

                <option value="Niet Voltooid">
                  Niet Voltooid
                </option>

                <option value="In Afwachting">
                  In Afwachting
                </option>
              </select>
            </div>

            <div className="md:self-end">
              <button
                type="button"
                onClick={
                  clearFilters
                }
                disabled={
                  !filtersActive
                }
                className="w-full md:w-auto border border-gray-300 px-4 py-2 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
              >
                Filters wissen
              </button>
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-500">
            {filteredWerkorders.length}{' '}
            van{' '}
            {werkorders.length}{' '}
            werkorders
          </div>
        </div>

        <div className="bg-white rounded shadow divide-y divide-gray-200 overflow-hidden">
          {werkorders.length ===
            0 && (
            <div className="p-6 text-center text-gray-500">
              Nog geen werkorders ingevuld.
            </div>
          )}

          {werkorders.length >
            0 &&
            filteredWerkorders
              .length === 0 && (
              <div className="p-8 text-center">
                <p className="font-medium text-gray-700">
                  Geen werkorders gevonden.
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Pas de zoekopdracht of filters aan.
                </p>

                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Filters wissen
                </button>
              </div>
            )}

          {filteredWerkorders.map(
            werkorder => (
              <Link
                key={
                  werkorder.id
                }
                to={`/werkorders/${werkorder.id}`}
                className="block p-4 hover:bg-gray-50 transition"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {
                        werkorder
                          .werkorder_id
                      }
                    </p>

                    <p className="text-sm text-gray-500">
                      {formatDate(
                        werkorder.datum
                      )}
                    </p>

                    {werkorder
                      .uitgevoerde_werkzaamheden && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {
                          werkorder
                            .uitgevoerde_werkzaamheden
                        }
                      </p>
                    )}

                    {werkorder
                      .updated_at && (
                      <p className="mt-1 text-xs text-gray-400">
                        Laatst gewijzigd:{' '}
                        {new Date(
                          werkorder
                            .updated_at
                        ).toLocaleString(
                          'nl-NL'
                        )}
                      </p>
                    )}
                  </div>

                  <span
                    className={`self-start sm:self-auto text-xs font-medium px-3 py-1 rounded-full ${statusColor(
                      werkorder.status,
                      werkorder
                        .is_voltooid
                    )}`}
                  >
                    {getStatusLabel(
                      werkorder
                    )}
                  </span>
                </div>
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}