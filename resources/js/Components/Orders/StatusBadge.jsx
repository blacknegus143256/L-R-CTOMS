export default function StatusBadge({ status }) {
    const config = {
        'Pending': 'bg-amber-50 text-amber-600 border-amber-200',
        'Accepted': 'bg-orchid-blue/10 text-orchid-blue border-orchid-blue/20',
        'Appointment Scheduled': 'bg-indigo-50 text-indigo-600 border-indigo-200',
        'In Progress': 'bg-orchid-purple/10 text-orchid-purple border-orchid-purple/20',
        'Ready': 'bg-emerald-50 text-emerald-600 border-emerald-200',
        'Completed': 'bg-stone-100 text-stone-600 border-stone-200',
        'Cancelled': 'bg-rose-50 text-rose-600 border-rose-200',
        unknown: 'bg-stone-50 text-stone-600 border-stone-200',
    };

    const safeStatus = status || 'unknown';

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${config[safeStatus]}`}>
            {safeStatus}
        </span>
    );
}
