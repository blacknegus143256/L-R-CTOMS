import React from 'react';
import { motion } from 'framer-motion';

const OrderHeatmap = ({ weeklyOrders = [], onDayFilter = () => {}, selectedDay = null }) => {
    const days = [
        { key: 'Mon', label: 'Mon', index: 0 },
        { key: 'Tue', label: 'Tue', index: 1 },
        { key: 'Wed', label: 'Wed', index: 2 },
        { key: 'Thu', label: 'Thu', index: 3 },
        { key: 'Fri', label: 'Fri', index: 4 },
        { key: 'Sat', label: 'Sat', index: 5 },
        { key: 'Sun', label: 'Sun', index: 6 },
    ];

    const groupedDays = days.map((day) => {
        const orders = weeklyOrders.filter(order => {
            const date = new Date(order.expected_completion_date);
            const orderDayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
            return orderDayIndex === day.index;
        });

        const rushOrders = orders.filter(order => Boolean(order.rush_order));
        const regularOrders = orders.filter(order => !order.rush_order);

        return {
            ...day,
            orders: [...rushOrders, ...regularOrders],
            rushCount: rushOrders.length,
            totalCount: orders.length,
        };
    });

    return (
        <div className="bg-gradient-to-r from-slate-50/70 to-slate-100/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <svg className="w-7 h-7 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.65 9.65L7 18l-4.95-4.95a7 7 0 010-9.65zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Current Week Order Heatmap
            </h3>
            <div className="grid grid-cols-7 gap-3">
                {groupedDays.map((day) => {
                    const rushRatio = day.totalCount > 0 ? day.rushCount / day.totalCount : 0;
                    const isToday = day.index === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
                    const isSelected = selectedDay === day.key;
                    const intensity = day.rushCount > 2 || (day.rushCount > 0 && rushRatio >= 0.5)
                        ? 'high'
                        : day.totalCount > 2
                            ? 'medium'
                            : 'low';
                    
                    return (
                        <motion.button
                            key={day.key}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onDayFilter(day.key)}
                            className={`group relative rounded-xl p-4 shadow-md transition-all duration-300 border-2 h-24 flex flex-col items-center justify-center font-bold text-lg cursor-pointer overflow-hidden ${
                                intensity === 'high' ? 'bg-gradient-to-br from-red-500 to-orchid-purple border-red-400 shadow-red-500/50 ring-4 ring-red-200/50' :
                                intensity === 'medium' ? 'bg-gradient-to-br from-orange-400 to-yellow-500 border-orange-400 shadow-orange-400/50 ring-4 ring-orange-200/50' :
                                'bg-gradient-to-br from-slate-200 to-slate-300 border-slate-300 shadow-slate-300/50 hover:shadow-slate-400/50 ring-2 ring-slate-200/50'
                            } ${isToday ? 'ring-8 ring-emerald-300/50 shadow-emerald-400/25' : ''} ${isSelected ? 'scale-105 ring-4 ring-indigo-300/70' : ''}`}
                        >
                            <div className={`absolute inset-0 opacity-75 animate-pulse group-hover:opacity-100 transition-opacity ${intensity === 'high' ? 'bg-red-400/20' : 'bg-orange-300/20'}`} />
                            <div className="relative z-10 text-center leading-tight">
                                <div className="text-xs uppercase tracking-wider opacity-80">{day.label}</div>
                                <div className={`text-2xl ${intensity === 'high' ? 'text-white drop-shadow-lg' : 'text-slate-800'}`}>
                                    {day.totalCount}
                                </div>
                                <div className="text-[10px] uppercase tracking-widest opacity-90 mt-1">
                                    Rush {day.rushCount}
                                </div>
                            </div>
                            <div className="absolute -bottom-2 w-full h-2 bg-gradient-to-r from-transparent via-white/80 to-transparent shadow-lg" />
                        </motion.button>
                    );
                })}
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">Click a weekday to filter current-week orders. Rush orders are prioritized first in the list, then the rest of the orders for that day.</p>
        </div>
    );
};

export default OrderHeatmap;

