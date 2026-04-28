export const APP_ALERT_EVENT = 'app-alert';

export function showAlert({ title = 'Notice', message = '', type = 'info' } = {}) {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(
        new CustomEvent(APP_ALERT_EVENT, {
            detail: { title, message: String(message ?? ''), type },
        }),
    );
}
