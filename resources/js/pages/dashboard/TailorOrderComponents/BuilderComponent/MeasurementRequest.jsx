import React from 'react';
import { Ruler } from 'lucide-react';

const MeasurementRequest = ({
    currentOrder,
    measurementFields,
    setMeasurementFields,
    measurementUnit,
    setMeasurementUnit,
    handleSendMeasurements,
    handleSendQuote,
    isSubmittingMeasurements,
    measurementSuccess,
    isMeasurementFormLocked,
    isMeasurementLocked,
    isLocked,
    isSubmitted,
    isRequested
}) => {
    return (
        <div id="measurements" tabIndex={-1} className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm flex flex-col h-full outline-none">
            {(() => {
                const measurementType = (currentOrder?.measurement_type || '').toString().trim().toLowerCase();
                const isCustomerFlow = ['profile', 'self_measured'].includes(measurementType);
                const isInShopFlow = ['scheduled', 'workshop_fitting'].includes(measurementType);

                return (
            <div className="mb-6">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-1">
                    <Ruler className="w-6 h-6 text-indigo-600" />
                    {isCustomerFlow ? 'Request Customer Measurements' : isInShopFlow ? 'In-Shop Measurement Tracker' : 'Request Measurements'}
                </h2>
                <p className="text-sm text-stone-500">List the specific body parts the customer needs to measure.</p>
            </div>
                );
            })()}

            {['profile', 'self_measured'].includes((currentOrder?.measurement_type || '').toString().trim().toLowerCase()) ? (
                <div className="flex flex-col flex-1">
                    {/* Status Banner */}
                    {isMeasurementFormLocked && (
                        <div className={`p-4 rounded-2xl mb-4 border-l-4 font-black text-lg flex items-center gap-2 ${
                            isSubmitted ? 'bg-emerald-50 border-emerald-400 text-emerald-800' : 
                            (isRequested || measurementSuccess) ? 'bg-amber-50 border-amber-400 text-amber-800' : 
                            'bg-stone-100 border-stone-400 text-stone-700'
                        }`}>
                            {isSubmitted ? '✅ Measurements Submitted' : 
                             (isRequested || measurementSuccess) ? '⏳ Request Sent – Awaiting Customer...' : 
                             '🔒 Locked'}
                        </div>
                    )}
                    <div className="flex gap-4 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="unit"
                                value="inches"
                                checked={measurementUnit === 'inches'}
                                onChange={() => setMeasurementUnit('inches')}
                                disabled={isMeasurementFormLocked}
                                className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-bold text-stone-700">Inches (in)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="unit"
                                value="cm"
                                checked={measurementUnit === 'cm'}
                                onChange={() => setMeasurementUnit('cm')}
                                disabled={isMeasurementFormLocked}
                                className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-bold text-stone-700">Centimeters (cm)</span>
                        </label>
                    </div>

                    <div className="space-y-3 flex-1">
                        {(measurementFields || []).map((field, index) => (
                            <div key={index} className="flex items-start gap-3 p-4 bg-stone-50 border border-stone-200 rounded-2xl relative group">
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                                                Part to Measure
                                            </label>
                                            {currentOrder?.measurement_snapshot?.submitted?.[field.name] && (
                                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                    ✓ Customer Provided
                                                </span>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            value={field.name}
                                            onChange={(e) => {
                                                if (isMeasurementFormLocked) return;
                                                const newFields = [...measurementFields];
                                                newFields[index] = { ...newFields[index], name: e.target.value };
                                                setMeasurementFields(newFields);
                                            }}
                                            disabled={isMeasurementFormLocked}
                                            readOnly={isMeasurementFormLocked}
                                            className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500 shadow-inner font-medium text-slate-800 disabled:bg-stone-200 disabled:text-stone-500 disabled:border-stone-200 disabled:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
                                            placeholder="e.g., Chest, Inseam, Sleeve Length"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Measuring Instructions (Optional)</label>
                                        <textarea
                                            value={field.instruction}
                                            onChange={(e) => {
                                                if (isMeasurementFormLocked) return;
                                                const newFields = [...measurementFields];
                                                newFields[index] = { ...newFields[index], instruction: e.target.value };
                                                setMeasurementFields(newFields);
                                            }}
                                            rows="2"
                                            disabled={isMeasurementFormLocked}
                                            readOnly={isMeasurementFormLocked}
                                            className="w-full border border-stone-200 rounded-xl px-4 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-stone-600 resize-none disabled:bg-stone-200 disabled:text-stone-500 disabled:border-stone-200 disabled:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
                                            placeholder="e.g., Measure around the fullest part, keeping the tape horizontal."
                                        />
                                    </div>
                                </div>
                                {!isMeasurementFormLocked && (
                                    <button
                                        onClick={() => {
                                            if(isMeasurementFormLocked) return;
                                            const newFields = measurementFields.filter((_, i) => i !== index);
                                            setMeasurementFields(newFields.length ? newFields : [{ name: '', instruction: '', value: '' }]);
                                        }}
                                        className="w-8 h-8 flex items-center justify-center bg-white border border-stone-200 text-stone-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-xl transition-all shadow-sm shrink-0"
                                        title="Remove Measurement"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {!isMeasurementFormLocked && (
                        <button
                            onClick={() => {
                                if(isMeasurementFormLocked) return;
                                setMeasurementFields([...(measurementFields || []), { name: '', instruction: '', value: '' }]);
                            }}
                            disabled={isMeasurementFormLocked}
                            className="w-full py-3 mt-4 border-2 border-dashed border-stone-300 text-stone-500 font-bold rounded-xl hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="text-lg leading-none">+</span> Add Another Part
                        </button>
                    )}
                    
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            if (handleSendMeasurements) handleSendMeasurements(e);
                            else if (handleSendQuote) handleSendQuote(e);
                        }}
                        disabled={isMeasurementLocked || isSubmittingMeasurements}
                        className={`w-full mt-6 py-4 font-black text-lg rounded-xl transition-all shadow-md ${
                            isMeasurementLocked 
                                ? 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200' 
                                : isSubmitted 
                                    ? 'bg-emerald-500 text-white' 
                                    : isRequested 
                                        ? 'bg-amber-500 text-white' 
                                        : measurementSuccess 
                                            ? 'bg-emerald-500 text-white'
                                            : isSubmittingMeasurements 
                                                ? 'bg-indigo-500 text-white' 
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                    >
                        {isMeasurementLocked 
                            ? '🔒 Measurements Locked' 
                            : isSubmitted 
                                ? '✅ Measurements Received' 
                                : isRequested 
                                    ? '⏳ Awaiting Customer...' 
                                    : isSubmittingMeasurements 
                                        ? 'Sending...' 
                                        : measurementSuccess 
                                            ? '✅ Request Sent!' 
                                            : '📏 Send Customer Measurement Request'
                        }
                    </button>
                </div>
            ) : ['scheduled', 'workshop_fitting'].includes(currentOrder?.measurement_type) ? (
                <div className="flex flex-col flex-1">
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                        <div>
                            <h3 className="font-black text-blue-800 flex items-center gap-2">
                                <span className="text-xl">📍</span> In-Shop Fitting
                            </h3>
                            <p className="text-xs text-blue-600 font-medium mt-1">Internal tracker (Not sent to customer)</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black uppercase text-blue-400 block tracking-wider">Fitting Date</span>
                            <span className="text-sm font-bold text-blue-900">
                                {currentOrder?.measurement_date ? new Date(currentOrder.measurement_date).toLocaleDateString() : 'TBD'}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-4 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="unit" value="inches" checked={measurementUnit === 'inches'} onChange={() => setMeasurementUnit('inches')} disabled={isMeasurementFormLocked} className="text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm font-bold text-stone-700">Inches (in)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="unit" value="cm" checked={measurementUnit === 'cm'} onChange={() => setMeasurementUnit('cm')} disabled={isMeasurementFormLocked} className="text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm font-bold text-stone-700">Centimeters (cm)</span>
                        </label>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {(measurementFields?.length ? measurementFields : [{ name: '', instruction: '', value: '' }]).map((field, index) => (
                            <div key={index} className="flex items-start gap-3 p-4 bg-stone-50 border border-stone-200 rounded-2xl relative group">
                                <div className="flex-1 flex gap-4">
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                                                Part to Measure
                                            </label>
                                            {currentOrder?.measurement_snapshot?.submitted?.[field.name] && (
                                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                    ✓ Customer Provided
                                                </span>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            value={field.name || ''}
                                            onChange={(e) => {
                                                if (isMeasurementFormLocked) return;
                                                const newFields = [...measurementFields];
                                                newFields[index] = { ...newFields[index], name: e.target.value };
                                                setMeasurementFields(newFields);
                                            }}
                                            disabled={isMeasurementFormLocked}
                                            readOnly={isMeasurementFormLocked}
                                            className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 shadow-inner font-medium text-slate-800 disabled:bg-stone-200 disabled:text-stone-500 disabled:border-stone-200 disabled:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
                                            placeholder="e.g., Chest, Inseam"
                                        />
                                    </div>
                                    <div className="w-28 sm:w-32">
                                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Value</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={field.value || ''}
                                            onChange={(e) => {
                                                if (isMeasurementFormLocked) return;
                                                const newFields = [...measurementFields];
                                                newFields[index] = { ...newFields[index], value: e.target.value };
                                                setMeasurementFields(newFields);
                                            }}
                                            disabled={isMeasurementFormLocked}
                                            className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 shadow-inner font-bold text-slate-800 disabled:bg-stone-200 disabled:text-stone-500 disabled:border-stone-200 disabled:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
                                            placeholder="0.0"
                                        />
                                    </div>
                                </div>
                                {!isMeasurementFormLocked && (
                                    <button
                                        onClick={() => {
                                            if(isLocked) return;
                                            const newFields = measurementFields.filter((_, i) => i !== index);
                                            setMeasurementFields(newFields.length ? newFields : [{ name: '', instruction: '', value: '' }]);
                                        }}
                                        className="w-8 h-8 flex items-center justify-center bg-white border border-stone-200 text-stone-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-xl transition-all shadow-sm shrink-0"
                                        title="Remove Measurement"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {!isMeasurementFormLocked && (
                        <button
                            onClick={() => {
                                if(isLocked) return;
                                setMeasurementFields([...(measurementFields || []), { name: '', instruction: '', value: '' }]);
                            }}
                            className="w-full py-3 mt-4 border-2 border-dashed border-stone-300 text-stone-500 font-bold rounded-xl hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="text-lg leading-none">+</span> Add Part to Measure
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            if (handleSendMeasurements) handleSendMeasurements(e);
                        }}
                        disabled={isSubmittingMeasurements || isMeasurementFormLocked}
                        className={`w-full mt-6 py-4 font-black text-lg rounded-xl transition-all shadow-md ${
                            isMeasurementFormLocked 
                                ? 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200' 
                                : measurementSuccess 
                                    ? 'bg-emerald-500 text-white' 
                                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                        }`}
                    >
                        {isMeasurementFormLocked 
                            ? '🔒 Measurements Locked' 
                            : measurementSuccess 
                                ? '✅ Measurements Saved!' 
                                : (isSubmittingMeasurements ? 'Saving...' : '💾 Save In-Shop Measurements')
                        }
                    </button>
                </div>
            ) : (
                <div className="p-6 bg-stone-50 border border-stone-200 border-dashed rounded-2xl text-center h-full flex flex-col items-center justify-center">
                    <span className="text-3xl block mb-3">✂️</span>
                    <h3 className="font-black text-stone-800 mb-2 text-lg">No Measurements Required</h3>
                    <p className="text-sm text-stone-500 font-medium px-4">
                        The customer indicated this is a standard alteration or they will provide a reference garment. No measurement tracking is needed.
                    </p>
                </div>
            )}
        </div>
    );
};

export default MeasurementRequest;
