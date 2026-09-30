import {
  useEffect,
  useState
} from 'react';

import {
  Link,
  useNavigate,
  useParams
} from 'react-router-dom';

import {
  deleteFoto,
  deleteWerkorder,
  getFotoBlob,
  getWerkorderDetail,
  getAssignableUsers,
  getWerkorderAccess,
  getAssignmentHistory,
  transferWerkorder,
  updateWerkorderAccess,
  type AssignableUser
} from '../services/werkorderService';

import {
  getCurrentUserFromServer,
  type CurrentUserResponse
} from '../services/authService';

import type {
  Foto,
  Materiaal,
  WerkorderDetail,
  AssignmentHistoryItem
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

export default function WerkorderDetailPage() {
  const {
    id
  } =
    useParams<{
      id: string;
    }>();

  const navigate =
    useNavigate();

  const [
    currentUser,
    setCurrentUser
  ] =
    useState<
      CurrentUserResponse | null
    >(
      null
    );

  const isOwner =
    currentUser?.role ===
    'owner';

  const [
    detail,
    setDetail
  ] =
    useState<
      WerkorderDetail | null
    >(
      null
    );

  const [
    users,
    setUsers
  ] =
    useState<
      AssignableUser[]
    >(
      []
    );

  const [
    selectedAssignee,
    setSelectedAssignee
  ] =
    useState<
      number | ''
    >(
      ''
    );

  const [
    transferReason,
    setTransferReason
  ] =
    useState(
      ''
    );

  const [
    assignmentHistory,
    setAssignmentHistory
  ] =
    useState<
      AssignmentHistoryItem[]
    >(
      []
    );

  const [
    accessUserIds,
    setAccessUserIds
  ] =
    useState<
      number[]
    >(
      []
    );

  const [
    assignmentSaving,
    setAssignmentSaving
  ] =
    useState(
      false
    );

  const [
    accessSaving,
    setAccessSaving
  ] =
    useState(
      false
    );

  const [
    assignmentMessage,
    setAssignmentMessage
  ] =
    useState(
      ''
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
    selectedFoto,
    setSelectedFoto
  ] =
    useState<
      Foto | null
    >(
      null
    );

  /*
   * Private foto-URL's.
   *
   * De foto's worden via Axios
   * als Blob opgehaald met de
   * geldige Bearer-token.
   *
   * Daarna maken we tijdelijke
   * browser-URL's met
   * URL.createObjectURL().
   */
  const [
    fotoUrls,
    setFotoUrls
  ] =
    useState<
      Record<
        number,
        string
      >
    >(
      {}
    );

  const [
    deletingWerkorder,
    setDeletingWerkorder
  ] =
    useState(
      false
    );

  const [
    deletingFotoId,
    setDeletingFotoId
  ] =
    useState<
      number | null
    >(
      null
    );

  useEffect(
    () => {
      let active =
        true;

      const fetchDetail =
        async () => {
          try {
            setError(
              ''
            );

            const numericId =
              Number(
                id
              );

            if (
              !Number.isInteger(
                numericId
              ) ||
              numericId <= 0
            ) {
              if (
                active
              ) {
                setError(
                  'Ongeldig werkorder-ID.'
                );
              }

              return;
            }

            /*
             * Haal eerst de actuele
             * gebruiker op bij de backend.
             */
            const currentUserData =
              await getCurrentUserFromServer();

            if (
              !active
            ) {
              return;
            }

            setCurrentUser(
              currentUserData
            );

            const data =
              await getWerkorderDetail(
                numericId
              );

            if (
              !active
            ) {
              return;
            }

            setDetail(
              data
            );

            if (
              !Boolean(
                data.is_voltooid
              )
            ) {
              const [
                assignableUsers,
                history
              ] =
                await Promise.all(
                  [
                    getAssignableUsers(),

                    getAssignmentHistory(
                      numericId
                    )
                  ]
                );

              if (
                !active
              ) {
                return;
              }

              setUsers(
                assignableUsers
              );

              setAssignmentHistory(
                history
              );

              setSelectedAssignee(
                data.assigned_to ??
                ''
              );

              /*
               * Gebruik de actuele rol
               * van /auth/me.
               */
              if (
                currentUserData.role ===
                'owner'
              ) {
                const access =
                  await getWerkorderAccess(
                    numericId
                  );

                if (
                  !active
                ) {
                  return;
                }

                setAccessUserIds(
                  access
                );
              } else {
                setAccessUserIds(
                  []
                );
              }
            }
          } catch (
            error: unknown
          ) {
            if (
              !active
            ) {
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
                  )
                    .response
                    ?.status
                : undefined;

            if (
              status ===
              401
            ) {
              navigate(
                '/login',
                {
                  replace:
                    true
                }
              );

              return;
            }

            if (
              status ===
              403
            ) {
              setError(
                'U heeft geen toegang tot deze werkorder.'
              );

              return;
            }

            if (
              status ===
              404
            ) {
              setError(
                'Werkorder niet gevonden.'
              );

              return;
            }

            setError(
              'De werkorder kon niet worden geladen.'
            );
          } finally {
            if (
              active
            ) {
              setLoading(
                false
              );
            }
          }
        };

      void fetchDetail();

      return () => {
        active =
          false;
      };
    },
    [
      id,
      navigate
    ]
  );

  /*
   * Haal alle foto's van de
   * werkorder op via het beveiligde
   * foto-endpoint.
   *
   * Een gewone <img src="/api/...">
   * kan onze Authorization-header
   * niet meesturen.
   *
   * Daarom halen we de foto via
   * Axios als Blob op.
   */
  useEffect(
    () => {
      if (
        !detail ||
        detail.fotos.length ===
          0
      ) {
        setFotoUrls(
          {}
        );

        return;
      }

      let active =
        true;

      const objectUrls:
        string[] = [];

      const loadFotos =
        async (): Promise<void> => {
          const urls:
            Record<
              number,
              string
            > = {};

          await Promise.all(
            detail.fotos.map(
              async foto => {
                try {
                  const blob =
                    await getFotoBlob(
                      detail.id,
                      foto.id
                    );

                  if (
                    !active
                  ) {
                    return;
                  }

                  const objectUrl =
                    URL.createObjectURL(
                      blob
                    );

                  objectUrls.push(
                    objectUrl
                  );

                  urls[
                    foto.id
                  ] =
                    objectUrl;
                } catch (
                  error
                ) {
                  console.error(
                    `Foto ${foto.id} kon niet worden geladen.`,
                    error
                  );
                }
              }
            )
          );

          if (
            active
          ) {
            setFotoUrls(
              urls
            );
          }
        };

      void loadFotos();

      return () => {
        active =
          false;

        objectUrls.forEach(
          objectUrl => {
            URL.revokeObjectURL(
              objectUrl
            );
          }
        );
      };
    },
    [
      detail
    ]
  );

  const handleDeleteFoto =
    async (
      fotoId: number
    ): Promise<void> => {
      if (
        !detail
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          'Weet u zeker dat u deze foto wilt verwijderen?'
        );

      if (
        !confirmed
      ) {
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

        /*
         * Eventuele Blob-URL
         * direct opruimen.
         */
        const objectUrl =
          fotoUrls[
            fotoId
          ];

        if (
          objectUrl
        ) {
          URL.revokeObjectURL(
            objectUrl
          );

          setFotoUrls(
            current => {
              const next = {
                ...current
              };

              delete next[
                fotoId
              ];

              return next;
            }
          );
        }

        if (
          selectedFoto?.id ===
          fotoId
        ) {
          setSelectedFoto(
            null
          );
        }

        setDetail(
          current => {
            if (
              !current
            ) {
              return current;
            }

            return {
              ...current,

              fotos:
                current
                  .fotos
                  .filter(
                    foto =>
                      foto.id !==
                      fotoId
                  )
            };
          }
        );
      } catch (
        error: unknown
      ) {
        window.alert(
          getErrorMessage(
            error,
            'De foto kon niet worden verwijderd.'
          )
        );
      } finally {
        setDeletingFotoId(
          null
        );
      }
    };

  const handleDeleteWerkorder =
    async (): Promise<void> => {
      if (
        !detail ||
        !isOwner
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Weet u zeker dat u werkorder ${detail.werkorder_id} naar de prullenbak wilt verplaatsen?\n\nU kunt de werkorder later vanuit de prullenbak herstellen.`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        setDeletingWerkorder(
          true
        );

        await deleteWerkorder(
          detail.id
        );

        navigate(
          '/werkorders',
          {
            replace:
              true
          }
        );
      } catch (
        error: unknown
      ) {
        window.alert(
          getErrorMessage(
            error,
            'De werkorder kon niet worden verwijderd.'
          )
        );
      } finally {
        setDeletingWerkorder(
          false
        );
      }
    };

  const toggleAccessUser = (
    userId: number
  ): void => {
    setAccessUserIds(
      current =>
        current.includes(
          userId
        )
          ? current.filter(
              currentId =>
                currentId !==
                userId
            )
          : [
              ...current,
              userId
            ]
    );
  };

  const handleSaveAccess =
    async (): Promise<void> => {
      if (
        !detail ||
        !isOwner
      ) {
        return;
      }

      try {
        setAccessSaving(
          true
        );

        setAssignmentMessage(
          ''
        );

        await updateWerkorderAccess(
          detail.id,
          accessUserIds
        );

        setAssignmentMessage(
          'Extra toegang succesvol opgeslagen.'
        );
      } catch (
        error: unknown
      ) {
        setAssignmentMessage(
          getErrorMessage(
            error,
            'De extra toegang kon niet worden opgeslagen.'
          )
        );
      } finally {
        setAccessSaving(
          false
        );
      }
    };

  const handleTransfer =
    async (): Promise<void> => {
      if (
        !detail ||
        selectedAssignee ===
          ''
      ) {
        return;
      }

      const normalizedReason =
        transferReason.trim();

      if (
        !normalizedReason
      ) {
        setAssignmentMessage(
          'Vul een reden voor de overdracht in.'
        );

        return;
      }

      if (
        selectedAssignee ===
        detail.assigned_to
      ) {
        setAssignmentMessage(
          'Deze gebruiker is al verantwoordelijk voor dit concept.'
        );

        return;
      }

      const user =
        users.find(
          item =>
            item.id ===
            selectedAssignee
        );

      if (
        !user
      ) {
        setAssignmentMessage(
          'De geselecteerde gebruiker is niet geldig.'
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Wilt u dit concept overdragen aan ${user.email}?`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        setAssignmentSaving(
          true
        );

        setAssignmentMessage(
          ''
        );

        await transferWerkorder(
          detail.id,
          selectedAssignee,
          normalizedReason
        );

        setDetail(
          current =>
            current
              ? {
                  ...current,

                  assigned_to:
                    selectedAssignee
                }
              : current
        );

        setAccessUserIds(
          current =>
            current.filter(
              userId =>
                userId !==
                selectedAssignee
            )
        );

        const history =
          await getAssignmentHistory(
            detail.id
          );

        setAssignmentHistory(
          history
        );

        setTransferReason(
          ''
        );

        setAssignmentMessage(
          'Het overdrachtsverzoek is verstuurd.'
        );
      } catch (
        error: unknown
      ) {
        setAssignmentMessage(
          getErrorMessage(
            error,
            'Het concept kon niet worden overgedragen.'
          )
        );
      } finally {
        setAssignmentSaving(
          false
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

  if (
    error
  ) {
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

  if (
    !detail
  ) {
    return null;
  }

  const isDraft =
    !Boolean(
      detail.is_voltooid
    );

  const materialenPerTip = (
    tip:
      Materiaal['tip']
  ) =>
    detail.materialen.filter(
      materiaal =>
        materiaal.tip ===
        tip
    );

  const assignedUser =
    users.find(
      user =>
        user.id ===
        detail.assigned_to
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
            {
              isDraft
                ? 'Concept'
                : 'Afgerond'
            }
          </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mt-4">
          {
            detail.werkorder_id
          }
        </h1>

        <div className="mt-5 flex flex-wrap gap-3">
          {isDraft && (
            <Link
              to={`/werkorders/${detail.id}/edit`}
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded"
            >
              Verdergaan met concept
            </Link>
          )}

          {isOwner && (
            <button
              type="button"
              onClick={
                handleDeleteWerkorder
              }
              disabled={
                deletingWerkorder
              }
              className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold px-5 py-2.5 rounded"
            >
              {
                deletingWerkorder
                  ? 'Verplaatsen...'
                  : 'Naar prullenbak'
              }
            </button>
          )}
        </div>

        {isDraft && (
          <>

            <div className="mt-6 border border-gray-200 rounded p-4">
              <h2 className="font-semibold text-gray-900">
                Verantwoordelijke
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Bekijk de huidige verantwoordelijke en draag het concept indien nodig over.
              </p>

              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
                <p className="text-xs text-gray-500">
                  Huidige verantwoordelijke
                </p>

                <p className="text-sm font-medium text-gray-900 mt-1">
                  {
                    assignedUser?.email ??
                    (
                      detail.assigned_to
                        ? `Gebruiker #${detail.assigned_to}`
                        : 'Niet toegewezen'
                    )
                  }
                </p>

                {assignedUser && (
                  <p className="text-xs text-gray-500 mt-1">
                    {
                      assignedUser.role
                    }
                  </p>
                )}
              </div>

              <div className="mt-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nieuwe verantwoordelijke
                </label>

                <select
                  value={
                    selectedAssignee
                  }
                  onChange={
                    event =>
                      setSelectedAssignee(
                        event
                          .target
                          .value
                          ? Number(
                              event
                                .target
                                .value
                            )
                          : ''
                      )
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">
                    Kies een gebruiker
                  </option>

                  {users.map(
                    user => (
                      <option
                        key={
                          user.id
                        }
                        value={
                          user.id
                        }
                      >
                        {
                          user.email
                        }{' '}
                        ({
                          user.role
                        })
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reden van overdracht *
                </label>

                <textarea
                  value={
                    transferReason
                  }
                  onChange={
                    event =>
                      setTransferReason(
                        event
                          .target
                          .value
                      )
                  }
                  rows={
                    3
                  }
                  maxLength={
                    1000
                  }
                  placeholder="Waarom wordt dit concept overgedragen?"
                  className="w-full border border-gray-300 rounded px-3 py-2 resize-y"
                />

                <p className="text-xs text-gray-500 mt-1 text-right">
                  {
                    transferReason
                      .length
                  }/1000
                </p>
              </div>

              <button
                type="button"
                disabled={
                  assignmentSaving ||
                  selectedAssignee ===
                    '' ||
                  selectedAssignee ===
                    detail.assigned_to ||
                  !transferReason
                    .trim()
                }
                onClick={() =>
                  void handleTransfer()
                }
                className="mt-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium px-4 py-2 rounded"
              >
                {
                  assignmentSaving
                    ? 'Overdragen...'
                    : 'Overdragen'
                }
              </button>

              <div className="mt-6 border-t border-gray-200 pt-5">
                <h3 className="text-sm font-semibold text-gray-900">
                  Overdrachtsgeschiedenis
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  De nieuwste overdracht staat bovenaan.
                </p>

                {
                  assignmentHistory
                    .length ===
                  0
                    ? (
                      <p className="text-sm text-gray-500 mt-3">
                        Nog geen overdrachten geregistreerd.
                      </p>
                    )
                    : (
                      <div className="mt-3 space-y-3">
                        {
                          assignmentHistory
                            .map(
                              item => (
                                <div
                                  key={
                                    item.id
                                  }
                                  className="border border-gray-200 rounded p-3 bg-gray-50"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                                    <p className="text-sm font-semibold text-gray-900">
                                      {
                                        item.to_user_email
                                      }
                                    </p>

                                    <span className="text-xs text-gray-500">
                                      {
                                        new Date(
                                          item.created_at
                                        )
                                          .toLocaleString(
                                            'nl-NL'
                                          )
                                      }
                                    </span>
                                  </div>

                                  <div className="mt-3 text-sm text-gray-600 space-y-1">
                                    <p>
                                      <span className="font-medium text-gray-700">
                                        Van:
                                      </span>{' '}
                                      {
                                        item.from_user_email ??
                                        'Onbekend'
                                      }
                                    </p>

                                    <p>
                                      <span className="font-medium text-gray-700">
                                        Naar:
                                      </span>{' '}
                                      {
                                        item.to_user_email
                                      }
                                    </p>

                                    <p>
                                      <span className="font-medium text-gray-700">
                                        Gewijzigd door:
                                      </span>{' '}
                                      {
                                        item.changed_by_email ??
                                        'Onbekend'
                                      }
                                    </p>

                                    <div className="pt-2">
                                      <p className="font-medium text-gray-700">
                                        Reden:
                                      </p>

                                      <p className="mt-1 whitespace-pre-wrap">
                                        {
                                          item.reason
                                        }
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )
                            )
                        }
                      </div>
                    )
                }
              </div>
            </div>

            {isOwner && (
              <div className="mt-4 border border-gray-200 rounded p-4">
                <h2 className="font-semibold text-gray-900">
                  Extra toegang
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Geef meerdere medewerkers of admins toegang tot dit concept.
                </p>

                {
                  users
                    .filter(
                      user =>
                        user.id !==
                        detail.assigned_to
                    )
                    .length ===
                  0
                    ? (
                      <p className="text-sm text-gray-500 mt-4">
                        Geen andere gebruikers beschikbaar.
                      </p>
                    )
                    : (
                      <div className="mt-4 space-y-2">
                        {
                          users
                            .filter(
                              user =>
                                user.id !==
                                detail.assigned_to
                            )
                            .map(
                              user => (
                                <label
                                  key={
                                    user.id
                                  }
                                  className="flex items-center gap-3 border border-gray-200 rounded px-3 py-2 cursor-pointer hover:bg-gray-50"
                                >
                                  <input
                                    type="checkbox"
                                    checked={
                                      accessUserIds
                                        .includes(
                                          user.id
                                        )
                                    }
                                    onChange={() =>
                                      toggleAccessUser(
                                        user.id
                                      )
                                    }
                                  />

                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {
                                        user.email
                                      }
                                    </p>

                                    <p className="text-xs text-gray-500">
                                      {
                                        user.role
                                      }
                                    </p>
                                  </div>
                                </label>
                              )
                            )
                        }
                      </div>
                    )
                }

                <button
                  type="button"
                  disabled={
                    accessSaving
                  }
                  onClick={() =>
                    void handleSaveAccess()
                  }
                  className="mt-4 bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white font-medium px-4 py-2 rounded"
                >
                  {
                    accessSaving
                      ? 'Opslaan...'
                      : 'Toegang opslaan'
                  }
                </button>
              </div>
            )}

            {assignmentMessage && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 text-blue-800 rounded text-sm">
                {
                  assignmentMessage
                }
              </div>
            )}
          </>
        )}

        <div className="grid grid-cols-2 gap-4 my-6 text-sm">
          <div>
            <span className="text-gray-500">
              Aankomsttijd
            </span>

            <p className="font-medium">
              {
                detail.aankomsttijd ??
                '-'
              }
            </p>
          </div>

          <div>
            <span className="text-gray-500">
              Eindtijd
            </span>

            <p className="font-medium">
              {
                detail.eindtijd ??
                '-'
              }
            </p>
          </div>

          <div>
            <span className="text-gray-500">
              Datum
            </span>

            <p className="font-medium">
              {
                detail.datum
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

          <div>
            <span className="text-gray-500">
              Status
            </span>

            <p className="font-medium">
              {
                detail.status ??
                'Nog niet ingevuld'
              }
            </p>
          </div>
        </div>

        <div className="mb-6">
          <span className="text-gray-500 text-sm">
            Uitgevoerde werkzaamheden
          </span>

          <p className="mt-1 whitespace-pre-wrap">
            {
              detail
                .uitgevoerde_werkzaamheden ??
              'Nog niet ingevuld'
            }
          </p>
        </div>

        {(
          [
            'klant',
            'bedrijf',
            'verkoop'
          ] as
            Materiaal['tip'][]
        ).map(
          tip => {
            const items =
              materialenPerTip(
                tip
              );

            if (
              items.length ===
              0
            ) {
              return null;
            }

            return (
              <div
                key={
                  tip
                }
                className="mb-6"
              >
                <h3 className="font-semibold mb-2">
                  {
                    tipLabels[
                      tip
                    ]
                  }
                </h3>

                {
                  items.map(
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
                  )
                }
              </div>
            );
          }
        )}

        {
          detail
            .materialen
            .length ===
          0 && (
            <div className="mb-6">
              <h3 className="font-semibold">
                Materialen
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Geen materialen geregistreerd.
              </p>
            </div>
          )
        }

        <div>
          <h3 className="font-semibold mb-3">
            Foto&apos;s en beschrijvingen
          </h3>

          {
            detail
              .fotos
              .length ===
            0
              ? (
                <p className="text-sm text-gray-500">
                  Geen foto&apos;s geregistreerd.
                </p>
              )
              : (
                <div className="grid grid-cols-2 gap-4">
                  {
                    detail
                      .fotos
                      .map(
                        foto => (
                          <div
                            key={
                              foto.id
                            }
                            className="relative"
                          >
                            {
                              fotoUrls[
                                foto.id
                              ]
                                ? (
                                  <img
                                    src={
                                      fotoUrls[
                                        foto.id
                                      ]
                                    }
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
                                )
                                : (
                                  <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500">
                                    Foto laden...
                                  </div>
                                )
                            }

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
                                className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7 disabled:bg-gray-400"
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
                      )
                  }
                </div>
              )
          }
        </div>
      </div>

      {
        selectedFoto &&
        fotoUrls[
          selectedFoto.id
        ] && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() =>
              setSelectedFoto(
                null
              )
            }
          >
            <img
              src={
                fotoUrls[
                  selectedFoto.id
                ]
              }
              alt={
                selectedFoto.beschrijving ??
                'Werkorderfoto'
              }
              className="max-w-3xl max-h-[85vh] object-contain"
            />
          </div>
        )
      }
    </div>
  );
}