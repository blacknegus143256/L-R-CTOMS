import { Head, Link } from '@inertiajs/react';
import { AlertOctagon } from 'lucide-react';

export default function Suspended() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
            <Head title="Account Suspended" />
            
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-stone-200 p-8 text-center">
                <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertOctagon className="w-10 h-10 text-rose-600" />
                </div>
                
                <h1 className="text-3xl font-black text-stone-900 mb-3">Account Suspended</h1>
                
                <p className="text-stone-600 mb-8 leading-relaxed">
                    Your account has been temporarily suspended for violating our terms of service or community guidelines. You currently cannot log in or place orders.
                </p>
                
                <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200 mb-8">
                    <h3 className="font-bold text-stone-800 mb-2">How to Appeal</h3>
                    <p className="text-sm text-stone-600 mb-4">
                        If you believe this is an error, please contact our support team to appeal your suspension.
                    </p>
                    <a 
                        href="mailto:support@stitchcentral.com?subject=Account Suspension Appeal" 
                        className="inline-block bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors"
                    >
                        Email Support
                    </a>
                </div>
                
                <Link 
                    href="/" 
                    className="text-sm font-bold text-stone-500 hover:text-stone-800 transition-colors"
                >
                    ← Return to Homepage
                </Link>
            </div>
        </div>
    );
}
