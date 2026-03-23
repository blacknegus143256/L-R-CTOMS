import React, { useState } from 'react';
import { motion } from 'framer-motion';

const OrderHeatmap = ({ urgentOrders, onDayFilter = () => {} }) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayCounts = days.map((_, index) => {
        const dayIndex = index; // 0=Mon
        return urgentOrders.filter(order => {
            const date = new Date(order.expected_completion_date);
            return (date.getDay() === 0 ? 6 : date.getDay() - 1) === dayIndex;
        }).length;
    });

    const maxOrders = Math.max(...dayCounts, 1);

    return (
        <div className="bg-gradient-to-r from-slate-50/70 to-slate-100/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <svg className="w-7 h-7 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.65 9.65L7 18l-4.95-4.95a7 7 0 010-9.65zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Production Heatmap (Next 7 Days)
            </h3>
            <div className="grid grid-cols-7 gap-3">
                {days.map((day, index) => {
                    const count = dayCounts[index];
                    const urgency = count > 3 ? 'high' : count > 1 ? 'medium' : 'low';
                    const isToday = index === new Date().getDay() - 1 || (new Date().getDay() === 0 && index === 6);
                    
                    return (
                        <motion.button
                            key={day}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onDayFilter(days[index])}
                            className={`group relative rounded-xl p-4 shadow-md transition-all duration-300 border-2 h-24 flex flex-col items-center justify-center font-bold text-lg cursor-pointer overflow-hidden ${
                                urgency === 'high' ? 'bg-gradient-to-br from-red-500 to-orchid-purple border-red-400 shadow-red-500/50 ring-4 ring-red-200/50' :
                                urgency === 'medium' ? 'bg-gradient-to-br from-orange-400 to-yellow-500 border-orange-400 shadow-orange-400/50 ring-4 ring-orange-200/50' :
                                'bg-gradient-to-br from-slate-200 to-slate-300 border-slate-300 shadow-slate-300/50 hover:shadow-slate-400/50 ring-2 ring-slate-200/50'
                            } ${isToday ? 'ring-8 ring-emerald-300/50 shadow-emerald-400/25' : ''}`}
                        >
                            <div className={`absolute inset-0 opacity-75 animate-pulse group-hover:opacity-100 transition-opacity ${urgency === 'high' ? 'bg-red-400/20' : 'bg-orange-300/20'}`} />
                            <div className="relative z-10 text-center leading-tight">
                                <div className="text-xs uppercase tracking-wider opacity-80">{day}</div>
                                <div className={`text-2xl ${urgency === 'high' ? 'text-white drop-shadow-lg' : 'text-slate-800'}`}>
                                    {count}
                                </div>
                            </div>
                            <div className="absolute -bottom-2 w-full h-2 bg-gradient-to-r from-transparent via-white/80 to-transparent shadow-lg" />
                        </motion.button>
                    );
                })}
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">Click a day to filter urgent orders • Red = Heavy (3+), Orange = Medium (2), Today highlighted</p>
        </div>
    );
};

export default OrderHeatmap;

