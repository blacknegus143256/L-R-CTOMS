export default function StatusBadge({ status }) {
    const config = {
        'Requested': 'bg-amber-50 text-amber-600 border-amber-200',
        'Pending': 'bg-amber-50 text-amber-600 border-amber-200',
        'Quoted': 'bg-sky-50 text-sky-600 border-sky-200',
        'Confirmed': 'bg-blue-50 text-blue-700 border-blue-200',
        'Accepted': 'bg-orchid-blue/10 text-orchid-blue border-orchid-blue/20',
        'Appointment Scheduled': 'bg-indigo-50 text-indigo-600 border-indigo-200',
        'Ready for Production': 'bg-cyan-50 text-cyan-700 border-cyan-200',
        'In Progress': 'bg-orchid-purple/10 text-orchid-purple border-orchid-purple/20',
        'Ready': 'bg-emerald-50 text-emerald-600 border-emerald-200',
        'Ready for Pickup': 'bg-emerald-50 text-emerald-700 border-emerald-300',
        'Ready to Pick Up': 'bg-emerald-50 text-emerald-700 border-emerald-300',
        'Completed': 'bg-stone-100 text-stone-600 border-stone-200',
        'Rejected': 'bg-rose-50 text-rose-700 border-rose-200',
        'Declined': 'bg-rose-50 text-rose-700 border-rose-200',
        'Cancelled': 'bg-rose-50 text-rose-600 border-rose-200',
        'Awaiting Materials': 'bg-orange-50 text-orange-700 border-orange-200',
        unknown: 'bg-stone-50 text-stone-600 border-stone-200',
    };

    const safeStatus = status || 'unknown';
    const normalizedStatus = safeStatus === 'Ready forPickup' ? 'Ready for Pickup' : safeStatus;

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${config[normalizedStatus] || config.unknown}`}>
            {normalizedStatus}
        </span>
    );
}
