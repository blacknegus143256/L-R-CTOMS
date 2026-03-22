import React from 'react';
import { motion } from 'framer-motion';

export default function Footer() {
    return (
        <footer className="relative mt-24 border-t border-orchid-blue/20 bg-slate-950/95 backdrop-blur-2xl py-16 px-8 overflow-hidden">
            {/* Stardust Animation */}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-orchid-purple/30 rounded-full"
                    animate={{
                        y: [0, -100],
                        opacity: [0, 1, 0],
                        x: [0, (i % 2 === 0 ? 50 : -50)]
                    }}
                    transition={{
                        duration: Math.random() * 5 + 5,
                        repeat: Infinity,
                        delay: Math.random() * 5
                    }}
                    style={{ left: `${Math.random() * 100}%`, bottom: '0' }}
                />
            ))}

            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 relative z-10">
                <div className="text-center md:text-left">
                    <h2 className="text-3xl font-black bg-gradient-to-r from-orchid-blue to-orchid-purple bg-clip-text text-transparent">CTOMS</h2>
                    <p className="text-slate-400 mt-2 max-w-sm">Precision tailoring management and comparison for the modern era.</p>
                </div>

                {/* Back to Top Orb */}
                <motion.button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    whileHover={{ y: -8, shadow: "0 0 25px #4568dc" }}
                    className="w-14 h-14 rounded-full bg-gradient-to-tr from-orchid-blue to-orchid-purple flex items-center justify-center text-white shadow-2xl border border-white/20"
                >
                    <span className="text-xl">↑</span>
                </motion.button>

                <div className="text-slate-500 text-sm font-medium">
                    © 2026 CTOMS Project. Crafted for Excellence.
                </div>
            </div>
        </footer>
    );
}
