import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const STATUS_OPTIONS = ['Pending', 'Measuring', 'Sewing', 'Ready', 'Completed'];

export default function OrdersPage() {
    const { shopId } = useParams();
    const [list, setList] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modal, setModal] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ customer_id: '', service_id: '', status: 'Pending', total_price: '', expected_completion_date: '', notes: '' });

    const fetchList = useCallback(() => {
        if (!shopId) return;
        setLoading(true);
        Promise.all([
            axios.get(`/api/dashboard/shops/${shopId}/orders`),
            axios.get(`/api/dashboard/shops/${shopId}/customers`),
            axios.get(`/api/dashboard/shops/${shopId}/services`),
        ])
            .then(([o, c, s]) => {
                setList(o.data.data || []);
                setCustomers(c.data.data || []);
                setServices(s.data.data || []);
            })
            .catch((e) => setError(e.response?.data?.message || 'Failed to load'))
            .finally(() => setLoading(false));
    }, [shopId]);

    useEffect(() => fetchList(), [fetchList]);

    const openAdd = () => {
        setForm({
            customer_id: customers[0]?.id ?? '',
            service_id: services[0]?.id ?? '',
            status: 'Pending',
            total_price: '',
            expected_completion_date: '',
            notes: '',
        });
        setModal('add');
    };
    const openEdit = (o) => {
        setForm({
            customer_id: o.customer_id,
            service_id: o.service_id,
            status: o.status,
            total_price: String(o.total_price ?? ''),
            expected_completion_date: o.expected_completion_date ? o.expected_completion_date.slice(0, 10) : '',
            notes: o.notes || '',
        });
        setModal({ id: o.id });
    };
    const closeModal = () => setModal(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                customer_id: Number(form.customer_id),
                service_id: Number(form.service_id),
                status: form.status,
                total_price: parseFloat(form.total_price) || 0,
                expected_completion_date: form.expected_completion_date || null,
                notes: form.notes || null,
            };
            if (modal === 'add') {
                await axios.post(`/api/dashboard/shops/${shopId}/orders`, payload);
            } else {
                await axios.put(`/api/dashboard/shops/${shopId}/orders/${modal.id}`, payload);
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
        if (!window.confirm('Delete this order?')) return;
        try {
            await axios.delete(`/api/dashboard/shops/${shopId}/orders/${id}`);
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
                <h2 className="text-lg font-semibold text-stone-800">Orders</h2>
                <button type="button" onClick={openAdd} disabled={!customers.length || !services.length} className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50">
                    Add order
                </button>
            </div>
            {(!customers.length || !services.length) && (
                <p className="mb-3 text-sm text-amber-700">Add at least one customer and one service to create orders.</p>
            )}
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-stone-200 bg-stone-50">
                            <th className="px-4 py-3 text-left font-medium text-stone-700">Customer</th>
                            <th className="px-4 py-3 text-left font-medium text-stone-700">Service</th>
                            <th className="px-4 py-3 text-left font-medium text-stone-700">Status</th>
                            <th className="px-4 py-3 text-left font-medium text-stone-700">Total</th>
                            <th className="w-24 px-4 py-3 text-right font-medium text-stone-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-stone-500">No orders yet.</td></tr>
                        ) : (
                            list.map((o) => (
                                <tr key={o.id} className="border-b border-stone-100">
                                    <td className="px-4 py-3">{o.customer?.name ?? '—'}</td>
                                    <td className="px-4 py-3">{o.service?.service_name ?? '—'}</td>
                                    <td className="px-4 py-3"><span className="rounded bg-stone-100 px-2 py-0.5 text-stone-700">{o.status}</span></td>
                                    <td className="px-4 py-3">₱{Number(o.total_price).toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button type="button" onClick={() => openEdit(o)} className="text-amber-600 hover:underline">Edit</button>
                                        {' · '}
                                        <button type="button" onClick={() => handleDelete(o.id)} className="text-red-600 hover:underline">Delete</button>
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
                        <h3 className="text-lg font-semibold">{modal === 'add' ? 'Add order' : 'Edit order'}</h3>
                        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Customer</label>
                                <select required value={form.customer_id} onChange={(e) => setForm((f) => ({ ...f, customer_id: e.target.value }))} className="mt-1 w-full rounded border border-stone-300 px-3 py-2">
                                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Service</label>
                                <select required value={form.service_id} onChange={(e) => setForm((f) => ({ ...f, service_id: e.target.value }))} className="mt-1 w-full rounded border border-stone-300 px-3 py-2">
                                    {services.map((s) => <option key={s.id} value={s.id}>{s.service_name} (₱{Number(s.price).toFixed(2)})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Status</label>
                                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="mt-1 w-full rounded border border-stone-300 px-3 py-2">
                                    {STATUS_OPTIONS.map((st) => <option key={st} value={st}>{st}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Total (₱)</label>
                                <input type="number" step="0.01" min="0" required value={form.total_price} onChange={(e) => setForm((f) => ({ ...f, total_price: e.target.value }))} className="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Expected completion</label>
                                <input type="date" value={form.expected_completion_date} onChange={(e) => setForm((f) => ({ ...f, expected_completion_date: e.target.value }))} className="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700">Notes</label>
                                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
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
