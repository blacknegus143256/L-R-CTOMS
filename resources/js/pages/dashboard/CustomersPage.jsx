import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function CustomersPage() {
    const { shopId } = useParams();
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modal, setModal] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', phone_number: '', email: '', address: '' });

    const fetchList = useCallback(() => {
        if (!shopId) return;
        setLoading(true);
        axios.get(`/api/dashboard/shops/${shopId}/customers`)
            .then((res) => setList(res.data.data || []))
            .catch((e) => setError(e.response?.data?.message || 'Failed to load'))
            .finally(() => setLoading(false));
    }, [shopId]);

    useEffect(() => fetchList(), [fetchList]);

    const openAdd = () => {
        setForm({ name: '', phone_number: '', email: '', address: '' });
        setModal('add');
    };
    const openEdit = (c) => {
        setForm({
            name: c.name,
            phone_number: c.phone_number || '',
            email: c.email || '',
            address: c.address || '',
        });
        setModal({ id: c.id });
    };
    const closeModal = () => setModal(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form, email: form.email || null, phone_number: form.phone_number || null, address: form.address || null };
            if (modal === 'add') {
                await axios.post(`/api/dashboard/shops/${shopId}/customers`, payload);
            } else {
                await axios.put(`/api/dashboard/shops/${shopId}/customers/${modal.id}`, payload);
            }
            closeModal();
            fetchList();
        } catch (e) {
            setError(e.response?.data?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this customer?')) return;
        try {
            await axios.delete(`/api/dashboard/shops/${shopId}/customers/${id}`);
            fetchList();
        } catch (e) {
            setError(e.response?.data?.message || 'Delete failed');
        }
    };

    if (loading) return <div className="text-stone-500">Loading…</div>;
    if (error) return <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>;

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-800">Customers</h2>
                <button type="button" onClick={openAdd} className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700">
                    Add customer
                </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-stone-200 bg-stone-50">
                            <th className="px-4 py-3 text-left font-medium text-stone-700">Name</th>
                            <th className="px-4 py-3 text-left font-medium text-stone-700">Phone</th>
                            <th className="px-4 py-3 text-left font-medium text-stone-700">Email</th>
                            <th className="w-24 px-4 py-3 text-right font-medium text-stone-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.length === 0 ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-stone-500">No customers yet.</td></tr>
                        ) : (
                            list.map((c) => (
                                <tr key={c.id} className="border-b border-stone-100">
                                    <td className="px-4 py-3">{c.name}</td>
                                    <td className="px-4 py-3">{c.phone_number || '—'}</td>
                                    <td className="px-4 py-3">{c.email || '—'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button type="button" onClick={() => openEdit(c)} className="text-amber-600 hover:underline">Edit</button>
                                        {' · '}
                                        <button type="button" onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeModal}>
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold">{modal === 'add' ? 'Add customer' : 'Edit customer'}</h3>
                        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Name</label>
                                <input type="text" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Phone</label>
                                <input type="text" value={form.phone_number} onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))} className="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Email</label>
                                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Address</label>
                                <textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} rows={2} className="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={closeModal} className="rounded-lg border border-stone-300 px-4 py-2 text-sm">Cancel</button>
                                <button type="submit" disabled={saving} className="rounded-lg bg-stone-800 px-4 py-2 text-sm text-white hover:bg-stone-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
