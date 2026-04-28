import React from 'react';

const ORDER_STEPS = ['Ordered', 'Accepted', 'Measuring', 'Tailoring', 'Ready'];

const getStepIndex = (status) => {
    // Normalize status to lowercase to prevent case-sensitivity bugs
    const rawStatus = (status || 'pending')
        .toString()
        .trim()
        .toLowerCase();

    const statusMap = {
        'requested': 0,
        'pending': 0,
        'quoted': 1,
        'confirmed': 2,
        'appointment scheduled': 2,
        'ready for production': 2,
        'in progress': 3,
        'in production': 3,
        'ready': 4,
        'ready for pickup': 4,
        'completed': 4,
        'rejected': 0,
        'declined': 0,
        'cancelled': 0
    };
    return statusMap[rawStatus] || 0;
};

export default function OrderProgress({ status, className = '' }) {
    const currentStep = getStepIndex(status);

    return (
        <div className={`relative pt-12 pb-6 ${className}`}>
            {/* Step nodes */}
            <div className="flex items-center justify-between relative z-10 px-4">
                {ORDER_STEPS.map((step, index) => {
                    const isCompleted = index <= currentStep;
                    const isCurrent = index === currentStep;
                    
                    return (
                        <div key={step} className="flex flex-col items-center z-20">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-700 border-4 ${
                                isCompleted 
                                    ? 'bg-gradient-to-r from-orchid-purple to-orchid-blue text-white border-orchid-blue shadow-orchid-blue/50 ring-4 ring-orchid-blue/30' 
                                    : 'bg-stone-100/80 text-stone-500 border-stone-200/50 shadow-stone-200/50'
                            } ${isCurrent ? 'animate-ping [animation-duration:2s]' : ''}`}>
                                {isCompleted ? (
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/>
                                    </svg>
                                ) : (
                                    index + 1
                                )}
                            </div>
                            <span className={`text-xs mt-2 font-black tracking-wider uppercase px-2 py-1 rounded-full ${
                                isCompleted ? 'text-orchid-purple bg-orchid-purple/10 shadow-sm' : 'text-stone-400'
                            }`}>
                                {step}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Background track */}
            <div className="absolute top-[2.25rem] left-6 right-6 h-1.5 bg-gradient-to-r from-stone-200/50 to-stone-200/50 rounded-full shadow-inner -z-10 backdrop-blur-sm" />

            {/* Progress fill - animated */}
            <div 
                className="absolute top-[2.25rem] left-6 h-1.5 bg-gradient-to-r from-orchid-blue via-orchid-purple to-pink-500 rounded-full shadow-lg -z-0 backdrop-blur-md transition-all duration-1000 ease-out"
                style={{ 
                    width: `${Math.max((currentStep / (ORDER_STEPS.length - 1)) * 100, 5)}%`,
                    right: '1.5rem'
                }}
            />
        </div>
    );
}

