import React from 'react';
import { Link } from '@inertiajs/react';

const StatCard = ({ title, value, trend, changePositive, icon: Icon, variant = 'default', sparkle = false, onClick }) => {
  const variants = {
    revenue: 'bg-gradient-to-br from-emerald-500 via-emerald-400 to-blue-500 text-white shadow-2xl shadow-emerald-500/25 border-emerald-200/50',
    pending: 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-2xl shadow-purple-500/25 border-purple-200/50',
    growth: 'bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100 shadow-2xl shadow-slate-500/25 border-slate-200/50',
    customers: 'bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-2xl shadow-blue-500/25 border-blue-200/50',
  };

  const baseClasses = `rounded-2xl p-6 shadow-lg border hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`;

  const sparkleEffect = sparkle ? (
    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-transparent to-emerald-400/20 animate-pulse opacity-75" />
  ) : null;

  const viewDetailsHint = onClick ? (
    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs font-bold uppercase tracking-widest text-white/90">
      View Details ↗
    </div>
  ) : null;

  const trendIcon = changePositive ? (
    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ) : (
    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  );

  const handleKeyDown = (e) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <div 
      className={`${baseClasses} ${variants[variant] || variants.default}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : -1}
    >
      {sparkleEffect}
      {viewDetailsHint}
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-sm font-medium opacity-90 uppercase tracking-wide mb-1">{title}</p>
          <p className="text-3xl font-black drop-shadow-lg">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2 text-sm opacity-90">
              {trendIcon}
              <span>{trend}%</span>
            </div>
          )}
        </div>
        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          {Icon ? <Icon className="w-7 h-7 opacity-90" /> : null}
        </div>
      </div>
    </div>
  );
};

export default StatCard;

