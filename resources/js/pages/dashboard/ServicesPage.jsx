import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const SERVICE_CATEGORIES = [
    'Custom Sewing',
    'Alterations',
    'Repairs',
    'Embroidery',
    'Formal Wear'
];

export default function ServicesPage() {
    const { shopId } = useParams();
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modal, setModal] = useState(null);
    const [saving, setSaving] = useState(false);
    
    const [form, setForm] = useState({
        service_category: '',
        service_description: '',
        starting_price: '',
        turnaround_time: '',
        is_available: true,
        rush_service_available: false,
        appointment_required: false,
        notes: '',
    });

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
        setForm({
            service_category: '',
            service_description: '',
            starting_price: '',
            turnaround_time: '',
            is_available: true,
            rush_service_available: false,
            appointment_required: false,
            notes: '',
        });
        setModal('add');
    };

    const openEdit = (s) => {
        setForm({
            service_category: s.service_category || '',
            service_description: s.service_description || '',
            starting_price: String(s.starting_price ?? ''),
            turnaround_time: s.turnaround_time || '',
            is_available: s.is_available ?? true,
            rush_service_available: s.rush_service_available ?? false,
            appointment_required: s.appointment_required ?? false,
            notes: s.notes || '',
        });
        setModal({ id: s.id });
    };

    const closeModal = () => setModal(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                service_category: form.service_category,
                service_description: form.service_description || null,
                starting_price: parseFloat(form.starting_price) || 0,
                turnaround_time: form.turnaround_time || null,
                is_available: form.is_available,
                rush_service_available: form.rush_service_available,
                appointment_required: form.appointment_required,
                notes: form.notes || null,
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
                    Add Service
                </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-stone-200 bg-stone-50">
                            <th className="px-4 py-3 text-left font-medium text-stone-700">Category</th>
                            <th className="px-4 py-3 text-left font-medium text-stone-700">Price</th>
                            <th className="px-4 py-3 text-left font-medium text-stone-700">Turnaround</th>
                            <th className="px-4 py-3 text-left font-medium text-stone-700">Status</th>
                            <th className="w-24 px-4 py-3 text-right font-medium text-stone-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                                    No services yet. Add one to get started.
                                </td>
                            </tr>
                        ) : (
                            list.map((s) => (
                                <tr key={s.id} className="border-b border-stone-100">
                                    <td className="px-4 py-3">{s.service_category}</td>
                                    <td className="px-4 py-3">₱{Number(s.starting_price).toFixed(2)}</td>
                                    <td className="px-4 py-3">{s.turnaround_time || '—'}</td>
                                    <td className="px-4 py-3">
                                        {s.is_available ? (
                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                                Available
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                                                Unavailable
                                            </span>
                                        )}
                                    </td>
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
                        <h3 className="text-lg font-semibold">{modal === 'add' ? 'Add Service' : 'Edit Service'}</h3>
                        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Category</label>
                                <select
                                    required
                                    value={form.service_category}
                                    onChange={(e) => setForm((f) => ({ ...f, service_category: e.target.value }))}
                                    className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                                >
                                    <option value="">Select Category</option>
                                    {SERVICE_CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Starting Price (₱)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={form.starting_price}
                                    onChange={(e) => setForm((f) => ({ ...f, starting_price: e.target.value }))}
                                    className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Description (Optional)</label>
                                <textarea
                                    value={form.service_description}
                                    onChange={(e) => setForm((f) => ({ ...f, service_description: e.target.value }))}
                                    className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Turnaround Time</label>
                                <input
                                    type="text"
                                    value={form.turnaround_time}
                                    onChange={(e) => setForm((f) => ({ ...f, turnaround_time: e.target.value }))}
                                    className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                                    placeholder="e.g., 3-5 days"
                                />
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.is_available}
                                        onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))}
                                        className="rounded border-stone-300"
                                    />
                                    <span className="text-sm">Available</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.rush_service_available}
                                        onChange={(e) => setForm((f) => ({ ...f, rush_service_available: e.target.checked }))}
                                        className="rounded border-stone-300"
                                    />
                                    <span className="text-sm">Rush Service</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.appointment_required}
                                        onChange={(e) => setForm((f) => ({ ...f, appointment_required: e.target.checked }))}
                                        className="rounded border-stone-300"
                                    />
                                    <span className="text-sm">Appointment Required</span>
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Notes (Optional)</label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                    className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                                    rows={2}
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
