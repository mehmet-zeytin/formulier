import {
  useEffect,
  useState
} from 'react';

import {
  Link
} from 'react-router-dom';

import {
  changeUserRole,
  createUser,
  deleteUser,
  getUsers,
  resetUserPassword,
  type UserListItem
} from '../services/userService';

import {
  getCurrentUser,  
} from '../services/authService';

const getErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (
    typeof error === 'object' &&
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
      apiError.response?.data
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

export default function UsersPage() {
  const currentUser =
    getCurrentUser();

  const [users, setUsers] =
    useState<UserListItem[]>([]);

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [role, setRole] =
    useState<
      'admin' |
      'medewerker'
    >('medewerker');

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    operationUserId,
    setOperationUserId
  ] = useState<number | null>(
    null
  );

  const [
    resetUserId,
    setResetUserId
  ] = useState<number | null>(
    null
  );

  const [
    newPassword,
    setNewPassword
  ] = useState('');

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const isOwner =
    currentUser?.role ===
    'owner';

  const loadUsers = async (
    showLoading = false
  ) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const data =
        await getUsers();

      setUsers(data);
    } catch (
      error: unknown
    ) {
      setError(
        getErrorMessage(
          error,
          'Gebruikers konden niet worden geladen.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers(true);
  }, []);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleCreateUser =
    async (
      event:
        React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      clearMessages();

      try {
        setSaving(true);

        await createUser({
          email:
            email.trim(),

          password,

          role:
            isOwner
              ? role
              : 'medewerker'
        });

        setEmail('');
        setPassword('');
        setRole(
          'medewerker'
        );

        setSuccess(
          'Gebruiker succesvol aangemaakt.'
        );

        await loadUsers();
      } catch (
        error: unknown
      ) {
        setError(
          getErrorMessage(
            error,
            'De gebruiker kon niet worden aangemaakt.'
          )
        );
      } finally {
        setSaving(false);
      }
    };

  const handleRoleChange =
    async (
      user: UserListItem,
      newRole:
        | 'admin'
        | 'medewerker'
    ) => {
      if (
        user.role === newRole
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Wilt u de rol van ${user.email} wijzigen van ${user.role} naar ${newRole}?`
        );

      if (!confirmed) {
        return;
      }

      clearMessages();

      try {
        setOperationUserId(
          user.id
        );

        await changeUserRole(
          user.id,
          newRole
        );

        setSuccess(
          'Gebruikersrol succesvol gewijzigd.'
        );

        await loadUsers();
      } catch (
        error: unknown
      ) {
        setError(
          getErrorMessage(
            error,
            'De gebruikersrol kon niet worden gewijzigd.'
          )
        );
      } finally {
        setOperationUserId(
          null
        );
      }
    };

  const handlePasswordReset =
    async (
      userId: number
    ) => {
      clearMessages();

      if (
        newPassword.length < 8
      ) {
        setError(
          'Het wachtwoord moet minimaal 8 tekens bevatten.'
        );

        return;
      }

      try {
        setOperationUserId(
          userId
        );

        await resetUserPassword(
          userId,
          newPassword
        );

        setNewPassword('');
        setResetUserId(null);

        setSuccess(
          'Wachtwoord succesvol gewijzigd.'
        );
      } catch (
        error: unknown
      ) {
        setError(
          getErrorMessage(
            error,
            'Het wachtwoord kon niet worden gewijzigd.'
          )
        );
      } finally {
        setOperationUserId(
          null
        );
      }
    };

  const handleDelete =
    async (
      user: UserListItem
    ) => {
      const confirmed =
        window.confirm(
          `Weet u zeker dat u ${user.email} wilt verwijderen? De bestaande werkorders blijven behouden.`
        );

      if (!confirmed) {
        return;
      }

      clearMessages();

      try {
        setOperationUserId(
          user.id
        );

        await deleteUser(
          user.id
        );

        setSuccess(
          'Gebruiker succesvol verwijderd.'
        );

        await loadUsers();
      } catch (
        error: unknown
      ) {
        setError(
          getErrorMessage(
            error,
            'De gebruiker kon niet worden verwijderd.'
          )
        );
      } finally {
        setOperationUserId(
          null
        );
      }
    };

  if (
    !currentUser ||
    (
      currentUser.role !==
        'owner' &&
      currentUser.role !==
        'admin'
    )
  ) {
    return (
      <div className="p-8 text-center text-red-600">
        Geen toegang.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link
            to="/werkorders"
            className="text-blue-600 hover:underline text-sm"
          >
            ← Terug naar werkorders
          </Link>

          <h1 className="text-2xl font-bold mt-4 text-gray-900">
            Gebruikersbeheer
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Beheer gebruikers, rollen en wachtwoorden.
          </p>
        </div>

        <div className="bg-white rounded shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            Nieuwe gebruiker
          </h2>

          <form
            onSubmit={
              handleCreateUser
            }
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">
                E-mail
              </label>

              <input
                type="email"
                value={email}
                onChange={event =>
                  setEmail(
                    event.target.value
                  )
                }
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Wachtwoord
              </label>

              <input
                type="password"
                value={password}
                onChange={event =>
                  setPassword(
                    event.target.value
                  )
                }
                minLength={8}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />

              <p className="text-xs text-gray-500 mt-1">
                Minimaal 8 tekens.
              </p>
            </div>

            {isOwner ? (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Rol
                </label>

                <select
                  value={role}
                  onChange={event =>
                    setRole(
                      event.target.value as
                        | 'admin'
                        | 'medewerker'
                    )
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="medewerker">
                    Medewerker
                  </option>

                  <option value="admin">
                    Admin
                  </option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Rol
                </label>

                <div className="w-full border border-gray-200 bg-gray-50 rounded px-3 py-2 text-gray-600">
                  Medewerker
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  Alleen de owner kan nieuwe admins aanmaken.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-5 py-2 rounded"
            >
              {saving
                ? 'Opslaan...'
                : 'Gebruiker aanmaken'}
            </button>
          </form>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 p-3 bg-red-100 text-red-700 rounded"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-4 p-3 bg-green-100 text-green-700 rounded"
          >
            {success}
          </div>
        )}

        <div className="bg-white rounded shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">
              Gebruikers
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-gray-500">
              Laden...
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {users.map(user => {
                const isCurrentUser =
                  user.id ===
                  currentUser.userId;

                const isBusy =
                  operationUserId ===
                  user.id;

                const isTargetOwner =
                  user.role ===
                  'owner';

                const canChangeRole =
                  isOwner &&
                  !isCurrentUser &&
                  !isTargetOwner;

                const canDelete =
                  !isCurrentUser &&
                  !isTargetOwner &&
                  (
                    isOwner ||
                    (
                      currentUser.role ===
                        'admin' &&
                      user.role ===
                        'medewerker'
                    )
                  );

                const canResetPassword =
                  isOwner
                    ? (
                        !isTargetOwner ||
                        isCurrentUser
                      )
                    : user.role ===
                        'medewerker';

                return (
                  <div
                    key={user.id}
                    className="p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {user.email}
                          </p>

                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            {user.role}
                          </span>

                          {isCurrentUser && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              Uw account
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-500 mt-1">
                          Aangemaakt:{' '}
                          {new Date(
                            user.created_at
                          ).toLocaleString(
                            'nl-NL'
                          )}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {canChangeRole ? (
                          <select
                            value={
                              user.role ===
                              'admin'
                                ? 'admin'
                                : 'medewerker'
                            }
                            disabled={isBusy}
                            onChange={event =>
                              void handleRoleChange(
                                user,
                                event.target
                                  .value as
                                  | 'admin'
                                  | 'medewerker'
                              )
                            }
                            className="border border-gray-300 rounded px-3 py-2 text-sm"
                          >
                            <option value="medewerker">
                              Medewerker
                            </option>

                            <option value="admin">
                              Admin
                            </option>
                          </select>
                        ) : (
                          <span className="border border-gray-200 bg-gray-50 text-gray-500 rounded px-3 py-2 text-sm">
                            {user.role}
                          </span>
                        )}

                        <button
                          type="button"
                          disabled={
                            isBusy ||
                            !canResetPassword
                          }
                          onClick={() => {
                            clearMessages();

                            if (
                              resetUserId ===
                              user.id
                            ) {
                              setResetUserId(
                                null
                              );

                              setNewPassword(
                                ''
                              );
                            } else {
                              setResetUserId(
                                user.id
                              );

                              setNewPassword(
                                ''
                              );
                            }
                          }}
                          className="border border-gray-300 hover:bg-gray-50 disabled:border-gray-200 disabled:text-gray-400 px-3 py-2 rounded text-sm"
                        >
                          Wachtwoord wijzigen
                        </button>

                        <button
                          type="button"
                          disabled={
                            isBusy ||
                            !canDelete
                          }
                          onClick={() =>
                            void handleDelete(
                              user
                            )
                          }
                          className="border border-red-300 text-red-700 hover:bg-red-50 disabled:border-gray-200 disabled:text-gray-400 px-3 py-2 rounded text-sm"
                        >
                          Verwijderen
                        </button>
                      </div>
                    </div>

                    {resetUserId ===
                      user.id &&
                      canResetPassword && (
                      <div className="mt-4 bg-gray-50 border border-gray-200 rounded p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nieuw wachtwoord voor{' '}
                          {user.email}
                        </label>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="password"
                            value={
                              newPassword
                            }
                            onChange={event =>
                              setNewPassword(
                                event.target.value
                              )
                            }
                            minLength={8}
                            placeholder="Minimaal 8 tekens"
                            className="flex-1 border border-gray-300 rounded px-3 py-2"
                          />

                          <button
                            type="button"
                            disabled={
                              isBusy ||
                              newPassword.length <
                                8
                            }
                            onClick={() =>
                              void handlePasswordReset(
                                user.id
                              )
                            }
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium px-4 py-2 rounded"
                          >
                            Nieuw wachtwoord opslaan
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setResetUserId(
                                null
                              );

                              setNewPassword(
                                ''
                              );
                            }}
                            className="border border-gray-300 px-4 py-2 rounded"
                          >
                            Annuleren
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}