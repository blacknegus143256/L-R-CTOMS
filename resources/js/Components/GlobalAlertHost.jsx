import { useEffect, useState } from 'react';
import AlertModal from './AlertModal';
import { APP_ALERT_EVENT, showAlert } from '../utils/alert';

export default function GlobalAlertHost() {
    const [alert, setAlert] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
    });

    useEffect(() => {
        const onAlert = (event) => {
            const detail = event?.detail || {};
            setAlert({
                isOpen: true,
                title: detail.title || 'Notice',
                message: detail.message || '',
                type: detail.type || 'info',
            });
        };

        const originalAlert = window.alert?.bind(window);
        window.addEventListener(APP_ALERT_EVENT, onAlert);

        window.alert = (message) => {
            showAlert({ title: 'Notice', message: String(message ?? ''), type: 'info' });
        };

        return () => {
            window.removeEventListener(APP_ALERT_EVENT, onAlert);
            if (originalAlert) {
                window.alert = originalAlert;
            }
        };
    }, []);

    return (
        <AlertModal
            isOpen={alert.isOpen}
            onClose={() => setAlert((prev) => ({ ...prev, isOpen: false }))}
            title={alert.title}
            message={alert.message}
            type={alert.type}
        />
    );
}
