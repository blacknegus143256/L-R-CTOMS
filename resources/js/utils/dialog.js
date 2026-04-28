export const APP_CONFIRM_EVENT = 'app-confirm';
export const APP_PROMPT_EVENT = 'app-prompt';

function emitDialogEvent(eventName, detail) {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

export function confirmDialog({
    title = 'Please Confirm',
    message = 'Are you sure you want to continue?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'info',
} = {}) {
    return new Promise((resolve) => {
        emitDialogEvent(APP_CONFIRM_EVENT, {
            title,
            message,
            confirmText,
            cancelText,
            type,
            resolve,
        });
    });
}

export function promptDialog({
    title = 'Input Required',
    message = 'Please enter a value.',
    defaultValue = '',
    placeholder = '',
    confirmText = 'Save',
    cancelText = 'Cancel',
    type = 'info',
    required = false,
} = {}) {
    return new Promise((resolve) => {
        emitDialogEvent(APP_PROMPT_EVENT, {
            title,
            message,
            defaultValue,
            placeholder,
            confirmText,
            cancelText,
            type,
            required,
            resolve,
        });
    });
}
