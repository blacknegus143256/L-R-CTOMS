import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import StatCard from '@/Components/Dashboard/StatCard';
import OrderHeatmap from '@/Components/Dashboard/OrderHeatmap';
import { getNormalizedStatusLabel, getPaymentDisplayData, getPaymentStatusClass, getTailorActionFlags } from '@/utils/orderActionRules';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { confirmDialog, promptDialog } from '@/utils/dialog';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { TbCurrencyDollar, TbCurrencyPeso } from 'react-icons/tb';
import { FiArrowRight, FiBox, FiClipboard, FiClock, FiTrendingUp, FiUsers, FiLayers, FiX, FiCheck, FiCheckCircle, FiCalendar, FiPackage, FiDollarSign, FiEye, FiMapPin, FiTruck, FiLock } from 'react-icons/fi';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

const STATUS_COLORS = {
    'Pending': 'bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-800 backdrop-blur-sm border border-yellow-200/50',
    'Accepted': 'bg-gradient-to-r from-blue-400/20 to-indigo-400/20 text-blue-800 backdrop-blur-sm border border-blue-200/50',
    'Appointment Scheduled': 'bg-gradient-to-r from-indigo-400/20 to-purple-400/20 text-indigo-800 backdrop-blur-sm border border-indigo-200/50',
    'Ready for Production': 'bg-gradient-to-r from-cyan-400/20 to-sky-400/20 text-cyan-800 backdrop-blur-sm border border-cyan-200/50',
    'In Progress': 'bg-gradient-to-r from-purple-400/20 to-violet-400/20 text-purple-800 backdrop-blur-sm border border-purple-200/50',
    'Ready for Pickup': 'bg-gradient-to-r from-emerald-400/20 to-green-400/20 text-emerald-800 backdrop-blur-sm border border-emerald-200/50',
    'Completed': 'bg-gradient-to-r from-slate-400/20 to-stone-400/20 text-stone-800 backdrop-blur-sm border border-stone-200/50',
    'Rejected': 'bg-gradient-to-r from-rose-400/20 to-red-400/20 text-rose-800 backdrop-blur-sm border border-rose-200/50',
    'Declined': 'bg-gradient-to-r from-rose-400/20 to-red-400/20 text-rose-800 backdrop-blur-sm border border-rose-200/50',
    'Cancelled': 'bg-gradient-to-r from-red-400/20 to-rose-400/20 text-red-800 backdrop-blur-sm border border-red-200/50',
};

// Calculate time remaining until deadline
const getTimeRemaining = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMs < 0) return 'Overdue! 🔥';
    if (diffHours < 1) return 'Less than 1h ⏰';
    if (diffHours < 24) return `Due in ${diffHours}h`;
    if (diffDays === 1) return 'Tomorrow 📅';
    return `Due in ${diffDays}d`;
};

const getTimeColor = (deadline) => {
    if (!deadline) return 'text-stone-500 font-medium';
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffMs < 0) return 'text-red-600 font-bold animate-pulse';
    if (diffHours < 6) return 'text-red-500 font-bold';
    if (diffHours < 24) return 'text-orange-500 font-semibold';
    return 'text-emerald-600 font-semibold';
};

export default function Dashboard() {
    const { props } = usePage();
    const { shop, stats, topServices, topMaterials, weeklyOrders, recentActivity, dailyAgenda } = props;

    const [description, setDescription] = useState(shop?.description || '');
    const [showCongratsModal, setShowCongratsModal] = useState(false);
    const [editingDescription, setEditingDescription] = useState(false);
    const [activeMetricModal, setActiveMetricModal] = useState(null);
    const [revenueGranularity, setRevenueGranularity] = useState('daily');
    const [selectedHeatmapDay, setSelectedHeatmapDay] = useState('All');
    const [filteredWeekOrders, setFilteredWeekOrders] = useState(weeklyOrders || []);
    const [heatmapModalDay, setHeatmapModalDay] = useState(null);
    const [heatmapModalOrders, setHeatmapModalOrders] = useState([]);
    const [expandedPanel, setExpandedPanel] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [pendingOrdersData, setPendingOrdersData] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);

    const sortWeekOrders = (orders = []) => {
        return [...orders].sort((left, right) => {
            const leftRush = left?.rush_order ? 1 : 0;
            const rightRush = right?.rush_order ? 1 : 0;

            if (leftRush !== rightRush) {
                return rightRush - leftRush;
            }

            const leftDate = new Date(left.expected_completion_date || left.created_at || 0).getTime();
            const rightDate = new Date(right.expected_completion_date || right.created_at || 0).getTime();
            return leftDate - rightDate;
        });
    };

    // ESC key close for modal
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key !== 'Escape') return;
            setActiveMetricModal(null);
            setHeatmapModalDay(null);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    useEffect(() => {
        if (shop?.status === 'approved' && !sessionStorage.getItem('hasSeenApproval_CTOMS')) {
            setShowCongratsModal(true);
            sessionStorage.setItem('hasSeenApproval_CTOMS', 'true');
        }
    }, [shop?.status]);

