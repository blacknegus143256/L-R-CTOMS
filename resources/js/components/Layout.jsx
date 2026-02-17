import { Link } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
    const { token } = useAuth();

    return (
        <div className="min-h-screen bg-stone-50 text-stone-900">
            <header className="border-b border-stone-200 bg-white shadow-sm">
                <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
                    <Link to="/" className="text-xl font-semibold tracking-tight text-stone-800">
                        CTOMS
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-stone-500">Centralized Tailoring Order & Management</span>
                        {token && (
                            <Link to="/dashboard" className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50">
                                Dashboard
                            </Link>
                        )}
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-5xl px-4 py-8">
                <Outlet />
            </main>
        </div>
    );
}
