import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';

const getNotificationUrl = (notification, role) => {
    if (notification?.data?.url) {
        return notification.data.url;
    }

    const orderId = notification?.data?.order_id;
    const type = notification?.data?.type;

    if (!orderId) {
        return null;
    }

    const isStoreAdmin = role === 'store_admin';
    const basePath = isStoreAdmin ? `/store/order/${orderId}` : `/my-orders/${orderId}`;

    if (!type) {
        return basePath;
    }

    const highlightMap = {
        new_order_received: 'status',
        order_created: 'status',
        measurement_requested: 'measurements',
        measurement_submitted: 'measurements',
        quote_sent: 'quote',
        status_updated: 'status',
        photo_uploaded: 'showcase',
        order_rejected: 'status',
        order_declined: 'status',
        order_cancelled: 'status',
        rework_requested: 'rework',
        rework_updated: 'rework',
    };

    const highlight = highlightMap[type];

    return highlight ? `${basePath}?highlight=${encodeURIComponent(highlight)}` : basePath;
};

export default function NotificationsIndex({ auth, notifications }) {
    const items = Array.isArray(notifications?.data) ? notifications.data : [];
    const role = auth?.user?.role;

    const handleNotificationClick = (notification) => {
        const targetUrl = getNotificationUrl(notification, role);

        router.patch(route('notifications.read', notification.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                if (targetUrl) {
                    router.visit(targetUrl);
                }
            },
        });
    };

    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return 'Just now';

        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
        } catch (error) {
            return 'Just now';
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-black text-2xl text-stone-900 tracking-tight">All Notifications</h2>}
        >
            <Head title="All Notifications" />

            <div className="py-12 bg-stone-50 min-h-screen">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">Archive</p>
                                <h3 className="mt-1 text-2xl font-black text-stone-900">Notification History</h3>
                            </div>
                            <div className="rounded-2xl bg-stone-50 px-4 py-2 text-sm font-bold text-stone-600">
                                {notifications?.total || 0} total
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {items.length > 0 ? (
                            items.map((notification) => {
                                const isUnread = !notification.read_at;

                                return (
                                    <button
                                        key={notification.id}
                                        type="button"
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`w-full rounded-3xl border p-5 text-left shadow-sm transition-colors ${isUnread ? 'border-indigo-200 bg-white hover:bg-indigo-50/60' : 'border-stone-200 bg-white hover:bg-stone-50'}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${isUnread ? 'bg-indigo-100 text-indigo-700' : 'bg-stone-100 text-stone-500'}`}>
                                                <span className="text-xs font-black uppercase">{isUnread ? 'New' : 'Read'}</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-sm font-black text-stone-900">
                                                        {notification?.data?.message || 'Order update'}
                                                    </p>
                                                    {isUnread && (
                                                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-rose-700">
                                                            Unread
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-sm text-stone-600 leading-relaxed">
                                                    {notification?.data?.reason || notification?.data?.actor || 'Tap to open the related order.'}
                                                </p>
                                                <p className="mt-2 text-xs font-medium text-stone-500">
                                                    {formatTimeAgo(notification.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="rounded-3xl border border-dashed border-stone-200 bg-white p-10 text-center shadow-sm">
                                <p className="text-lg font-black text-stone-900">No notifications yet</p>
                                <p className="mt-2 text-sm text-stone-600">When important order updates arrive, they will appear here.</p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
                        <p className="text-sm text-stone-600">
                            Showing {notifications?.from || 0} to {notifications?.to || 0} of {notifications?.total || 0}
                        </p>
                        <div className="flex items-center gap-2">
                            {notifications?.prev_page_url ? (
                                <Link
                                    href={notifications.prev_page_url}
                                    className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700 hover:bg-stone-50"
                                >
                                    Previous
                                </Link>
                            ) : (
                                <span className="rounded-xl border border-stone-200 bg-stone-100 px-4 py-2 text-sm font-bold text-stone-400">Previous</span>
                            )}

                            {notifications?.next_page_url ? (
                                <Link
                                    href={notifications.next_page_url}
                                    className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700 hover:bg-stone-50"
                                >
                                    Next
                                </Link>
                            ) : (
                                <span className="rounded-xl border border-stone-200 bg-stone-100 px-4 py-2 text-sm font-bold text-stone-400">Next</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}