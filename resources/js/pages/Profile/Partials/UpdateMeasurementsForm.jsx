import { useForm, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import PrimaryButton from '@/Components/PrimaryButton';
import InputError from '@/Components/InputError';
import MeasurementForm from '@/Components/MeasurementForm';
import { useEffect } from 'react';

export default function UpdateMeasurementsForm({ profileMeasurements = {}, className = '' }) {
    const { auth } = usePage().props;

    const { data, setData, patch, processing, errors, recentlySuccessful, reset } = useForm({
        chest: profileMeasurements.chest || '',
        waist: profileMeasurements.waist || '',
        hips: profileMeasurements.hips || '',
        shoulder: profileMeasurements.shoulder || '',
        sleeve_length: profileMeasurements.sleeve_length || '',
        neck: profileMeasurements.neck || '',
        full_length: profileMeasurements.full_length || '',
        inseam: profileMeasurements.inseam || '',
        notes: profileMeasurements.notes || '',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.measurements.update'));
    };

    return (
        <section className={`bg-white p-8 lg:p-10 shadow-xl rounded-3xl border border-stone-200 space-y-8 ${className}`}>
            <header>
                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-8">Tailoring Profile</h3>
            </header>

            <form onSubmit={submit}>
                <div className="space-y-8">
                    {/* Upper Body */}
                    <section className="p-6 bg-stone-50/50 rounded-2xl border border-stone-100">
                        <h4 className="text-xl font-black text-stone-800 mb-6">Upper Body</h4>
                        <MeasurementForm 
                            data={data} 
                            setData={setData} 
                            errors={errors} 
                            measurementsToShow={['chest', 'shoulder', 'neck']}
                        />
                    </section>

                    {/* Lower Body */}
                    <section className="p-6 bg-stone-50/50 rounded-2xl border border-stone-100">
                        <h4 className="text-xl font-black text-stone-800 mb-6">Lower Body</h4>
                        <MeasurementForm 
                            data={data} 
                            setData={setData} 
                            errors={errors} 
                            measurementsToShow={['waist', 'hips', 'inseam']}
                        />
                    </section>

                    {/* Fit Specs */}
                    <section className="p-6 bg-stone-50/50 rounded-2xl border border-stone-100">
                        <h4 className="text-xl font-black text-stone-800 mb-6">Fit Specs</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-stone-400 mb-1.5 block">Sleeve Length</label>
                                <input
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    className="relative w-full bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-500 focus:border-orchid-blue focus:ring-2 focus:ring-orchid-blue/20 pr-8 py-2 px-3 rounded-xl"
                                    value={data.sleeve_length}
                                    onChange={(e) => setData('sleeve_length', e.target.value)}
                                    placeholder="25"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400 pointer-events-none">IN</span>
                                <InputError message={errors.sleeve_length} className="mt-1" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-stone-400 mb-1.5 block">Full Length</label>
                                <input
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    className="relative w-full bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-500 focus:border-orchid-blue focus:ring-2 focus:ring-orchid-blue/20 pr-8 py-2 px-3 rounded-xl"
                                    value={data.full_length}
                                    onChange={(e) => setData('full_length', e.target.value)}
                                    placeholder="30"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400 pointer-events-none">IN</span>
                                <InputError message={errors.full_length} className="mt-1" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-stone-400 mb-1.5 block">Notes</label>
                                <textarea
                                    className="w-full bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-500 focus:border-orchid-blue focus:ring-2 focus:ring-orchid-blue/20 py-2 px-3 rounded-xl resize-vertical min-h-[80px]"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Any special fitting notes..."
                                />
                                <InputError message={errors.notes} className="mt-1" />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sticky Save Bar */}
                <div className="pt-8 border-t border-stone-100">
                    <div className="flex items-center gap-4">
                        <PrimaryButton 
                            type="submit" 
                            disabled={processing}
                            className="fixed bottom-8 right-8 lg:right-12 bg-gradient-to-r from-orchid-blue to-orchid-purple hover:from-orchid-purple hover:to-orchid-blue text-white px-8 py-4 rounded-3xl shadow-[0_20px_50px_rgba(69,104,220,0.3)] hover:shadow-3xl transition-all font-black text-lg z-50 backdrop-blur-md border border-white/20"
                        >
                            {processing ? 'Saving...' : '💾 Save Profile'}
                        </PrimaryButton>
                        
                        <Transition
                            show={recentlySuccessful}
                            className="ml-4"
                            enter="transition ease-in-out duration-300"
                            enterFrom="opacity-0 translate-y-2"
                            enterTo="opacity-100 translate-y-0"
                            leave="transition ease-in-out duration-200"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 translate-y-2"
                        >
                            <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">Saved!</span>
                        </Transition>
                    </div>
                </div>
            </form>
        </section>
    );
}

