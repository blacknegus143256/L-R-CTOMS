import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function BarangaySelect({ id, value, onChange, className = '', error, required = false }) {
    const barangays = [
        "Bagacay", "Bajumpandan", "Balugo", "Banilad", "Bantayan", "Batinguel", 
        "Buñao", "Cadawinonan", "Calindagan", "Camanjac", "Candau-ay", "Cantil-e", 
        "Daro", "Junob", "Looc", "Mangnao", "Motong", "Piapi", "Poblacion 1 (Tinago)", 
        "Poblacion 2", "Poblacion 3", "Poblacion 4", "Poblacion 5", "Poblacion 6", 
        "Poblacion 7", "Poblacion 8", "Pulantubig", "Tabuctubig", "Taclobo", "Talay"
    ];

    return (
        <div className="relative">
            <select
                id={id}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                className={`mt-1 block w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm focus:border-orchid-blue focus:ring-2 focus:ring-orchid-blue/20 appearance-none cursor-pointer ${className}`}
            >
                <option value="" disabled>Select a Barangay</option>
                {barangays.map((b) => (
                    <option key={b} value={b}>{b}</option>
                ))}
            </select>

            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 pt-1">
                <ChevronDown className="h-4 w-4 text-stone-400" />
            </div>

            {error && (
                <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p>
            )}
        </div>
    );
}
