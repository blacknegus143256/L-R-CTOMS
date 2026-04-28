import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ShopCoverCarousel({ shop, selectedAttributes = [], selectedServiceCategories = [], getShopInitials, categories = [] }) {
    const scrollRef = useRef(null);

    // Magic Logic: Find ALL uploaded images among ALL selected services
    const matchingServices = selectedServiceCategories && selectedServiceCategories.length > 0 
        ? shop.services?.filter(s => selectedServiceCategories.includes(s.service_category?.name) && s.image)
        : [];

    const filteredAttrs = (shop?.attributes || []).filter(attr => selectedAttributes.includes(attr.id));
    const slides = [];

    if (shop?.image_url) {
        slides.push({ id: 'main', url: shop.image_url, title: shop?.shop_name, subtitle: 'Cover Photo' });
    }

    // Service images as priority after main cover
    matchingServices.forEach(service => {
        slides.push({
            id: `service-${service.id}`,
            url: service.image?.startsWith('http') ? service.image : `/storage/${service.image}`,
            title: service.service_name,
            subtitle: `₱${Number(service.price || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`,
            badge: service.service_category?.name
        });
    });

    filteredAttrs.forEach(attr => {
        if (attr.pivot?.image_url) {
            // Look up the parent category (e.g., "Fabric") that contains this attribute (e.g., "Silk")
            const parentCategory = categories.find(cat => 
                (cat.attribute_types || []).some(type => type.id === attr.id)
            );
            
            const categoryName = parentCategory ? parentCategory.name : '';
            const badgeText = categoryName ? `${categoryName} - ${attr.name}` : attr.name;

            slides.push({
                id: attr.pivot.id || attr.id,
                url: `/storage/${attr.pivot.image_url}`,
                title: attr.pivot?.item_name || attr.name,
                subtitle: `₱${Number(attr.pivot?.price || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`,
                badge: badgeText
            });
        }
    });

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = direction === 'left' ? -300 : 300;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.style.background = 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)';
        e.target.style.backgroundSize = 'cover';
        e.target.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#ef4444,#f97316);border-radius:12px">
            <span style="color:white;font-weight:bold;font-size:48px;font-family:Arial,sans-serif">${getShopInitials(shop?.shop_name)}</span>
        </div>`;
    };

    if (slides.length === 0) {
        return (
            <div className="h-64 w-full overflow-hidden bg-stone-100">
                {shop.logo_url ? (
                    <img
                        src={`/storage/${shop.logo_url}`}
                        alt={shop.shop_name}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-br from-indigo-100 via-purple-50 to-emerald-50" />
                )}
            </div>
        );
    }

    if (slides.length === 1) {
        return (
            <div className="h-64 w-full relative overflow-hidden">
                <img 
                    src={slides[0].url} 
                    alt={slides[0].title} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    onError={handleImageError}
                />
                {slides[0].id !== 'main' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-stone-900/90 pt-10 pb-3 px-4 to-transparent">
                        {slides[0].badge && (
                            <span className="inline-block px-2 py-0.5 mb-1 text-[9px] font-black uppercase tracking-wider text-white bg-orchid-500 rounded-full shadow-sm">
                                {slides[0].badge}
                            </span>
                        )}
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
                        <img 
                            src={slide.url} 
                            alt={slide.title} 
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                        />
                        {slide.id !== 'main' && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-stone-900/90 pt-12 pb-4 px-5 to-transparent">
                                {slide.badge && (
                                    <span className="inline-block px-2.5 py-0.5 mb-1.5 text-[10px] font-black uppercase tracking-wider text-white bg-orchid-500 rounded-full shadow-sm">
                                        {slide.badge}
                                    </span>
                                )}
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
