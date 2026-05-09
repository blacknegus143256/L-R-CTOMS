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
  const [isMinimized, setIsMinimized] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('impersonationBannerMinimized');
      return saved === 'true';
    }
    return false;
  });

  // Persist user preference for minimized state
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('impersonationBannerMinimized', isMinimized);
      } catch (e) {
        // ignore storage errors (e.g., quota, privacy modes)
      }
    }
  }, [isMinimized]);

  // Don't render if not impersonating
  if (!impersonation?.is_impersonating) {
    return null;
  }

  const handleLeaveImpersonation = () => {
    setIsLeaving(true);
    router.post(route('super.leave-impersonation'), {}, {
      onError: (errors) => {
        console.error('Failed to leave impersonation', errors);
        setIsLeaving(false);
      },
      onFinish: () => {
        setIsLeaving(false);
      },
    });
  };

  if (isMinimized) {
    return (
      <div className="fixed top-20 right-6 z-[9999] transform-gpu will-change-transform transition-opacity duration-300 ease-out animate-in fade-in">
        <div className="bg-red-700 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 border-2 border-red-900 animate-pulse transform translate-y-0 opacity-100">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-sm font-bold">Impersonating {impersonation.impersonating_user_name}</span>
          <button 
            onClick={() => setIsMinimized(false)}
            className="ml-2 bg-red-800 hover:bg-red-900 rounded-full p-1 transition-colors"
            title="Expand"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-red-700 to-red-600 text-white shadow-lg border-b-4 border-red-900 transform-gpu will-change-transform transition-opacity duration-300 ease-out animate-in fade-in">
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
            <p className="font-bold text-lg">Admin Mode: Impersonating {impersonation.impersonating_user_name}</p>
            <p className="text-red-100 text-sm hidden md:block">You are viewing this application as this user. All actions are logged.</p>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="px-3 py-2 bg-red-800 text-white font-bold rounded-lg hover:bg-red-900 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
            <span>Minimize</span>
          </button>
          <button
            onClick={handleLeaveImpersonation}
            disabled={isLeaving}
            className="px-6 py-2 bg-white text-red-700 font-bold rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLeaving ? (
              <>
                <svg className="w-4 h-4 animate-spin text-red-700" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" className="opacity-75" />
                </svg>
                <span>Exiting...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Exit Impersonation</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-red-800/50 px-4 py-1 text-xs text-red-100 flex justify-between">
        <span>Session ID: {impersonation.original_admin_id}</span>
        <span>This session will end when you exit impersonation or log out</span>
      </div>
    </div>
  );
}
