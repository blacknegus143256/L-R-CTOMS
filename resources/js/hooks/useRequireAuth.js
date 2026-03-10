import { usePage } from '@inertiajs/react';

export default function useRequireAuth(setShowAuthModal, setActionName) {
    const { auth } = usePage().props;
    const user = auth?.user || null;

    const requireAuth = (action, redirectUrl) => {
        if (!user) {
            setActionName(action);
            setShowAuthModal(true);
            return;
        }

        window.location.href = redirectUrl;
    };

    return requireAuth;
}

