import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Link,
} from 'react-router-dom';

import {
  getWerkorderNotifications,
  markWerkorderNotificationRead,
  type WerkorderNotification,
} from '../services/werkorderService';

export default function WerkorderNotifications() {
  const [
    notifications,
    setNotifications,
  ] = useState<WerkorderNotification[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const loadNotifications = useCallback(
    async () => {
      try {
        const data =
          await getWerkorderNotifications();

        setNotifications(data);
      } catch (error) {
        console.error(
          'Notificaties konden niet worden geladen:',
          error
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(
    () => {
      void loadNotifications();

      const intervalId =
        window.setInterval(
          () => {
            void loadNotifications();
          },
          30000
        );

      const handleFocus = () => {
        void loadNotifications();
      };

      window.addEventListener(
        'focus',
        handleFocus
      );

      return () => {
        window.clearInterval(
          intervalId
        );

        window.removeEventListener(
          'focus',
          handleFocus
        );
      };
    },
    [
      loadNotifications,
    ]
  );

  const markAsRead = async (
    notificationId: number
  ) => {
    try {
      await markWerkorderNotificationRead(
        notificationId
      );

      setNotifications(
        current =>
          current.filter(
            notification =>
              notification.id !==
              notificationId
          )
      );
    } catch (error) {
      console.error(
        'Notificatie kon niet als gelezen worden gemarkeerd:',
        error
      );
    }
  };

  if (
    loading ||
    notifications.length === 0
  ) {
    return null;
  }

  return (
    <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-emerald-900">
            Nieuwe werkorders
          </h2>

          <p className="text-sm text-emerald-700">
            {notifications.length}{' '}
            {notifications.length === 1
              ? 'nieuwe notificatie'
              : 'nieuwe notificaties'}
          </p>
        </div>

        <div className="space-y-3">
          {notifications.map(
            notification => (
              <div
                key={notification.id}
                className="rounded-md border border-emerald-200 bg-white p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {notification.message}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(
                        notification.created_at
                      ).toLocaleString(
                        'nl-NL'
                      )}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={
                        `/werkorders/${notification.werkorder_id}`
                      }
                      onClick={() => {
                        void markAsRead(
                          notification.id
                        );
                      }}
                      className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      Bekijken
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        void markAsRead(
                          notification.id
                        );
                      }}
                      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Sluiten
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}