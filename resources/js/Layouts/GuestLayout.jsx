import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import Footer from '@/Components/Home/Footer';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col md:flex-row bg-white">
            {/* LEFT SIDE: Visual Mesh Layer (60% on Desktop) */}
            <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative hidden md:flex md:w-[60%] items-center justify-center overflow-hidden"
            >
                {/* The Electric Mesh Background */}
                <div className="absolute inset-0 bg-breathe electric-mesh-layer" />
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
                
                {/* Branding Watermark */}
                <div className="relative z-10 text-center">
                    <Link href="/">
                        <ApplicationLogo className="h-32 w-32 fill-current text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]" />
                    </Link>
                    <h1 className="mt-6 text-5xl font-black text-white tracking-tighter uppercase drop-shadow-lg">
                        Precision <br/> <span className="text-orchid-purple">Awaits</span>
                    </h1>
                </div>
            </motion.div>

            {/* RIGHT SIDE: Functional Form Zone (40% on Desktop) */}
            <div className="flex flex-col w-full md:w-[40%] bg-white relative">
                <main className="flex flex-1 items-center justify-center p-6 md:p-12">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="w-full max-w-md"
                    >
                        {/* Mobile Logo Only */}
                        <div className="flex justify-center md:hidden mb-8">
                            <Link href="/">
                                <ApplicationLogo className="h-16 w-16 fill-current text-orchid-blue" />
                            </Link>
                        </div>

                        {/* The Glass Form Card */}
                        <div className="rounded-2xl border border-orchid-blue/10 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm">
                            {children}
                        </div>
                    </motion.div>
                </main>

                {/* Grounding the Auth flow with your consistent Footer */}
                <div className="mt-auto border-t border-stone-100 bg-stone-50/50">
                    <div className="flex flex-wrap items-center justify-center px-4 py-3">
                        <a href="/documents/terms-and-condition.pdf" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:underline mx-2">Terms of Service</a>
                        <a href="/documents/privacy-policy.pdf" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:underline mx-2">Privacy Policy</a>
                        <a href="/documents/mutual-nda.pdf" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:underline mx-2">Mutual NDA</a>
                    </div>
                    <Footer />
                </div>
            </div>
        </div>
    );
}
