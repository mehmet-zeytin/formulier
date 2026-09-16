import {
  useState
} from 'react';

import {
  useNavigate
} from 'react-router-dom';

import {
  login,
  verifyMfa
} from '../services/authService';

export default function LoginPage() {
  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [mfaCode, setMfaCode] =
    useState('');

  const [
    challengeToken,
    setChallengeToken
  ] =
    useState('');

  const [
    qrCodeDataUrl,
    setQrCodeDataUrl
  ] =
    useState<string | null>(
      null
    );

  const [
    requiresMfa,
    setRequiresMfa
  ] =
    useState(false);

  const [
    requiresSetup,
    setRequiresSetup
  ] =
    useState(false);

  const [error, setError] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const navigate =
    useNavigate();

  const getErrorMessage = (
    error: unknown,
    fallback: string
  ): string => {
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error
    ) {
      const axiosError =
        error as {
          response?: {
            data?: {
              message?: string;
            };
          };
        };

      return (
        axiosError.response
          ?.data?.message ??
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

  const handleLoginSubmit =
    async (
      event:
        React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setError('');

      try {
        setLoading(true);

        const result =
          await login(
            email.trim(),
            password
          );

        setChallengeToken(
          result.challengeToken
        );

        setRequiresMfa(
          result.requiresMfa
        );

        setRequiresSetup(
          result.requiresSetup
        );

        setQrCodeDataUrl(
          result.qrCodeDataUrl ??
          null
        );

        setMfaCode('');
      } catch (
        error: unknown
      ) {
        setError(
          getErrorMessage(
            error,
            'Inloggen is mislukt.'
          )
        );
      } finally {
        setLoading(false);
      }
    };

  const handleMfaSubmit =
    async (
      event:
        React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setError('');

      if (
        !challengeToken
      ) {
        setError(
          'De MFA-sessie ontbreekt. Log opnieuw in.'
        );

        return;
      }

      if (
        !/^\d{6}$/.test(
          mfaCode
        )
      ) {
        setError(
          'Voer een geldige 6-cijferige MFA-code in.'
        );

        return;
      }

      try {
        setLoading(true);

        await verifyMfa(
          challengeToken,
          mfaCode
        );

        navigate(
          '/werkorders',
          {
            replace: true
          }
        );
      } catch (
        error: unknown
      ) {
        setError(
          getErrorMessage(
            error,
            'MFA-verificatie is mislukt.'
          )
        );
      } finally {
        setLoading(false);
      }
    };

  const handleRestartLogin =
    () => {
      setRequiresMfa(false);
      setRequiresSetup(false);
      setChallengeToken('');
      setQrCodeDataUrl(null);
      setMfaCode('');
      setPassword('');
      setError('');
    };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white p-8 rounded shadow">
        {!requiresMfa ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Inloggen
            </h1>

            <p className="text-sm text-gray-600 mb-6">
              Log in om verder te gaan met het werkordersysteem.
            </p>

            <form
              onSubmit={
                handleLoginSubmit
              }
            >
              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  E-mail
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={
                    event =>
                      setEmail(
                        event.target.value
                      )
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Wachtwoord
                </label>

                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={
                    event =>
                      setPassword(
                        event.target.value
                      )
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded"
              >
                {loading
                  ? 'Bezig met inloggen...'
                  : 'Inloggen'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              MFA-verificatie
            </h1>

            {requiresSetup ? (
              <p className="text-sm text-gray-600 mb-4">
                Scan de QR-code met uw authenticator-app en voer daarna de 6-cijferige code in.
              </p>
            ) : (
              <p className="text-sm text-gray-600 mb-6">
                Voer de 6-cijferige code uit uw authenticator-app in.
              </p>
            )}

            {requiresSetup &&
              qrCodeDataUrl && (
                <div className="mb-6 flex justify-center">
                  <img
                    src={
                      qrCodeDataUrl
                    }
                    alt="QR-code voor MFA"
                    className="w-52 h-52 border rounded"
                  />
                </div>
              )}

            <form
              onSubmit={
                handleMfaSubmit
              }
            >
              <div className="mb-6">
                <label
                  htmlFor="mfaCode"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  MFA-code
                </label>

                <input
                  id="mfaCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={mfaCode}
                  onChange={
                    event =>
                      setMfaCode(
                        event.target.value
                          .replace(
                            /\D/g,
                            ''
                          )
                          .slice(
                            0,
                            6
                          )
                      )
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-center text-xl tracking-[0.4em]"
                  placeholder="000000"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  mfaCode.length !== 6
                }
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded"
              >
                {loading
                  ? 'Code controleren...'
                  : 'Code controleren'}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={
                  handleRestartLogin
                }
                className="w-full mt-3 text-sm text-gray-600 hover:text-gray-900"
              >
                Terug naar inloggen
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}