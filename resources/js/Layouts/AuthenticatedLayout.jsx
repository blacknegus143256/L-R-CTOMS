import ApplicationLogo from '@/Components/ApplicationLogo';
import NavLink from '@/Components/NavLink';
import ImpersonationBanner from '@/Components/ImpersonationBanner';
import { Link, usePage, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { FiX, FiUser, FiLogOut, FiMenu, FiHome, FiBox, FiShoppingCart, FiBriefcase, FiLayers, FiCalendar, FiSettings, FiBell, FiPackage, FiCheckCircle, FiAlertCircle, FiMessageSquare, FiImage, FiXCircle, FiActivity, FiTool, FiRefreshCw } from 'react-icons/fi';

export default function AuthenticatedLayout({ header, children }) {
    const { props } = usePage();
    const user = props.auth.user;
    const unreadNotifications = props.unread_notifications || [];
    const pendingShopsCount = props.pending_shops_count || 0;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const notificationsRef = useRef(null);
    const seenNotificationIdsRef = useRef(new Set((unreadNotifications || []).map((n) => n.id)));

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const currentNotifications = Array.isArray(unreadNotifications) ? unreadNotifications : [];

        const newlyArrived = currentNotifications.filter(
            (notification) => !seenNotificationIdsRef.current.has(notification.id)
        );

        newlyArrived.forEach((notification) => {
            const message = notification?.data?.message || 'You have a new notification.';
            const reason = notification?.data?.reason;
            const actor = notification?.data?.actor;
            const timeAgo = formatTimeAgo(notification?.created_at);

            toast.custom((t) => (
                <div className={`pointer-events-auto w-[20rem] rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl ${t.visible ? 'opacity-100' : 'opacity-0'}`}>
                    <p className="text-sm font-semibold text-stone-800 leading-snug">{message}</p>
                    {reason && (
                        <p className="mt-2 text-xs text-rose-700 leading-snug">
                            {actor ? `${actor} reason: ${reason}` : `Reason: ${reason}`}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-stone-500">{timeAgo}</p>
                    <div className="mt-3 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                toast.dismiss(t.id);
                                handleNotificationClick(notification);
                            }}
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                        >
                            View
                        </button>
                        <button
                            type="button"
                            onClick={() => toast.dismiss(t.id)}
                            className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-200"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            ));
        });

        seenNotificationIdsRef.current = new Set(currentNotifications.map((notification) => notification.id));
    }, [unreadNotifications]);

    const getHighlightParam = (type) => {
        switch (type) {
            case 'new_order_received':
            case 'order_created':
                return 'status';
            case 'measurement_requested':
            case 'measurement_submitted':
                return 'measurements';
            case 'quote_sent':
                return 'quote';
            case 'status_updated':
                return 'status';
            case 'photo_uploaded':
                return 'showcase';
            case 'order_rejected':
            case 'order_declined':
            case 'order_cancelled':
                return 'status';
            case 'rework_requested':
            case 'rework_updated':
                return 'rework';
            default:
                console.warn('Unknown highlight type:', type);
                return null;
        }
    };

    const resolveOrderPath = (orderId) => {
        if (!orderId) {
            try {
                return route('dashboard');
            } catch (error) {
                return '/dashboard';
            }
        }

        if (user?.role === 'store_admin') {
            try {
                return route('store.orders.show', orderId);
            } catch (error) {
                return `/store/orders/${orderId}`;
            }
        }

        try {
            return route('customer.orders.show', orderId);
        } catch (error) {
            return `/customer/orders/${orderId}`;
        }
    };

    const handleNotificationClick = (notification) => {
        const orderId = notification?.data?.order_id;
        const basePath = resolveOrderPath(orderId);
        const highlight = getHighlightParam(notification?.data?.type);
        const targetUrl = notification?.data?.url || basePath;
        const finalUrl = highlight && !notification?.data?.url
            ? `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}highlight=${encodeURIComponent(highlight)}`
            : targetUrl;

        router.patch(route('notifications.read', notification.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setNotificationsOpen(false);

                if (finalUrl) {
                    router.visit(finalUrl);
                }
            },
            onError: () => {
                console.error('Failed to mark notification as read.');

                toast.error(
                    <div className="flex items-start gap-2">
                        <FiAlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-semibold">Failed to read notification</p>
                            <p className="text-xs mt-0.5 opacity-90">Please try again</p>
                        </div>
                    </div>,
                    { duration: 4000 }
                );
            },
        });
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'new_order_received':
            case 'order_created':
                return <FiPackage className="w-5 h-5" />;
            case 'measurement_requested':
                return <FiMessageSquare className="w-5 h-5" />;
            case 'measurement_submitted':
                return <FiCheckCircle className="w-5 h-5" />;
            case 'status_updated':
                return <FiAlertCircle className="w-5 h-5" />;
            case 'quote_sent':
                return <FiPackage className="w-5 h-5" />;
            case 'photo_uploaded':
                return <FiImage className="w-5 h-5" />;
            case 'order_rejected':
            case 'order_declined':
            case 'order_cancelled':
                return <FiXCircle className="w-5 h-5" />;
            default:
                return <FiBell className="w-5 h-5" />;
        }
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
        <>
            <Toaster position="top-right" />
            <div className="h-screen bg-stone-50 flex overflow-hidden relative z-0">
                <ImpersonationBanner />
                {/* Sidebar - Slimmer width (w-60) */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-slate-50 border-r border-stone-200 shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto transition-transform duration-300 ease-in-out flex flex-col`}>
                <div className="flex flex-col h-full">
                    {/* Logo Area - Reduced Padding */}
                    <div className={`p-5 border-b border-stone-100 flex items-center justify-between shrink-0 ${user.role === 'store_admin' ? 'bg-emerald-50/30' : user.role === 'super_admin' ? 'bg-blue-50/30' : 'bg-orchid-purple/5'}`}>
                        <Link href="/" className="flex shrink-0 items-center">
                            <ApplicationLogo className="block h-12 w-auto fill-current text-gray-800" />
                        </Link>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-gray-400 hover:bg-gray-100 rounded-lg">
                           <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Main Nav Links - Tightened Spacing */}
<nav className="flex-1 flex-col px-8 py-10 overflow-y-auto space-y-1 custom-scrollbar">
                        {/* Dynamic Links Based on Role */}
                        {user.role === 'super_admin' && (
                            <>
                                <NavLink href={route('super.dashboard')} active={route().current('super.dashboard')} className="text-base px-4 py-3" >
                                    <FiHome className="w-5 h-5 mr-3" />
                                    Dashboard
                                </NavLink>
                                <NavLink href={route('super.shops.index')} active={route().current('super.shops.index')}className="text-base px-4 py-3" >
                                    <FiBriefcase className="w-5 h-5 mr-3" />
                                    Tailoring Shops</NavLink>
                                <NavLink href={route('super.users.index')} active={route().current('super.users.index')} className="text-base px-4 py-3">
    <FiUser className="w-5 h-5 mr-3" />
    Users
</NavLink>
                                <NavLink href={route('super.audit-logs.index')} active={route().current('super.audit-logs.*') || route().current('super.orders.show')} className="text-base px-4 py-3">
                                    <FiActivity className="w-5 h-5 mr-3" />
                                    Audit Logs
                                </NavLink>
                                <NavLink href={route('super.payouts.index')} active={route().current('super.payouts.*')} className="text-base px-4 py-3">
                                    <FiCheckCircle className="w-5 h-5 mr-3" />
                                    Escrow Payouts
                                </NavLink>
                            </>
                        )}
                        {user.role === 'store_admin' && (
                            <>
                            <div>
                                <NavLink href={route('store.dashboard')} active={route().current('store.dashboard')} className="text-base px-4 py-3">
                                    <FiHome className="w-5 h-5 mr-3" />
                                    Dashboard
                                </NavLink>
                                </div>
                                <div>
                                    <NavLink href={route('store.services.index')} active={route().current('store.services.index')} className="text-base px-4 py-3" >
                                        <FiLayers className="w-5 h-5 mr-3" />
                                        Services
                                    </NavLink>
                                </div>
                                <div>
                                <NavLink href={route('store.inventory.index')} active={route().current('store.inventory.index')} className="text-base px-4 py-3" >
                                    <FiBox className="w-5 h-5 mr-3" />
                                    Inventory
                                </NavLink>
                                </div>
<div>
                                    <NavLink href={route('store.appointments')} active={route().current('store.appointments')} className="text-base px-4 py-3" >
                                        <FiCalendar className="w-5 h-5 mr-3" />
                                        Schedule
                                    </NavLink>
                                </div>
                                <div>
                                <NavLink href={route('store.orders')} active={route().current('store.orders')} className="text-base px-4 py-3" >
                                    <FiShoppingCart className="w-5 h-5 mr-3" />
                                    Orders
                                </NavLink>
                                </div>
                                <div>
                                <NavLink href={route('store.reworks.index')} active={route().current('store.reworks.*')} className="text-base px-4 py-3" >
                                    <FiTool className="w-5 h-5 mr-3" />
                                    Rework Requests
                                </NavLink>
                                </div>
                            </>
                        )}
                        {/* Customer Dashboard Link */}
                        {user.role !== 'super_admin' && user.role !== 'store_admin' && (
                            <>
                            <div>
                                <NavLink href={route('dashboard')} active={route().current('dashboard')} className="text-lg px-4 py-3">
                                    <FiHome className="w-5 h-5 mr-3" />
                                    Dashboard
                                </NavLink>
                            </div>
                            <div>
                               <NavLink href={route('customer.orders')} active={route().current('customer.orders')} className="text-base px-4 py-3">
                                   <FiShoppingCart className="w-5 h-5 mr-3" />
                                   My Orders
                               </NavLink>
                               </div>
                            <div>
                                <NavLink href={route('customer.reworks.index')} active={route().current('customer.reworks.*')} className="text-base px-4 py-3">
                                    <FiRefreshCw className="w-5 h-5 mr-3" />
                                    My Reworks
                                </NavLink>
                            </div>
                            <div>
                                <NavLink href={route('customer.appointments')} active={route().current('customer.appointments')} className="text-base px-4 py-3">
                                    <FiCalendar className="w-5 h-5 mr-3" />
                                    My Appointments
                                </NavLink>
                            </div>
                            </>
                        )}
                    </nav>

                    {/* FIXED BOTTOM SECTION: Profile & Logout */}
                    <div className="px-4  shrink-0 flex-col">
                        <Link href={route('profile.edit')} className="w-full flex items-center p-3 rounded-xl text-stone-500 font-medium hover:bg-rose-50 hover:text-blue-600 transition-all duration-200" >
<div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0 mr-3">
    {user?.profile?.avatar_url ? (
        <img src={`/storage/${user.profile.avatar_url}`} alt="Profile" className="w-full h-full object-cover" />
    ) : (
        <span className="text-sm font-black text-indigo-500 uppercase">{user?.name?.charAt(0) || 'U'}</span>
    )}
</div>
                            Profile
                        </Link>
                        {/* Settings */}
                        {user.role === 'store_admin' && (
                        <Link href={route('store.schedule.index')} className="w-full flex items-center p-3 rounded-xl text-stone-500 font-medium hover:bg-rose-50 hover:text-blue-600 transition-all duration-200" >
                            <FiSettings className="w-5 h-5 mr-3" />
                            Shop Settings
                        </Link>
                        )}
                        <Link 
                            href={route('logout')} 
                            method="post" 
                            as="button" 
                            className="w-full flex items-center p-3 rounded-xl text-stone-500 font-medium hover:bg-rose-50 hover:text-rose-600 transition-all duration-200"
                        >
                            
                            <FiLogOut className="w-5 h-5 mr-3" />
                            Sign Out
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content - Reduced Margin and Padding */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div ref={notificationsRef} className="fixed top-4 right-4 z-[70]">
                    <button
                        type="button"
                        onClick={() => setNotificationsOpen((prev) => !prev)}
                        className="relative p-2.5 rounded-xl bg-white/95 backdrop-blur-md shadow-lg border border-stone-200 hover:bg-stone-50 transition-colors"
                        aria-label="Toggle notifications"
                    >
                        <FiBell className="h-5 w-5 text-stone-700" />
                        {unreadNotifications.length > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black leading-[18px] text-center">
                                {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
                            </span>
                        )}
                        {pendingShopsCount > 0 && (
                            <span className="absolute -bottom-1 -left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black leading-[18px] text-center ring-2 ring-white">
                                {pendingShopsCount > 9 ? '9+' : pendingShopsCount}
                            </span>
                        )}
                    </button>

                    {notificationsOpen && (
                        <div className="absolute right-0 mt-2 w-80 max-h-[28rem] overflow-y-auto rounded-2xl bg-white border border-stone-200 shadow-2xl">
                            <div className="px-4 py-3 border-b border-stone-100">
                                <h3 className="text-sm font-black text-stone-800">Notifications</h3>
                            </div>

                            {/* Pending Shop Applications (custom) */}
                            {pendingShopsCount > 0 && (
                                <Link
                                    href={route('super.shops.index')}
                                    className="block px-4 py-3 border-b border-stone-100 hover:bg-stone-50 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-stone-900">Pending Applications</p>
                                            <p className="text-xs text-stone-600 mt-0.5">
                                                You have {pendingShopsCount} tailoring shop(s) waiting for document review.
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            )}

                            {unreadNotifications.length > 0 ? (
                                <div className="py-1">
                                    {unreadNotifications.map((notification) => (
                                        <button
                                            key={notification.id}
                                            type="button"
                                            onClick={() => handleNotificationClick(notification)}
                                            className="w-full px-4 py-3 text-left hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-b-0 flex items-start gap-3"
                                        >
                                            <div className="text-stone-400 flex-shrink-0 mt-0.5">
                                                {getNotificationIcon(notification?.data?.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-stone-800 leading-snug">
                                                    {notification?.data?.message || 'Order update'}
                                                </p>
                                                <p className="text-xs text-stone-500 mt-1">
                                                    {formatTimeAgo(notification.created_at)}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                pendingShopsCount === 0 && (
                                    <div className="px-4 py-6 text-sm text-stone-500 text-center">
                                        No unread notifications.
                                    </div>
                                )
                            )}

                            <div className="p-4 border-t border-stone-100 text-center">
                                <Link
                                    href={route('notifications.index')}
                                    className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800"
                                >
                                    View All Notifications
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                <main className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar relative pt-20 lg:pt-6">
{header && (
    <div className="max-w-[100rem] mx-auto mb-6">
        {/* Change h2 to div to prevent nesting errors */}
        <div className="text-xl font-bold text-stone-800 leading-tight">
            {header}
        </div>
    </div>
)}
                <div className="max-w-[100rem] mx-auto">
                    {children}
                </div>
            </main>

            {/* Role-based top glow - thin line */}
            <div className={`fixed top-0 left-0 w-60 h-1 z-[60] lg:block hidden ${
                user.role === 'store_admin' ? 'bg-emerald-500 shadow-[0_1px_10px_rgba(16,185,129,0.5)]' :
                user.role === 'super_admin' ? 'bg-blue-500 shadow-[0_1px_10px_rgba(59,130,246,0.5)]' :
                'bg-orchid-purple shadow-[0_1px_10px_rgba(168,85,247,0.5)]'
            }`} />

            {/* Mobile hamburger */}
            {!sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="fixed top-4 left-4 z-[60] p-2 rounded-xl bg-white/90 backdrop-blur-md shadow-lg lg:hidden"
                >
                    <FiMenu className="h-6 w-6 text-gray-800" />
                </button>
            )}

            {/* Mobile overlay */}
                {sidebarOpen && (
                    <div 
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" 
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </div>
        </div>
    </>
);
}
