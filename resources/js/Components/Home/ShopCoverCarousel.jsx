import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ShopCoverCarousel({ shop, selectedAttributes, getShopInitials }) {
    const scrollRef = useRef(null);

    const filteredAttrs = (shop?.attributes || []).filter(attr => selectedAttributes.includes(attr.id));
    const slides = [];

    if (shop?.image_url) {
        slides.push({ id: 'main', url: shop.image_url, title: shop?.shop_name, subtitle: 'Cover Photo' });
    }

    filteredAttrs.forEach(attr => {
        if (attr.pivot?.image_url) {
            slides.push({
                id: attr.pivot.id || attr.id,
                url: `/storage/${attr.pivot.image_url}`,
                title: attr.pivot?.item_name || attr.name,
                subtitle: `₱${Number(attr.pivot?.price || 0).toFixed(2)}`
            });
        }
    });

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = direction === 'left' ? -300 : 300;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (slides.length === 0) {
        return (
            <div className="h-64 w-full bg-gradient-to-br from-orchid-purple/20 to-orchid-blue/20 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="w-20 h-20 bg-gradient-to-br from-orchid-purple to-orchid-blue rounded-full flex items-center justify-center text-white font-black text-3xl shadow-inner mb-3">
                    {getShopInitials(shop?.shop_name)}
                </div>
            </div>
        );
    }

    if (slides.length === 1) {
        return (
            <div className="h-64 w-full relative overflow-hidden">
                <img src={slides[0].url} alt={slides[0].title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                {slides[0].id !== 'main' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-stone-900/90 pt-8 pb-3 px-4 to-transparent">
                        <p className="text-white font-bold text-sm truncate">{slides[0].title}</p>
                        <p className="text-emerald-400 font-black text-xs">{slides[0].subtitle}</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="h-64 w-full relative group/carousel overflow-hidden bg-stone-100">
            <div ref={scrollRef} className="w-full h-full relative flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth">
                {slides.map((slide, index) => (
                    <div key={slide.id} className="w-full h-full flex-shrink-0 snap-center relative">
                        <img src={slide.url} alt={slide.title} className="w-full h-full object-cover" />
                        {slide.id !== 'main' && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-stone-900/90 pt-12 pb-4 px-5 to-transparent">
                                <p className="text-white font-bold text-base truncate">{slide.title}</p>
                                <p className="text-emerald-400 font-black text-sm">{slide.subtitle}</p>
                            </div>
                        )}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5 z-20">
                            {slides.map((_, dotIdx) => (
                                <div key={dotIdx} className={`w-1.5 h-1.5 rounded-full ${index === dotIdx ? 'bg-white' : 'bg-white/40'}`} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={(e) => { e.preventDefault(); scroll('left'); }} className="absolute top-1/2 left-2 z-30 flex items-center justify-center h-8 w-8 rounded-full bg-white/30 hover:bg-white/50 focus:ring-4 focus:ring-white/50 -translate-y-1/2 opacity-0 group-hover/carousel:opacity-100 transition-all backdrop-blur-sm">
                <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button onClick={(e) => { e.preventDefault(); scroll('right'); }} className="absolute top-1/2 right-2 z-30 flex items-center justify-center h-8 w-8 rounded-full bg-white/30 hover:bg-white/50 focus:ring-4 focus:ring-white/50 -translate-y-1/2 opacity-0 group-hover/carousel:opacity-100 transition-all backdrop-blur-sm">
                <ChevronRight className="w-5 h-5 text-white" />
            </button>
        </div>
    );
}
