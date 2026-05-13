import React, { useState, useEffect, useRef } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function ServiceCarousel({ 
  categories = [], 
  toggle, 
  selected = [],
  isPaused: externalPaused = false 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const fallbackImage =
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520"><rect width="800" height="520" fill="#f5f5f4"/><rect x="40" y="40" width="720" height="440" rx="36" fill="#ffffff" stroke="#e7e5e4" stroke-width="6"/><path d="M200 330c70-120 150-120 220 0 35-80 95-120 180-120 40 0 80 12 120 36" fill="none" stroke="#a855f7" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/><circle cx="250" cy="215" r="28" fill="#4568dc" opacity="0.9"/><circle cx="550" cy="190" r="28" fill="#b06ab3" opacity="0.9"/><text x="400" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#57534e">Service image unavailable</text></svg>'
    );

  const carouselRef = useRef(null);
  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 320; // Approx card width + gap
      carouselRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const getServiceImage = (categoryName) => {
    const normalized = (categoryName || '').toString().trim().toLowerCase();
    const mapping = {
        'alterations': '/images/Alterations.jpg',
        'alteration': '/images/Alterations.jpg',
        'custom sewing': '/images/CUSTOM-SEWING.png',
        'custom-sewing': '/images/CUSTOM-SEWING.png',
        'formal wear': '/images/Formal Wear.jpg',
        'formal-wear': '/images/Formal Wear.jpg',
        'embroidery': '/images/Embroidery.jpg',
        'repairs': '/images/Repairs.jpg',
    };
    return mapping[normalized] || fallbackImage;
  };

  const isSelected = (category) => selected.includes(category);

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 relative group" 
         onMouseEnter={() => setIsHovered(true)} 
         onMouseLeave={() => setIsHovered(false)}>
      
      <h2 className="text-3xl font-black bg-gradient-to-r from-orchid-purple to-orchid-pink bg-clip-text text-transparent mb-6 tracking-tight">Explore Services</h2>
      
      {/* Navigation Arrows */}
      <button onClick={() => scroll('left')} className="absolute left-0 md:-left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 p-3 rounded-full shadow-lg border border-stone-100 text-stone-600 hover:text-orchid-600 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 hidden md:block">
        <FiChevronLeft className="w-6 h-6" />
      </button>
      
      <button onClick={() => scroll('right')} className="absolute right-0 md:-right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 p-3 rounded-full shadow-lg border border-stone-100 text-stone-600 hover:text-orchid-600 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 hidden md:block">
        <FiChevronRight className="w-6 h-6" />
      </button>

      <div ref={carouselRef} className="flex gap-4 md:gap-6 overflow-x-auto pb-8 pt-4 snap-x snap-mandatory hide-scrollbar">
        {categories.map((category) => (
          <div 
            key={category} 
            className="flex-none w-64 md:w-72 snap-center cursor-pointer"
            onClick={() => toggle(category)}
          >
            <div className={`flex flex-col h-72 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 ${isSelected(category) ? 'border-orchid-500 ring-4 ring-orchid-500/20 translate-y-[-8px]' : 'border-transparent hover:border-orchid-200'}`}>
              <div className="h-52 w-full relative overflow-hidden bg-stone-100">
                <img 
                  src={getServiceImage(category)} 
                  alt={category}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                  onError={(e) => {
                    if (e.currentTarget.dataset.fallbackApplied === 'true') return;
                    e.currentTarget.dataset.fallbackApplied = 'true';
                    e.currentTarget.src = fallbackImage;
                  }}
                />
              </div>
              <div className={`h-20 flex items-center justify-center px-4 transition-colors ${isSelected(category) ? 'bg-orchid-50' : 'bg-white'}`}>
                <span className={`text-sm md:text-base font-black uppercase tracking-wider text-center ${isSelected(category) ? 'text-orchid-700' : 'text-stone-700'}`}>
                  {category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