// Unified metric data fetcher
    const fetchMetricData = (metric, granularity = revenueGranularity) => {
    if (!shop?.id) return;

    switch (metric) {
      case 'revenue':
        setLoadingRevenue(true);
                fetch(`/store/${shop.id}/analytics/revenue?granularity=${granularity}`)
          .then(res => res.json())
          .then(data => setRevenueData(data.revenue || []))
          .catch(err => {
            console.error('Revenue data fetch error:', err);
            setRevenueData([]);
          })
          .finally(() => setLoadingRevenue(false));
        break;
      case 'pending':
        setLoadingPending(true);
        fetch(`/store/${shop.id}/analytics/pending`)
          .then(res => res.json())
          .then(data => {
            setPendingOrdersData(data.orders || []);
          })
          .catch(err => {
            console.error('Pending orders fetch error:', err);
            setPendingOrdersData([]);
          })
          .finally(() => setLoadingPending(false));
        break;
    }
  };

  // Fetch data when any metric modal opens
  useEffect(() => {
    if (!activeMetricModal) return;
        if (activeMetricModal === 'revenue') {
            fetchMetricData('revenue', revenueGranularity);
            return;
        }

        fetchMetricData(activeMetricModal);
    }, [activeMetricModal, revenueGranularity, shop?.id]);

        useEffect(() => {
                setFilteredWeekOrders(sortWeekOrders(weeklyOrders || []));
        }, [weeklyOrders]);

    const updateDescription = () => {
        router.post('/store/update-description', { description }, {
            preserveState: true,
            onSuccess: () => {
                setEditingDescription(false);
            },
        });
    };

    const getOrdersForDay = (dayName) => {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return sortWeekOrders((weeklyOrders || []).filter((order) => {
            if (!order.expected_completion_date) {
                return false;
            }

            const date = new Date(order.expected_completion_date);
            if (Number.isNaN(date.getTime())) {
                return false;
            }

            return dayNames[date.getDay()] === dayName;
        }));
    };

    const handleDayFilter = (dayName) => {
        setSelectedHeatmapDay(dayName);

        if (dayName === 'All') {
            setFilteredWeekOrders(sortWeekOrders(weeklyOrders || []));
            setHeatmapModalDay(null);
            setHeatmapModalOrders([]);
        } else {
            const dayOrders = getOrdersForDay(dayName);
            setFilteredWeekOrders(dayOrders);
            setHeatmapModalDay(dayName);
            setHeatmapModalOrders(dayOrders);
        }
    };

    const handleMarkReady = async (orderId) => {
        const confirmed = await confirmDialog({
            title: 'Mark Order Ready',
            message: 'Mark this order as ready for pickup?',
            confirmText: 'Mark Ready',
            cancelText: 'Cancel',
            type: 'info',
        });

        if (confirmed) {
            router.patch(`/store/orders/${orderId}/status`, { status: 'Ready' }, {
                preserveScroll: true,
                onSuccess: () => window.location.reload(),
            });
        }
    };

    const handleAgendaAction = (url, payload, successMessage) => {
        router.patch(url, payload, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(successMessage);
                window.location.reload();
            },
        });
    };

    const handleAgendaRecordCashPayment = async (order) => {
        const amount = await promptDialog({
            title: 'Record Cash Payment',
            message: 'Enter the cash amount received from the customer:',
            defaultValue: String(order.amount_paid || order.total_price || 0),
            placeholder: '0.00',
            confirmText: 'Record Payment',
            cancelText: 'Cancel',
            type: 'info',
            required: true,
        });

        if (!amount || Number(amount) <= 0) {
            return;
        }

        router.post(route('store.orders.cash-payment', order.id), {
            amount: Number(amount),
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Cash payment recorded successfully.');
                window.location.reload();
            },
        });
    };

    const handleAgendaSettleBalance = async (order) => {
        const confirmed = await confirmDialog({
            title: 'Collect Remaining Cash',
            message: 'Confirm that you collected the remaining balance in cash?',
            confirmText: 'Confirm Collection',
            cancelText: 'Cancel',
            type: 'info',
        });

        if (!confirmed) {
            return;
        }

        router.post(route('store.orders.settle-balance', order.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Remaining balance collected successfully.');
                window.location.reload();
            },
        });
    };

    const togglePanel = (panelName) => {
        setExpandedPanel(expandedPanel === panelName ? null : panelName);
    };

    const isServicesExpanded = expandedPanel === 'services';
    const servicesCount = Number(shop?.services_count || 0);
    const inventoryCount = Number(shop?.attributes_count || 0);

    // Dynamic max based on visible items for better UX
    const visibleServices = topServices?.slice(0, isServicesExpanded ? 10 : 3) || [];
    const maxServiceCount = Math.max(...visibleServices.map(s => s.total), 1);
    const maxMaterialCount = Math.max(...(topMaterials?.map(m => m.total) || [1]), 1);

    if (!shop) {
        return (
            <AuthenticatedLayout
                header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Store Dashboard</h2>}
            >
                <Head title="Store Dashboard" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-gradient-to-br from-slate-50 to-white backdrop-blur-xl shadow-2xl sm:rounded-3xl p-12 text-center border border-slate-200/50">
                            <div className="text-8xl mb-8 mx-auto w-32 h-32 bg-slate-200/50 rounded-3xl flex items-center justify-center">🏪</div>
                            <h3 className="text-4xl font-black text-slate-900 mb-6 leading-tight">No Shop Assigned</h3>
                            <p className="text-2xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">Your account doesn't have a tailoring shop assigned yet. Contact the administrator to activate your business dashboard.</p>
                            <Link 
                                href="/profile"
                                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold rounded-3xl text-lg hover:shadow-2xl hover:shadow-slate-900/50 transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm"
                            >
                                Contact Admin
                                <FiArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-6 pr-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-700 bg-clip-text text-transparent">
                            {shop.shop_name}
                        </h2>
                    </div>
                    <div className="text-emerald-700 text-sm font-bold bg-emerald-100/80 px-4 py-1.5 rounded-xl shadow-md">
                        {shop.address}
                    </div>
                </div>
            }
        >
            <Head title={`${shop.shop_name} Dashboard`} />

            <div className="py-12 space-y-10">
                {servicesCount === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 shadow-sm"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-bold text-amber-900">
                                You have no services listed. Customers cannot book you.
                            </p>
                            <Link
                                href={route('store.services.index')}
                                className="inline-flex items-center rounded-xl bg-amber-600 px-4 py-2 text-xs font-black text-white transition-colors hover:bg-amber-700"
                            >
                                Add a Service
                            </Link>
                        </div>
                    </motion.div>
                )}

                {inventoryCount === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: 0.05 }}
                        className="rounded-2xl border border-sky-300 bg-sky-50 px-5 py-4 shadow-sm"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-bold text-sky-900">
                                Your fabric inventory is empty.
                            </p>
                            <Link
                                href={route('store.inventory.index')}
                                className="inline-flex items-center rounded-xl bg-sky-600 px-4 py-2 text-xs font-black text-white transition-colors hover:bg-sky-700"
                            >
                                Add Materials
                            </Link>
                        </div>
                    </motion.div>
                )}

                {/* Command Header */}
                <div className="bg-white/90 backdrop-blur-2xl shadow-2xl rounded-3xl p-10 border border-emerald-200/60">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-5xl font-black bg-gradient-to-r from-emerald-900 to-emerald-700 bg-clip-text text-transparent leading-tight">
                                Command Center
                            </h1>
                            <p className="text-xl text-slate-600 font-semibold max-w-2xl">Real-time business intelligence • Orders • Revenue • Production</p>
                        </div>
                        <div className="flex gap-4 flex-wrap">
                            <Link
                                href="/store/inventory"
                                className="px-10 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-black rounded-3xl text-lg shadow-2xl hover:shadow-3xl hover:shadow-slate-900/60 hover:scale-[1.02] transition-all duration-300 backdrop-blur-sm flex items-center gap-3"
                            >
                                <FiBox className="w-6 h-6" />
                                Inventory
                            </Link>
                            <Link
                                href={route('store.orders.page', shop.id)}
                                className="px-10 py-5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-black rounded-3xl text-lg shadow-2xl hover:shadow-3xl hover:shadow-emerald-900/60 hover:scale-[1.02] transition-all duration-300 backdrop-blur-sm flex items-center gap-3"
                            >
                                <FiClipboard className="w-6 h-6" />
                                All Orders
                            </Link>
                        </div>
                    </div>
                </div>

                <motion.div
                    variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
                    className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl shadow-2xl border border-emerald-500/20 p-8 overflow-hidden relative"
                >
                    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_30%)]" />
                    <div className="relative z-10 flex items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-3xl font-black tracking-tight">Today's Agenda</h3>
                            <p className="text-emerald-100/80 font-medium mt-1">Separate logistics, fittings, and payments without mixing the workflow.</p>
                        </div>
                        <span className="px-4 py-2 rounded-2xl bg-white/10 border border-white/10 text-sm font-bold uppercase tracking-[0.2em] text-emerald-100">
                            {dailyAgenda?.length || 0} items
                        </span>
                    </div>
                
                    <div className="relative z-10 grid grid-cols-1 gap-4">
                        {dailyAgenda?.length ? dailyAgenda.map((order) => (
                            <div key={order.id} className="rounded-3xl border border-white/10 bg-white/8 backdrop-blur-xl p-5 shadow-xl shadow-black/10">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h4 className="text-xl font-black text-white">{order.customer?.name || order.user?.name || 'Customer'}</h4>
                                            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-400/15 text-emerald-100 border border-emerald-300/20">Order #{order.id}</span>
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white/90 border border-white/10">{order.agenda_type}</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-emerald-100/85 font-medium">
                                            <span className="inline-flex items-center gap-2"><FiClock className="w-4 h-4" />{order.agenda_time || 'All day'}</span>
                                            <span className="inline-flex items-center gap-2"><FiPackage className="w-4 h-4" />{order.status}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        {String(order.agenda_type || '').includes('Drop-off') && !order.materials_received && (
                                            <button
                                                type="button"
                                                onClick={() => handleAgendaAction(route('store.orders.materials-received', order.id), {}, 'Materials marked as received.')}
                                                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/30 hover:scale-[1.01] transition-all"
                                            >
                                                <FiTruck className="w-4 h-4" />
                                                Mark Materials Received
                                            </button>
                                        )}

                                        {String(order.agenda_type || '').includes('Fitting') && !order.measurements_taken && (
                                            <Link
                                                href={`${route('store.orders.show', { order: order.id, highlight: 'measurements' })}#measurements`}
                                                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-cyan-400 text-slate-950 font-black shadow-lg shadow-cyan-500/30 hover:scale-[1.01] transition-all"
                                            >
                                                <FiMapPin className="w-4 h-4" />
                                                Record Measurements
                                            </Link>
                                        )}

                                        {order.status === 'Confirmed' && order.measurement_type === 'scheduled' && !order.measurements_taken && (
                                            <button
                                                type="button"
                                                onClick={() => handleAgendaAction(
                                                    route('store.orders.measurements-taken', order.id),
                                                    {},
                                                    'Measurements marked as taken.'
                                                )}
                                                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/30 hover:scale-[1.01] transition-all"
                                            >
                                                <FiCheckCircle className="w-4 h-4" />
                                                Mark Measurements Taken
                                            </button>
                                        )}

                                        {(() => {
                                            const actionFlags = getTailorActionFlags(order);

                                            return (
                                                <>
                                                    {actionFlags.canRecordCashPayment && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAgendaRecordCashPayment(order)}
                                                            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/30 hover:scale-[1.01] transition-all"
                                                        >
                                                            <TbCurrencyPeso className="w-4 h-4" />
                                                            Record Cash Payment
                                                        </button>
                                                    )}

                                                    {actionFlags.canStartProduction && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAgendaAction(
                                                                route('store.orders.update-status', order.id),
                                                                { status: 'In Progress' },
                                                                'Order moved to In Progress.'
                                                            )}
                                                            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-indigo-500 text-white font-black shadow-lg shadow-indigo-500/30 hover:scale-[1.01] transition-all"
                                                        >
                                                            <FiPackage className="w-4 h-4" />
                                                            Start Production
                                                        </button>
                                                    )}

                                                    {actionFlags.canMarkReadyForPickup && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAgendaAction(
                                                                route('store.orders.update-status', order.id),
                                                                { status: 'Ready for Pickup' },
                                                                'Order marked as Ready for Pickup.'
                                                            )}
                                                            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/30 hover:scale-[1.01] transition-all"
                                                        >
                                                            <FiCheckCircle className="w-4 h-4" />
                                                            Mark Ready for Pickup
                                                        </button>
                                                    )}

                                                    {actionFlags.canMarkCompleted && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAgendaAction(
                                                                route('store.orders.update-status', order.id),
                                                                { status: 'Completed' },
                                                                'Order marked as Completed.'
                                                            )}
                                                            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 text-white font-black shadow-lg shadow-slate-900/30 hover:scale-[1.01] transition-all"
                                                        >
                                                            <FiCheck className="w-4 h-4" />
                                                            Mark as Completed
                                                        </button>
                                                    )}

                                                    {actionFlags.canCollectRemainingCash && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAgendaSettleBalance(order)}
                                                            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 text-white font-black border border-white/20 shadow-lg shadow-black/20 hover:scale-[1.01] transition-all"
                                                        >
                                                            <TbCurrencyPeso className="w-4 h-4" />
                                                            Collect Remaining Cash
                                                        </button>
                                                    )}
                                                </>
                                            );
                                        })()}

                                        {(() => {
                                            const paymentDisplay = getPaymentDisplayData(order);

                                            if (!paymentDisplay.isVerified) {
                                                return null;
                                            }

                                            return (
                                            <div className="flex flex-col gap-2">
                                                {paymentDisplay.isPartial ? (
                                                    <>
                                                        <span className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-500/20 text-amber-100 font-black border border-amber-300/40 shadow-lg shadow-amber-500/20">
                                                            <FiLock className="w-4 h-4" />
                                                            Partial Funds: ₱{paymentDisplay.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-500/20 text-red-100 font-black border border-red-300/40 shadow-lg shadow-red-500/20 text-sm">
                                                            <TbCurrencyPeso className="w-3 h-3" />
                                                            Pending: ₱{paymentDisplay.remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500/20 text-emerald-100 font-black border border-emerald-300/40 shadow-lg shadow-emerald-500/20">
                                                        <FiLock className="w-4 h-4" />
                                                        Fully Funded: ₱{paymentDisplay.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                )}
                                            </div>
                                            );
                                        })()}

                                        {order.status === 'Confirmed' && order.measurement_type === 'scheduled' && !!order.measurements_taken && (
                                            <span className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500/20 text-emerald-100 font-black border border-emerald-300/40 shadow-lg shadow-emerald-500/20">
                                                <FiCheckCircle className="w-4 h-4" />
                                                Logistics Met: Measurements Taken
                                            </span>
                                        )}

                                        <Link
                                            href={route('store.orders.show', order.id)}
                                            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 text-white font-black border border-white/10 hover:bg-white/15 transition-all"
                                        >
                                            <FiEye className="w-4 h-4" />
                                            View Order
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-emerald-100/80">
                                No agenda items for today.
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Revenue Intelligence Grid */}
                <div className="grid grid-cols-1 2xl:grid-cols-4 xl:grid-cols-2 lg:grid-cols-1 gap-8">
                    <StatCard 
                        title="Total Revenue" 
                        value={`₱${Number(stats?.totalRevenue || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                        variant="revenue"
                        sparkle={true}
                        icon={(props) => (
                            <TbCurrencyPeso {...props} />
                        )}
                        onClick={() => setActiveMetricModal('revenue')}
                    />
                    <StatCard 
                        title="Pending Orders" 
                        value={stats?.pendingOrders || 0}
                        variant="pending"
                        icon={(props) => (
                            <FiClock {...props} strokeWidth={3} />
                        )}
                        onClick={() => setActiveMetricModal('pending')}
                    />
                    <StatCard 
                        title="Monthly Revenue Growth" 
                        value={`${(stats?.revenueGrowth || 0) > 0 ? '+' : ''}${(stats?.revenueGrowth || 0).toFixed(1)}%`}
                        changePositive={(stats?.revenueGrowth || 0) >= 0}
                        variant="growth"
                        icon={(props) => (
                            <FiTrendingUp {...props} strokeWidth={3} />
                        )}
                        onClick={() => setActiveMetricModal('growth')}
                    />
                    <StatCard 
                        title="Active Customers" 
                        value={stats?.activeCustomers || 0}
                        variant="customers"
                        icon={(props) => (
                            <FiUsers {...props} strokeWidth={3} />
                        )}
                        onClick={() => setActiveMetricModal('customers')}
                    />
                </div>

                {/* Production Heatmap */}
                <OrderHeatmap weeklyOrders={weeklyOrders || []} selectedDay={selectedHeatmapDay} onDayFilter={handleDayFilter} />

                {/* Intelligence Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 transition-all duration-700 ease-in-out">
                    {/* Top Services Panel */}
                    <div 
                        className={`bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-emerald-200/60 group hover:shadow-emerald-500/25 transition-all duration-500 cursor-pointer overflow-hidden col-span-1 ${
                            isServicesExpanded 
                                ? 'lg:col-span-2 ring-4 ring-emerald-500/20' 
                                : ''
                        }`}
                    >
                        <div 
                            role="button"
                            tabIndex={0}
                            onClick={() => togglePanel('services')}
                            onKeyDown={(e) => e.key === 'Enter' && togglePanel('services')}
                            className="flex items-center justify-between mb-8 cursor-pointer select-none"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
                                    <FiLayers className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black bg-gradient-to-r from-emerald-900 to-emerald-700 bg-clip-text text-transparent">Top Services</h3>
                                    <p className="text-lg text-slate-600 font-medium">Last 30 days • {isServicesExpanded ? 'Click to collapse' : 'Click to expand'}</p>
                                </div>
                            </div>
                            
                            {/* Visual Indicator of expansion state */}
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-200 transition-all">
                                {isServicesExpanded ? '−' : '+'}
                            </div>
                        </div>
                        
                        {topServices && topServices.length > 0 ? (
                            <div className={`grid gap-5 transition-all duration-500 ${isServicesExpanded ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                                {topServices.slice(0, isServicesExpanded ? 10 : 3).map((item, index) => (
                                    <div key={item.service_id} className="group/item flex items-center gap-5 p-6 rounded-2xl bg-gradient-to-r from-slate-50/50 to-emerald-50/50 border border-emerald-200/50 hover:from-slate-100 hover:to-emerald-100 transition-all hover:shadow-md">
                                        <span className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg flex-shrink-0 group-hover/item:scale-105 transition-all">
                                            {index + 1}
                                        </span>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-xl font-bold text-slate-900 truncate">{item.service?.service_name || 'Service'}</span>
                                                <span className="text-2xl font-black text-emerald-700 px-4 py-2 bg-emerald-100/60 rounded-xl shadow-sm">
                                                    {item.total}
                                                </span>
                                            </div>
                                            <div className="h-4 bg-slate-200/60 rounded-full overflow-hidden shadow-inner backdrop-blur-sm">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                                                    style={{ width: `${Math.min((item.total / maxServiceCount) * 100, 100)}%`, transition: 'width 1s ease-in-out' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-40 flex items-center justify-center rounded-2xl bg-gradient-to-r from-slate-100/50 to-emerald-100/50">
                                <p className="text-slate-500 font-bold">No data yet</p>
                            </div>
                        )}
                    </div>

                </div>
  {/* Metric Drill-Down Modal */}
                {activeMetricModal && (
                    <div 
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/80 backdrop-blur-sm p-4 sm:p-6"
                        onClick={() => setActiveMetricModal(null)}
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-6 sm:p-8 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl shadow-inner">
                                        {activeMetricModal === 'revenue' && <TbCurrencyPeso />}
                                        {activeMetricModal === 'pending' && <FiClock />}
                                        {activeMetricModal === 'growth' && <FiTrendingUp />}
                                        {activeMetricModal === 'customers' && <FiUsers />}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 capitalize">
                                            {activeMetricModal === 'revenue' && 'Revenue Analytics'}
                                            {activeMetricModal === 'pending' && 'Pending Orders Backlog'}
                                            {activeMetricModal === 'growth' && 'Growth Performance'}
                                            {activeMetricModal === 'customers' && 'Customer Directory'}
                                        </h2>
                                        <p className="text-slate-500 font-medium text-sm">Detailed breakdown and historical data.</p>
                                    </div>
                                </div>
                                {activeMetricModal === 'revenue' && (
                                    <div className="flex items-center gap-3">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500" htmlFor="revenue-granularity">
                                            Breakdown
                                        </label>
                                        <select
                                            id="revenue-granularity"
                                            value={revenueGranularity}
                                            onChange={(e) => setRevenueGranularity(e.target.value)}
                                            className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-emerald-400"
                                        >
                                            <option value="daily">Daily</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                    </div>
                                )}
                                <button 
                                    onClick={() => setActiveMetricModal(null)}
                                    className="w-10 h-10 rounded-full bg-stone-200/50 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>

                            {/* Dynamic Metric Content */}
                            <div className="p-8 sm:p-12 bg-white min-h-[400px]">
                                {activeMetricModal === 'revenue' ? (
                                    loadingRevenue ? (
                                        <div className="h-full flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="w-12 h-12 border-4 border-slate-200/50 rounded-full animate-spin border-t-emerald-600 mx-auto mb-4"></div>
                                                <p className="text-lg text-slate-600 font-medium">Loading revenue analytics...</p>
                                            </div>
                                        </div>
                                    ) : revenueData.length > 0 ? (
                                        <div className="w-full h-[450px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={revenueData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                                                    <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={13} />
                                                    <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(v) => `₱${Number(v).toLocaleString()}`} fontSize={13} />
                                                    <Tooltip 
                                                        contentStyle={{
                                                            backgroundColor: 'white',
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: '12px',
                                                            boxShadow: '0 10px 15px -3px rgba(0, 0,0, 0.1)'
                                                        }}
                                                        formatter={(value) => [`₱${Number(value).toLocaleString()}`, `${revenueGranularity.charAt(0).toUpperCase() + revenueGranularity.slice(1)} Revenue`]}
                                                        labelStyle={{ fontWeight: '600', color: '#0f172a' }}
                                                    />
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="total" 
                                                        stroke="#10b981" 
                                                        strokeWidth={3} 
                                                        dot={{ fill: '#ecfdf5', stroke: '#10b981', r: 5 }}
                                                        activeDot={{ r: 8, strokeWidth: 3, fill: 'white', stroke: '#10b981' }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="text-center flex flex-col items-center justify-center h-full p-12">
                                            <FiTrendingUp className="w-16 h-16 text-emerald-400 mx-auto mb-6 opacity-60" />
                                            <h3 className="text-2xl font-bold text-slate-800 mb-4">No Revenue Data Yet</h3>
                                            <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                                                Complete your first orders to see revenue trends. Charts update by the selected daily, monthly, or yearly breakdown.
                                            </p>
                                        </div>
                                    )
                                ) : activeMetricModal === 'growth' ? (
                                    <div className="text-center flex flex-col items-center justify-center h-full p-12">
                                        <FiTrendingUp className="w-16 h-16 text-emerald-400 mx-auto mb-6 opacity-60" />
                                        <h3 className="text-2xl font-bold text-slate-800 mb-4">Monthly Revenue Growth</h3>
                                        <p className="text-5xl font-black text-emerald-700 mb-4">
                                            {(stats?.revenueGrowth || 0) > 0 ? '+' : ''}{(stats?.revenueGrowth || 0).toFixed(1)}%
                                        </p>
                                        <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                                            This compares completed-order revenue for the current month against the previous month.
                                        </p>
                                    </div>
                                ) : activeMetricModal === 'pending' ? (
                                    loadingPending ? (
                                        <div className="h-full flex items-center justify-center min-h-[400px]">
                                            <div className="text-center">
                                                <div className="w-12 h-12 border-4 border-slate-200/50 rounded-full animate-spin border-t-emerald-600 mx-auto mb-4"></div>
                                                <p className="text-lg text-slate-600 font-medium">Loading backlog...</p>
                                            </div>
                                        </div>
                                    ) : pendingOrdersData.length > 0 ? (
                                        <div className="space-y-4 h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                                            {pendingOrdersData.map(order => (
                                                <div key={order.id} className="flex items-center justify-between p-5 bg-stone-50 border border-stone-200 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-stone-100 flex items-center justify-center font-black text-slate-700">
                                                            #{order.id}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900">{order.customer?.name || 'Customer'}</h4>
                                                            <p className="text-sm text-slate-500">{order.service?.service_name || 'Custom Service'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm ${STATUS_COLORS[order.status] || 'bg-stone-200 text-stone-800'}`}>
                                                            {order.status}
                                                        </span>
                                                        <Link 
                                                            href={route('store.orders.show', order.id)}
                                                            className="px-4 py-2 bg-white border border-stone-200 hover:border-emerald-500 hover:text-emerald-600 text-stone-600 font-bold rounded-xl text-sm transition-colors shadow-sm"
                                                        >
                                                            Review →
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center flex flex-col items-center justify-center min-h-[400px] p-12">
                                            <FiCheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-6 opacity-60" />
                                            <h3 className="text-2xl font-bold text-slate-800 mb-4">Inbox Zero!</h3>
                                            <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                                                You have no pending requests or unquoted orders. Great job keeping up with your customers!
                                            </p>
                                        </div>
                                    )
                                ) : (
                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FiTrendingUp className="w-10 h-10 text-emerald-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">Data Visualization Pending</h3>
                                        <p className="text-slate-500 max-w-sm mx-auto">
                                            Backend queries required. Once the controller passes historical data, we will render the interactive {activeMetricModal === 'pending' || activeMetricModal === 'customers' ? 'list' : 'chart'} here.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Heatmap Day Orders Modal */}
                {heatmapModalDay && (
                    <div
                        className="fixed inset-0 z-[95] flex items-center justify-center bg-stone-900/70 backdrop-blur-sm p-4 sm:p-6"
                        onClick={() => setHeatmapModalDay(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 sm:p-8 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl shadow-inner">
                                        <FiCalendar />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900">{heatmapModalDay} Orders</h2>
                                        <p className="text-slate-500 font-medium text-sm">{heatmapModalOrders.length} order(s) due this day</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setHeatmapModalDay(null)}
                                    className="w-10 h-10 rounded-full bg-stone-200/60 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>

                            <div className="p-6 sm:p-8 bg-white min-h-[260px] max-h-[62vh] overflow-y-auto custom-scrollbar">
                                {heatmapModalOrders.length > 0 ? (
                                    <div className="space-y-4">
                                        {heatmapModalOrders.map((order) => (
                                            <div key={order.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-stone-50 border border-stone-200 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-stone-100 flex items-center justify-center font-black text-slate-700">
                                                        #{order.id}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900">{order.customer?.name || 'Customer'}</h4>
                                                        <p className="text-sm text-slate-500">{order.service?.service_name || 'Custom Service'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 md:gap-4">
                                                    {order.rush_order && (
                                                        <span className="px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                                                            Rush
                                                        </span>
                                                    )}
                                                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm ${STATUS_COLORS[order.status] || 'bg-stone-200 text-stone-800'}`}>
                                                        {order.status}
                                                    </span>
                                                    <Link
                                                        href={route('store.orders.show', order.id)}
                                                        className="px-4 py-2 bg-white border border-stone-200 hover:border-emerald-500 hover:text-emerald-700 text-stone-700 font-bold rounded-xl text-sm transition-colors shadow-sm"
                                                    >
                                                        View Order
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16">
                                        <FiCheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4 opacity-70" />
                                        <h3 className="text-xl font-black text-slate-800 mb-2">No Orders On {heatmapModalDay}</h3>
                                        <p className="text-slate-500">There are no deadlines scheduled for this day in the current week.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}

                <Modal show={showCongratsModal} onClose={() => setShowCongratsModal(false)} maxWidth="md">
                    <div className="p-8 text-center">
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                            <span className="text-4xl">🎉</span>
                        </div>
                        <h3 className="mb-3 text-2xl font-black text-stone-900">Congratulations!</h3>
                        <p className="mb-8 leading-relaxed text-stone-600">
                            Your shop has been officially <strong className="text-emerald-700">Approved</strong>! You are now visible to customers and can start taking tailoring orders.
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowCongratsModal(false)}
                            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700"
                        >
                            Let's Get to Work
                        </button>
                    </div>
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}