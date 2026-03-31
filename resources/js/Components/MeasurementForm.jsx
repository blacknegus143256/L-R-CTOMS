import React from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

export default function MeasurementForm({ data, setData, errors, className = '', measurementsToShow }) {
  const allMeasurements = [
    { key: 'chest', label: 'Chest (inches)', placeholder: '38', guide: 'Measure around fullest part of chest' },
    { key: 'waist', label: 'Waist (inches)', placeholder: '32', guide: 'Measure around natural waistline' },
    { key: 'hips', label: 'Hips (inches)', placeholder: '40', guide: 'Measure around fullest part of hips' },
    { key: 'shoulder', label: 'Shoulder Width (inches)', placeholder: '18', guide: 'Measure across back from shoulder seam to seam' },
    { key: 'sleeve_length', label: 'Sleeve Length (inches)', placeholder: '25', guide: 'Measure from shoulder to wrist' },
    { key: 'neck', label: 'Neck (inches)', placeholder: '15', guide: 'Measure around base of neck' },
    { key: 'full_length', label: 'Full Length (inches)', placeholder: '30', guide: 'Measure from shoulder to hem' },
  ];

  return (
    <section className={`space-y-4 ${className}`}>
      <header className="mb-6">
        <h3 className="text-lg font-semibold text-stone-900 mb-2">Body Measurements</h3>
        <p className="text-sm text-stone-600">Enter your measurements in inches for precise bespoke fitting. Use a tape measure for accuracy.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
{measurementsToShow?.length ? allMeasurements.filter(({ key }) => measurementsToShow.includes(key)).map(({ key, label, placeholder, guide }) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between">
              <InputLabel htmlFor={key} value={label} className="text-[10px] font-black uppercase tracking-[0.15em] text-stone-400 mb-1.5 block" />
              <div className="group relative">
                <button 
                  type="button"
                  className="p-1 text-stone-400 hover:text-stone-600 transition-colors"
                  title={guide}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="relative">
              <TextInput
                id={key}
                name={key}
                type="number"
                step="0.25"
                min="0"
                className="bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-500 focus:border-orchid-blue focus:ring-2 focus:ring-orchid-blue/20 pr-8 py-2 px-3 rounded-xl w-full"
                value={data[key] || ''}
                onChange={(e) => setData(key, e.target.value)}
                placeholder={placeholder}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400 pointer-events-none">IN</span>
            </div>
            <InputError className="mt-1" message={errors[key]} />
          </div>
        )) : allMeasurements.map(({ key, label, placeholder, guide }) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between">
              <InputLabel htmlFor={key} value={label} className="text-[10px] font-black uppercase tracking-[0.15em] text-stone-400 mb-1.5 block" />
              <div className="group relative">
                <button 
                  type="button"
                  className="p-1 text-stone-400 hover:text-stone-600 transition-colors"
                  title={guide}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="relative">
              <TextInput
                id={key}
                name={key}
                type="number"
                step="0.25"
                min="0"
                className="bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-500 focus:border-orchid-blue focus:ring-2 focus:ring-orchid-blue/20 pr-8 py-2 px-3 rounded-xl w-full"
                value={data[key] || ''}
                onChange={(e) => setData(key, e.target.value)}
                placeholder={placeholder}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400 pointer-events-none">IN</span>
            </div>
            <InputError className="mt-1" message={errors[key]} />
          </div>
        ))}
      </div>
    </section>
  );
}
