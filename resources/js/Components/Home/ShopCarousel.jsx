    import React, { useEffect, useRef, useState } from 'react'; // Add useEffect here
    import { motion} from 'framer-motion';
    import SourceRefIcon from '@/Components/Home/SourceRefIcon';

    const conicRing = 'bg-[conic-gradient(from_180deg_at_50%_50%,#4568dc,#b06ab3,#a855f7,#4568dc)]';

    export default function ShopCarousel({
        shops,
        isPaused,
        setIsPaused,
        getShopInitials,
        selectedIds = [],
        onSelectShop,
        highlightCarousel,
        activeCategory,
    }) {
        const containerRef = useRef(null);
        const trackRef = useRef(null);
        const [overflowWidth, setOverflowWidth] = useState(0);

        // 1. Measure the container vs the track to see if we need to animate
        useEffect(() => {
            const calculateOverflow = () => {
                if (containerRef.current && trackRef.current) {
                    const containerWidth = containerRef.current.offsetWidth;
                    const trackWidth = trackRef.current.scrollWidth;

                    if (trackWidth > containerWidth) {
                        setOverflowWidth(trackWidth - containerWidth);
                    } else {
                        setOverflowWidth(0);
                    }
                }
            };

            // Small timeout ensures images/fonts load before measuring
            const timeout = setTimeout(calculateOverflow, 100);
            window.addEventListener('resize', calculateOverflow);
            return () => {
                clearTimeout(timeout);
                window.removeEventListener('resize', calculateOverflow);
            };
        }, [shops]);

        // 2. Control the Ping-Pong animation
        // useEffect(() => {
        //     if (overflowWidth > 0) {
        //         if (!isPaused) {
        //             controls.start({
        //                 x: -overflowWidth,
        //                 transition: {
        //                     repeat: Infinity,
        //                     repeatType: "mirror", // This makes it bounce back to the start!
        //                     duration: overflowWidth / 40, // Speed: 40px per second for a smooth glide
        //                     ease: 'linear'
        //                 }
        //             });
        //         } else {
        //             controls.stop(); // Freeze in place on hover
        //         }
        //     }
        // }, [overflowWidth, isPaused, controls]);
        const animationDuration = Math.max(overflowWidth / 40, 1);

        if (!shops?.length) return null;

        return (
            <div className="w-full max-w-7xl mx-auto px-4 -mt-10 relative z-20">
                <style>
                    {`
                    @keyframes pingpong { 0% { transform: translateX(0px); } 100% { transform: translateX(-${overflowWidth}px); } }
                    .running-track { animation: pingpong ${Math.max(overflowWidth / 40, 1)}s linear infinite alternate; }
                    .paused-track { animation-play-state: paused !important; }
                    `}
                </style>
                <div
                ref={containerRef}
                    className="overflow-hidden rounded-2xl border border-white/40 glass-orchid bg-white/70 shadow-2xl shadow-orchid-purple/10"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <div
                        ref={trackRef} 
                        className={`flex gap-4 p-4 w-max ${overflowWidth > 0 ? 'running-track' : ''} ${isPaused ? 'paused-track' : ''}`}
                    >
                    {/* <motion.div
                    ref={trackRef} 
                        className="flex gap-4 p-4 w-max"
                        animate={{ x: overflowWidth > 0 ? [0, -overflowWidth] : 0 }}     
                        transition={{ 
                            repeat: overflowWidth > 0 ? Infinity : 0,
                            repeatType: 'mirror', // This makes it bounce back to the start! 
                            duration: animationDuration, 
                            ease: 'linear' 
                        }}
                        style={{ 
                            animationPlayState: isPaused ? 'paused' : 'running' 
                        }}
                    > */}
                        {shops.map((shop, idx) => {
                            const selected = selectedIds.includes(String(shop.id));
                            const showCircuitRing = selected || highlightCarousel;
                            return (
                                <div
                                    key={`${shop.id}-${idx}`}
                                    className={`shrink-0 rounded-xl transition-shadow ${
                                        showCircuitRing ? `p-[2px] ${conicRing} shadow-[0_0_22px_rgba(69,104,220,0.45)]` : 'p-0'
                                    } ${highlightCarousel ? 'animate-pulse' : ''}`}
                                >
                                    <motion.button
                                        type="button"
                                        onClick={() => onSelectShop?.(shop.id)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.96 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                        className={`relative h-24 min-w-[220px] rounded-[10px] text-left p-3 shadow-md backdrop-blur-md bg-white/10 border border-white/25 overflow-hidden ${
                                            !showCircuitRing ? 'ring-1 ring-white/20' : ''
                                        } ${activeCategory ? 'shadow-[0_0_18px_rgba(176,106,179,0.35)]' : ''}`}
                                        style={{
                                            backgroundImage:
                                                "linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.45)), url('/images/Tailorcut.jpg')",
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                        }}
                                    >
                                        {activeCategory && (
                                            <div className="absolute top-2 left-2 z-20 glass-orchid bg-white/20 text-white px-2 py-0.5 rounded-md text-[10px] font-bold shadow-lg backdrop-blur-md border border-white/30">
                                                Top for {activeCategory}
                                            </div>
                                        )}
                                        <SourceRefIcon />
                                        <div className="absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orchid-blue/95 to-orchid-purple/90 text-sm font-black text-white shadow-lg">
                                            {getShopInitials(shop.shop_name)}
                                        </div>
                                        <div className="absolute bottom-3 left-3 right-3 z-10 truncate text-sm font-bold text-white drop-shadow-md">
                                            {shop.shop_name}
                                        </div>
                                    </motion.button>
                                </div>
                            );
                        })}
                    {/* </motion.div> */}
                </div>
                </div>
            </div>
        );
    }
