import { toast } from 'react-hot-toast';
import React from 'react';

/**
 * Notification utility for consistent toast messages across the application
 * Supports: success, error, warning, info
 */

export const notificationConfig = {
  position: 'top-center',
  defaultDuration: 4000,
};

export const showNotification = {
  success: (message, options = {}) => {
    return toast.success(message, {
      ...notificationConfig,
      duration: options.duration || 4000,
      ...options,
    });
  },

  error: (message, options = {}) => {
    return toast.error(message, {
      ...notificationConfig,
      duration: options.duration || 5000,
      ...options,
    });
  },

  warning: (message, options = {}) => {
    return toast((t) =>
      React.createElement(
        'div',
        { className: 'flex items-start gap-3' },
        React.createElement(
          'div',
          { className: 'flex-shrink-0 pt-0.5' },
          React.createElement('svg', {
            className: 'w-5 h-5 text-yellow-600',
            fill: 'currentColor',
            viewBox: '0 0 20 20'
          }, React.createElement('path', {
            fillRule: 'evenodd',
            d: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z',
            clipRule: 'evenodd'
          }))
        ),
        React.createElement(
          'div',
          null,
          React.createElement('p', { className: 'font-semibold text-yellow-900' }, message)
        )
      )
    , {
      duration: options.duration || 5000,
      position: notificationConfig.position,
      ...options,
    });
  },

  info: (message, options = {}) => {
    return toast((t) =>
      React.createElement(
        'div',
        { className: 'flex items-start gap-3' },
        React.createElement(
          'div',
          { className: 'flex-shrink-0 pt-0.5' },
          React.createElement('svg', {
            className: 'w-5 h-5 text-blue-600',
            fill: 'currentColor',
            viewBox: '0 0 20 20'
          }, React.createElement('path', {
            fillRule: 'evenodd',
            d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z',
            clipRule: 'evenodd'
          }))
        ),
        React.createElement(
          'div',
          null,
          React.createElement('p', { className: 'font-semibold text-blue-900' }, message)
        )
      )
    , {
      duration: options.duration || 4000,
      position: notificationConfig.position,
      ...options,
    });
  },

  loading: (message, toastId = null) => {
    return toast.loading(message, {
      position: notificationConfig.position,
      id: toastId,
    });
  },

  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },

  /**
   * Show a promise-based notification (for async operations)
   * Usage: showNotification.promise(
   *   asyncFunction(),
   *   { loading: 'Loading...', success: 'Done!', error: 'Failed!' }
   * )
   */
  promise: (promise, messages, options = {}) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        ...notificationConfig,
        ...options,
      }
    );
  },
};

export default showNotification;
