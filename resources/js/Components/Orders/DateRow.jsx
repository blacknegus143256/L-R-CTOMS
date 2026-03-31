export default function DateRow({ label, date, isAdmin, onEdit, isHighlight = false }) {
    const formattedDate = date ? new Date(date).toLocaleDateString() : null;
    return (
        <div className={`flex justify-between items-center p-3 rounded-xl border ${isHighlight ? 'bg-violet-50 border-violet-200' : 'bg-white border-stone-100'}`}>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{label}</span>
            {isAdmin ? (
                <button onClick={onEdit} className="text-sm font-bold text-violet-600 hover:text-purple-600 hover:underline transition-colors">
                    {formattedDate || 'Set Date +'}
                </button>
            ) : (
                <span className={`text-sm font-bold ${isHighlight ? 'text-violet-600' : 'text-stone-900'}`}>
                    {formattedDate || 'TBD'}
                </span>
            )}
        </div>
    );
}
