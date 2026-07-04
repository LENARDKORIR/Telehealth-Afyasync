/**
 * Offline banner component
 */

import { useOffline } from '../hooks/useOffline';

export const OfflineBanner = () => {
  const { isOffline } = useOffline();

  if (!isOffline) return null;

  return (
    <div className="fixed inset-x-4 top-4 z-40 rounded-2xl border-l-4 border-yellow-400 bg-yellow-50 p-4 shadow-lg sm:left-auto sm:right-4 sm:inset-x-auto sm:max-w-md">
      <div className="flex items-start gap-3 sm:items-center">
        <span className="text-2xl">📡</span>
        <div>
          <p className="font-semibold text-yellow-800">You are offline</p>
          <p className="text-sm text-yellow-700">
            You can still sign in with a saved account and use the app. Changes will sync when you're back online.
          </p>
        </div>
      </div>
    </div>
  );
};
