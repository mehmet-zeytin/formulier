import {
  useState
} from 'react';

import {
  useNavigate
} from 'react-router-dom';

import {
  login
} from '../services/authService';

export default function LoginPage() {
  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [error, setError] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const navigate =
    useNavigate();

  const handleSubmit = async (
    event:
      React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError('');

    try {
      setLoading(true);

      await login(
        email.trim(),
        password
      );

      navigate(
        '/werkorders',
        {
          replace: true
        }
      );
    } catch (error: unknown) {
      let message =
        'Inloggen is mislukt.';

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

        message =
          axiosError.response
            ?.data?.message ??
          message;
      } else if (
        error instanceof Error
      ) {
        message =
          error.message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Inloggen
        </h1>

        <p className="text-sm text-gray-600 mb-6">
          Log in om verder te gaan met het werkordersysteem.
        </p>

        <form
          onSubmit={
            handleSubmit
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
              onChange={event =>
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
              onChange={event =>
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
      </div>
    </div>
  );
}