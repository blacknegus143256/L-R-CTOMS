export default function SpecRow({ label, value }) {
    return (
        <div className="flex flex-col py-2 border-b border-stone-50 last:border-b-0">
            <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">{label}</span>
            <span className="text-sm font-bold text-stone-800">{value || '--'}</span>
        </div>
    );
}
