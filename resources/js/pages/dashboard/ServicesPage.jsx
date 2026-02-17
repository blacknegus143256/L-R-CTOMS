import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function ServicesPage() {
    const { shopId } = useParams();
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modal, setModal] = useState(null); // null | 'add' | { id, service_name, price, duration_days }
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ service_name: '', price: '', duration_days: '' });

    const fetchList = useCallback(() => {
        if (!shopId) return;
        setLoading(true);
        axios.get(`/api/dashboard/shops/${shopId}/services`)
            .then((res) => setList(res.data.data || []))
            .catch((e) => setError(e.response?.data?.message || 'Failed to load'))
            .finally(() => setLoading(false));
    }, [shopId]);

    useEffect(() => fetchList(), [fetchList]);

    const openAdd = () => {
        setForm({ service_name: '', price: '', duration_days: '' });
        setModal('add');
    };
    const openEdit = (s) => {
        setForm({
            service_name: s.service_name,
            price: String(s.price ?? ''),
            duration_days: s.duration_days || '',
        });
        setModal({ id: s.id });
    };
    const closeModal = () => setModal(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                service_name: form.service_name,
                price: parseFloat(form.price) || 0,
                duration_days: form.duration_days || null,
            };
            if (modal === 'add') {
                await axios.post(`/api/dashboard/shops/${shopId}/services`, payload);
            } else {
                await axios.put(`/api/dashboard/shops/${shopId}/services/${modal.id}`, payload);
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
        if (!window.confirm('Delete this service?')) return;
        try {
            await axios.delete(`/api/dashboard/shops/${shopId}/services/${id}`);
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
                <h2 className="text-lg font-semibold text-stone-800">Services</h2>
                <button
                    type="button"
                    onClick={openAdd}
                    className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
                >
                    Add service
                </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-stone-200 bg-stone-50">
                            <th className="px-4 py-3 text-left font-medium text-stone-700">Name</th>
                            <th className="px-4 py-3 text-left font-medium text-stone-700">Price</th>
                            <th className="px-4 py-3 text-left font-medium text-stone-700">Duration</th>
                            <th className="w-24 px-4 py-3 text-right font-medium text-stone-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.length === 0 ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-stone-500">No services yet. Add one to get started.</td></tr>
                        ) : (
                            list.map((s) => (
                                <tr key={s.id} className="border-b border-stone-100">
                                    <td className="px-4 py-3">{s.service_name}</td>
                                    <td className="px-4 py-3">₱{Number(s.price).toFixed(2)}</td>
                                    <td className="px-4 py-3">{s.duration_days || '—'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button type="button" onClick={() => openEdit(s)} className="text-amber-600 hover:underline">Edit</button>
                                        {' · '}
                                        <button type="button" onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline">Delete</button>
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
                        <h3 className="text-lg font-semibold">{modal === 'add' ? 'Add service' : 'Edit service'}</h3>
                        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={form.service_name}
                                    onChange={(e) => setForm((f) => ({ ...f, service_name: e.target.value }))}
                                    className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Price (₱)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={form.price}
                                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                                    className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Duration (e.g. 3-5 days)</label>
                                <input
                                    type="text"
                                    value={form.duration_days}
                                    onChange={(e) => setForm((f) => ({ ...f, duration_days: e.target.value }))}
                                    className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={closeModal} className="rounded-lg border border-stone-300 px-4 py-2 text-sm">Cancel</button>
                                <button type="submit" disabled={saving} className="rounded-lg bg-stone-800 px-4 py-2 text-sm text-white hover:bg-stone-700 disabled:opacity-50">
                                    {saving ? 'Saving…' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
