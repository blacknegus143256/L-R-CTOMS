import React from 'react';
import { usePage, router } from '@inertiajs/react';

/**
 * ImpersonationBanner Component
 * 
 * Displays a highly visible banner when the super_admin is impersonating another user.
 * Only renders if impersonation is active.
 * 
 * Usage: Place at the top of your main App layout
 */
export default function ImpersonationBanner() {
  const { impersonation } = usePage().props;
  const [isLeaving, setIsLeaving] = React.useState(false);

  // Don't render if not impersonating
  if (!impersonation?.is_impersonating) {
    return null;
  }

  const handleLeaveImpersonation = () => {
    setIsLeaving(true);
    router.post(route('super.leave-impersonation'), {}, {
      onFinish: () => setIsLeaving(false),
    });
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-red-700 to-red-600 text-white shadow-lg border-b-4 border-red-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Warning Icon */}
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-red-100"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Text Content */}
          <div className="flex-1">
            <p className="font-bold text-lg">
              🔓 Admin Mode: Impersonating {impersonation.impersonating_user_name}
            </p>
            <p className="text-red-100 text-sm">
              You are viewing this application as this user. Perform actions as needed for testing/support. All actions are logged.
            </p>
          </div>
        </div>

        {/* Exit Button */}
        <div className="flex-shrink-0">
          <button
            onClick={handleLeaveImpersonation}
            disabled={isLeaving}
            className="ml-4 px-6 py-2 bg-white text-red-700 font-bold rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 cursor-disabled flex items-center gap-2 whitespace-nowrap"
          >
            {isLeaving ? (
              <>
                <span className="inline-block animate-spin">⟳</span>
                Exiting...
              </>
            ) : (
              <>
                <span>✕</span>
                Exit Impersonation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Secondary indicator bar */}
      <div className="bg-red-800/50 px-4 py-1 text-xs text-red-100 flex justify-between">
        <span>Session ID: {impersonation.original_admin_id}</span>
        <span>This session will end when you exit impersonation or log out</span>
      </div>
    </div>
  );
}
