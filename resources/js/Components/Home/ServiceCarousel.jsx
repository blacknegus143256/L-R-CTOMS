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

  const carouselRef = useRef(null);
  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 320; // Approx card width + gap
      carouselRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const getServiceImage = (categoryName) => {
    const mapping = {
        'Alterations': '/images/Alterations.jpg',
        'Custom Sewing': '/images/CUSTOM-SEWING.png',
        // 'Formal Wear': '/images/Formal Wear.jpg',
        'Embroidery': '/images/Embroidery.jpg',
        'Repairs': '/images/Repairs.jpg',
    };
    return mapping[categoryName] || '/images/default-service.jpg';
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
                    e.target.onerror = null; 
                    e.target.src = '/images/default-service.jpg';
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
