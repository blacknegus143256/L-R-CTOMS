export const DUMAGUETE_PSGC_BARANGAYS = [
    'Bagacay',
    'Bajumpandan',
    'Balugo',
    'Banilad',
    'Bantayan',
    'Batinguel',
    'Bunao',
    'Cadawinonan',
    'Calindagan',
    'Camanjac',
    'Candau-ay',
    'Cantil-e',
    'Daro',
    'Junob',
    'Looc',
    'Mangnao-Canal',
    'Motong',
    'Piapi',
    'Poblacion 1',
    'Poblacion 2',
    'Poblacion 3',
    'Poblacion 4',
    'Poblacion 5',
    'Poblacion 6',
    'Poblacion 7',
    'Poblacion 8',
    'Pulantubig',
    'Taclobo',
    'Talay',
    'Tubtubon',
];

export default function BarangaySelect({
    id = 'barangay',
    value = '',
    onChange,
    error,
    required = false,
    disabled = false,
    placeholder = 'Search or select barangay',
    className = '',
}) {
    const listId = `${id}-list`;

    return (
        <div className="space-y-2">
            <input
                id={id}
                type="text"
                list={listId}
                value={value || ''}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                autoComplete="off"
                className={`block w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-stone-100 ${className}`}
            />
            <datalist id={listId}>
                {DUMAGUETE_PSGC_BARANGAYS.map((barangay) => (
                    <option key={barangay} value={barangay} />
                ))}
            </datalist>
            {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}
        </div>
    );
}
