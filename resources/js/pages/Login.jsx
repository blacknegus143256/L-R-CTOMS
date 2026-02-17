import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            await login(email, password);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Login failed.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-sm rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold text-stone-800">Sign in</h1>
            <p className="mt-1 text-sm text-stone-500">Manage your tailoring shop</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {error && (
                    <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
                )}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-stone-700">Email</label>
                    <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-stone-700">Password</label>
                    <input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-lg bg-stone-800 py-2.5 font-medium text-white hover:bg-stone-700 disabled:opacity-50"
                >
                    {submitting ? 'Signing in…' : 'Sign in'}
                </button>
            </form>
            <p className="mt-4 text-center text-sm text-stone-500">
                No account? <Link to="/register" className="font-medium text-amber-600 hover:underline">Register</Link>
            </p>
        </div>
    );
}
