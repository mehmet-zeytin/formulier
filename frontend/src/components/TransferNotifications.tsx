import {
  useCallback,
  useEffect,
  useState
} from 'react';

import {
  Link
} from 'react-router-dom';

import axios from 'axios';

import {
  acceptTransferRequest,
  getPendingTransferRequests,
  rejectTransferRequest
} from '../services/werkorderService';

import type {
  TransferRequest
} from '../services/werkorderService';

export default function TransferNotifications() {
  const [
    requests,
    setRequests
  ] = useState<TransferRequest[]>([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState('');

  const [
    busyRequestId,
    setBusyRequestId
  ] = useState<number | null>(
    null
  );

  const [
    rejectingRequestId,
    setRejectingRequestId
  ] = useState<number | null>(
    null
  );

  const [
    rejectionReason,
    setRejectionReason
  ] = useState('');

  const loadRequests =
    useCallback(async () => {
      try {
        setError('');

        const result =
          await getPendingTransferRequests();

        setRequests(result);
      } catch (err) {
        const message =
          axios.isAxiosError(err)
            ? err.response?.data
                ?.message
            : null;

        setError(
          message ||
          'De overdrachtsverzoeken konden niet worden geladen.'
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const handleAccept =
    async (
      requestId: number
    ) => {
      try {
        setError('');
        setBusyRequestId(
          requestId
        );

        await acceptTransferRequest(
        requestId
        );

        window.location.reload();
      } catch (err) {
        const message =
          axios.isAxiosError(err)
            ? err.response?.data
                ?.message
            : null;

        setError(
          message ||
          'De overdracht kon niet worden geaccepteerd.'
        );
      } finally {
        setBusyRequestId(null);
      }
    };

  const startReject =
    (
      requestId: number
    ) => {
      setError('');
      setRejectingRequestId(
        requestId
      );
      setRejectionReason('');
    };

  const cancelReject = () => {
    setRejectingRequestId(null);
    setRejectionReason('');
    setError('');
  };

  const handleReject =
    async (
      requestId: number
    ) => {
      const reason =
        rejectionReason.trim();

      if (!reason) {
        setError(
          'Vul een reden voor weigering in.'
        );

        return;
      }

      try {
        setError('');
        setBusyRequestId(
          requestId
        );

        await rejectTransferRequest(
          requestId,
          reason
        );

        setRejectingRequestId(
          null
        );

        setRejectionReason('');

        await loadRequests();
      } catch (err) {
        const message =
          axios.isAxiosError(err)
            ? err.response?.data
                ?.message
            : null;

        setError(
          message ||
          'De overdracht kon niet worden geweigerd.'
        );
      } finally {
        setBusyRequestId(null);
      }
    };

  if (loading) {
    return null;
  }

  if (
    requests.length === 0 &&
    !error
  ) {
    return null;
  }

  return (
    <div className="mx-auto mb-6 max-w-6xl px-4 pt-4">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {requests.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 shadow-sm">
          <div className="border-b border-blue-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Overdrachtsverzoeken
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              U heeft{' '}
              {requests.length}{' '}
              openstaand
              {requests.length === 1
                ? ' overdrachtsverzoek'
                : 'e overdrachtsverzoeken'}
              .
            </p>
          </div>

          <div className="divide-y divide-blue-200">
            {requests.map(
              request => {
                const isBusy =
                  busyRequestId ===
                  request.id;

                const isRejecting =
                  rejectingRequestId ===
                  request.id;

                return (
                  <div
                    key={
                      request.id
                    }
                    className="p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-slate-500">
                            Werkorder
                          </span>

                          <div>
                            <Link
                              to={`/werkorders/${request.werkorder_id}`}
                              className="font-semibold text-blue-700 hover:underline"
                            >
                              {
                                request.werkorder_nummer
                              }
                            </Link>
                          </div>
                        </div>

                        <div className="text-sm text-slate-700">
                          <strong>
                            Van:
                          </strong>{' '}
                          {request.from_user_email ||
                            'Onbekend'}
                        </div>

                        <div className="text-sm text-slate-700">
                          <strong>
                            Aangevraagd door:
                          </strong>{' '}
                          {
                            request.requested_by_email
                          }
                        </div>

                        <div className="text-sm text-slate-700">
                          <strong>
                            Reden:
                          </strong>{' '}
                          {
                            request.reason
                          }
                        </div>
                      </div>

                      {!isRejecting && (
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={
                              isBusy
                            }
                            onClick={() =>
                              void handleAccept(
                                request.id
                              )
                            }
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isBusy
                              ? 'Bezig...'
                              : 'Accepteren'}
                          </button>

                          <button
                            type="button"
                            disabled={
                              isBusy
                            }
                            onClick={() =>
                              startReject(
                                request.id
                              )
                            }
                            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Weigeren
                          </button>
                        </div>
                      )}
                    </div>

                    {isRejecting && (
                      <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
                        <label
                          htmlFor={`rejection-reason-${request.id}`}
                          className="mb-2 block text-sm font-medium text-slate-700"
                        >
                          Reden van weigering
                        </label>

                        <textarea
                          id={`rejection-reason-${request.id}`}
                          value={
                            rejectionReason
                          }
                          maxLength={
                            1000
                          }
                          disabled={
                            isBusy
                          }
                          onChange={e =>
                            setRejectionReason(
                              e.target.value
                            )
                          }
                          rows={3}
                          placeholder="Geef aan waarom u deze overdracht weigert."
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={
                              isBusy ||
                              !rejectionReason.trim()
                            }
                            onClick={() =>
                              void handleReject(
                                request.id
                              )
                            }
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isBusy
                              ? 'Bezig...'
                              : 'Weigering bevestigen'}
                          </button>

                          <button
                            type="button"
                            disabled={
                              isBusy
                            }
                            onClick={
                              cancelReject
                            }
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            Annuleren
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
}