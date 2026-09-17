import {
  useEffect,
  useState
} from 'react';

import {
  Link
} from 'react-router-dom';

import {
  changeUserPassword,
  changeUserRole,
  createUser,
  deleteUser,
  getDeletedUsers,
  getUsers,
  resetUserMfa,
  restoreUser,
  type UserListItem
} from '../services/userService';

import {
  getCurrentUserFromServer,
  type CurrentUserResponse
} from '../services/authService';

const getApiMessage = (
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

  return fallback;
};

const formatDate = (
  value:
    | string
    | null
    | undefined
): string => {
  if (!value) {
    return '-';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    'nl-NL'
  );
};

export default function UsersPage() {
  const [
    currentUser,
    setCurrentUser
  ] =
    useState<CurrentUserResponse | null>(
      null
    );

  const isOwner =
    currentUser?.role ===
    'owner';

  const isAdmin =
    currentUser?.role ===
    'admin';

  const [
    users,
    setUsers
  ] = useState<
    UserListItem[]
  >([]);

  const [
    deletedUsers,
    setDeletedUsers
  ] = useState<
    UserListItem[]
  >([]);

  const [
    email,
    setEmail
  ] = useState('');

  const [
    password,
    setPassword
  ] = useState('');

  const [
    role,
    setRole
  ] = useState<
    | 'admin'
    | 'medewerker'
  >(
    'medewerker'
  );

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    saving,
    setSaving
  ] = useState(false);

  const [
    error,
    setError
  ] = useState('');

  const [
    success,
    setSuccess
  ] = useState('');

  const loadUsers =
    async (): Promise<void> => {
      try {
        setError('');

        /*
         * Haal eerst de actuele
         * gebruiker op bij de backend.
         *
         * Hierdoor gebruiken we niet
         * meer de mogelijk verouderde
         * rol uit het JWT.
         */
        const currentUserData =
          await getCurrentUserFromServer();

        setCurrentUser(
          currentUserData
        );

        const active =
          await getUsers();

        setUsers(
          active
        );

        /*
         * Alleen de actuele owner
         * mag verwijderde gebruikers
         * ophalen.
         */
        if (
          currentUserData.role ===
          'owner'
        ) {
          const deleted =
            await getDeletedUsers();

          setDeletedUsers(
            deleted
          );
        } else {
          setDeletedUsers(
            []
          );
        }
      } catch (
        error: unknown
      ) {
        setError(
          getApiMessage(
            error,
            'Gebruikers konden niet worden geladen.'
          )
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleSubmit =
    async (
      event:
        React.FormEvent<
          HTMLFormElement
        >
    ): Promise<void> => {
      event.preventDefault();

      setError('');
      setSuccess('');

      try {
        setSaving(
          true
        );

        await createUser({
          email:
            email.trim(),

          password,

          role
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
          getApiMessage(
            error,
            'De gebruiker kon niet worden aangemaakt.'
          )
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  const handleRoleChange =
    async (
      user:
        UserListItem,

      newRole:
        | 'admin'
        | 'medewerker'
    ): Promise<void> => {
      setError('');
      setSuccess('');

      try {
        await changeUserRole(
          user.id,
          newRole
        );

        setSuccess(
          `De rol van ${user.email} is gewijzigd.`
        );

        await loadUsers();
      } catch (
        error: unknown
      ) {
        setError(
          getApiMessage(
            error,
            'De gebruikersrol kon niet worden gewijzigd.'
          )
        );
      }
    };

  const handlePasswordChange =
    async (
      user:
        UserListItem
    ): Promise<void> => {
      const newPassword =
        window.prompt(
          `Nieuw wachtwoord voor ${user.email}:`
        );

      if (
        newPassword ===
        null
      ) {
        return;
      }

      if (
        newPassword.length <
        8
      ) {
        window.alert(
          'Het wachtwoord moet minimaal 8 tekens bevatten.'
        );

        return;
      }

      setError('');
      setSuccess('');

      try {
        await changeUserPassword(
          user.id,
          newPassword
        );

        setSuccess(
          `Het wachtwoord van ${user.email} is gewijzigd.`
        );
      } catch (
        error: unknown
      ) {
        setError(
          getApiMessage(
            error,
            'Het wachtwoord kon niet worden gewijzigd.'
          )
        );
      }
    };

  const handleMfaReset =
    async (
      user:
        UserListItem
    ): Promise<void> => {
      const confirmed =
        window.confirm(
          `Weet u zeker dat u MFA voor ${user.email} wilt resetten?\n\nDe huidige authenticator-koppeling wordt verwijderd. De gebruiker moet bij de volgende login MFA opnieuw instellen.`
        );

      if (!confirmed) {
        return;
      }

      setError('');
      setSuccess('');

      try {
        await resetUserMfa(
          user.id
        );

        setSuccess(
          `MFA van ${user.email} is succesvol gereset. De gebruiker moet bij de volgende login MFA opnieuw instellen.`
        );

        await loadUsers();
      } catch (
        error: unknown
      ) {
        setError(
          getApiMessage(
            error,
            'MFA kon niet worden gereset.'
          )
        );
      }
    };

  const handleDelete =
    async (
      user:
        UserListItem
    ): Promise<void> => {
      const confirmed =
        window.confirm(
          `Weet u zeker dat u ${user.email} wilt verwijderen?\n\nDe gebruiker wordt bewaard in de verwijderde gebruikers.`
        );

      if (!confirmed) {
        return;
      }

      setError('');
      setSuccess('');

      try {
        await deleteUser(
          user.id
        );

        setSuccess(
          `${user.email} is verwijderd.`
        );

        await loadUsers();
      } catch (
        error: unknown
      ) {
        setError(
          getApiMessage(
            error,
            'De gebruiker kon niet worden verwijderd.'
          )
        );
      }
    };

  const handleRestore =
    async (
      user:
        UserListItem
    ): Promise<void> => {
      const confirmed =
        window.confirm(
          `Wilt u ${user.email} herstellen?`
        );

      if (!confirmed) {
        return;
      }

      setError('');
      setSuccess('');

      try {
        await restoreUser(
          user.id
        );

        setSuccess(
          `${user.email} is hersteld.`
        );

        await loadUsers();
      } catch (
        error: unknown
      ) {
        setError(
          getApiMessage(
            error,
            'De gebruiker kon niet worden hersteld.'
          )
        );
      }
    };

  /*
   * Eerst laden.
   *
   * Anders zou currentUser tijdens
   * de eerste render nog null zijn
   * en tijdelijk "Geen toegang"
   * worden weergegeven.
   */
  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Laden...
      </div>
    );
  }

  if (
    !isOwner &&
    !isAdmin
  ) {
    return (
      <div className="p-8 text-center text-red-600">
        Geen toegang.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            to="/werkorders"
            className="text-blue-600 hover:underline text-sm"
          >
            ← Terug naar werkorders
          </Link>

          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            Gebruikersbeheer
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Beheer gebruikers, rollen en wachtwoorden.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded border border-green-200 bg-green-50 text-green-700 text-sm">
            {success}
          </div>
        )}

        <form
          onSubmit={
            handleSubmit
          }
          className="bg-white border border-gray-200 rounded shadow-sm p-5 mb-5"
        >
          <h2 className="font-semibold text-gray-900 mb-4">
            Nieuwe gebruiker
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              E-mail
            </label>

            <input
              type="email"
              required
              value={
                email
              }
              onChange={
                event =>
                  setEmail(
                    event.target.value
                  )
              }
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Wachtwoord
            </label>

            <input
              type="password"
              required
              minLength={
                8
              }
              value={
                password
              }
              onChange={
                event =>
                  setPassword(
                    event.target.value
                  )
              }
              className="w-full border border-gray-300 rounded px-3 py-2"
            />

            <p className="text-xs text-gray-500 mt-1">
              Minimaal 8 tekens.
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Rol
            </label>

            <select
              value={
                role
              }
              onChange={
                event =>
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

              {isOwner && (
                <option value="admin">
                  Admin
                </option>
              )}
            </select>
          </div>

          <button
            type="submit"
            disabled={
              saving
            }
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-4 py-2 rounded"
          >
            {saving
              ? 'Aanmaken...'
              : 'Gebruiker aanmaken'}
          </button>
        </form>

        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">
              Gebruikers
            </h2>
          </div>

          {users.length ===
          0 ? (
            <div className="p-4 text-sm text-gray-500">
              Geen gebruikers gevonden.
            </div>
          ) : (
            users.map(
              user => {
                const isSelf =
                  user.id ===
                  currentUser?.userId;

                const isTargetOwner =
                  user.role ===
                  'owner';

                const adminCanManage =
                  isAdmin &&
                  user.role ===
                    'medewerker';

                const canManage =
                  !isSelf &&
                  !isTargetOwner &&
                  (
                    isOwner ||
                    adminCanManage
                  );

                return (
                  <div
                    key={
                      user.id
                    }
                    className="p-4 border-b border-gray-200 last:border-b-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {
                            user.email
                          }
                        </span>

                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {
                            user.role
                          }
                        </span>

                        {isSelf && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            Uw account
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-1">
                        Aangemaakt:{' '}
                        {
                          formatDate(
                            user.created_at
                          )
                        }
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {isTargetOwner ? (
                        <button
                          type="button"
                          disabled
                          className="border border-gray-200 text-gray-500 px-3 py-2 rounded text-sm"
                        >
                          owner
                        </button>
                      ) : canManage ? (
                        <select
                          value={
                            user.role
                          }
                          onChange={
                            event =>
                              void handleRoleChange(
                                user,
                                event
                                  .target
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

                          {isOwner && (
                            <option value="admin">
                              Admin
                            </option>
                          )}
                        </select>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="border border-gray-200 text-gray-400 px-3 py-2 rounded text-sm"
                        >
                          {
                            user.role
                          }
                        </button>
                      )}

                      {(
                        canManage ||
                        isSelf
                      ) && (
                        <button
                          type="button"
                          onClick={() =>
                            void handlePasswordChange(
                              user
                            )
                          }
                          className="border border-gray-300 hover:bg-gray-50 px-3 py-2 rounded text-sm"
                        >
                          Wachtwoord wijzigen
                        </button>
                      )}

                      {canManage && (
                        <button
                          type="button"
                          onClick={() =>
                            void handleMfaReset(
                              user
                            )
                          }
                          className="border border-amber-300 text-amber-700 hover:bg-amber-50 px-3 py-2 rounded text-sm"
                        >
                          MFA resetten
                        </button>
                      )}

                      {canManage ? (
                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(
                              user
                            )
                          }
                          className="border border-red-300 text-red-600 hover:bg-red-50 px-3 py-2 rounded text-sm"
                        >
                          Verwijderen
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="border border-gray-200 text-gray-400 px-3 py-2 rounded text-sm"
                        >
                          Verwijderen
                        </button>
                      )}
                    </div>
                  </div>
                );
              }
            )
          )}
        </div>

        {isOwner && (
          <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden mt-6">
            <div className="px-4 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">
                Verwijderde gebruikers
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Verwijderde accounts en hun verwijderdatum.
              </p>
            </div>

            {deletedUsers.length ===
            0 ? (
              <div className="p-4 text-sm text-gray-500">
                Geen verwijderde gebruikers.
              </div>
            ) : (
              deletedUsers.map(
                user => (
                  <div
                    key={
                      user.id
                    }
                    className="p-4 border-b border-gray-200 last:border-b-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gray-50/50"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-700">
                          {
                            user.email
                          }
                        </span>

                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                          {
                            user.role
                          }
                        </span>

                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                          Verwijderd
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        Aangemaakt:{' '}
                        {
                          formatDate(
                            user.created_at
                          )
                        }
                      </p>

                      <p className="text-xs text-red-600 mt-1">
                        Verwijderd:{' '}
                        {
                          formatDate(
                            user.deleted_at
                          )
                        }
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        void handleRestore(
                          user
                        )
                      }
                      className="border border-blue-300 text-blue-600 hover:bg-blue-50 px-3 py-2 rounded text-sm"
                    >
                      Herstellen
                    </button>
                  </div>
                )
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}