import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function SourceRefIcon({ sourceText = 'Visualization only. Source: Google Images/Unsplash.' }) {
    const [open, setOpen] = useState(false);

    return (
        <div
            className="absolute right-2 top-2 z-30"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-black shadow">
                !
            </div>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute right-0 mt-1 max-w-[220px] rounded bg-black/90 px-2 py-1 text-[11px] text-white"
                    >
                        {sourceText}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

