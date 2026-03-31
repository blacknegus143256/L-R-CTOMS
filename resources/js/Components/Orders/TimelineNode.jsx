export default function TimelineNode({ label, date, active }) {
    return (
        <div className="flex flex-col items-center flex-1 relative">
            <div className={`z-10 w-4 h-4 rounded-full border-2 transition-all duration-500 ${
                active ? 'bg-purple-500 border-purple-500 shadow-[0_0_10px_rgba(168,139,250,0.5)]' : 'bg-white border-stone-200'
            }`} />
            <p className={`mt-2 text-[10px] font-black uppercase tracking-tighter ${active ? 'text-stone-900' : 'text-stone-400'}`}>
                {label}
            </p>
            {date && <p className="text-[9px] text-stone-400 font-medium">{new Date(date).toLocaleDateString()}</p>}
        </div>
    );
}
