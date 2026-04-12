import { useState } from 'react';
import { router } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import AddNewAttributeModal from './AddNewAttributeModal';
import EditShopAttributeModal from './EditShopAttributeModal';
import AddCategoryModal from '@/Components/StoreAdmin/AddCategoryModal';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function InventoryAssetsManager({ categories, shopAttributes, attributeTypes }) {
    const [newAttributeModal, setNewAttributeModal] = useState(false);
    const [targetCategoryId, setTargetCategoryId] = useState(null);
    const [categoryModal, setCategoryModal] = useState(false);
    const [editingAttribute, setEditingAttribute] = useState(null);

    const {data: attrData, setData: setAttrData, post: postAttribute, processing: processingAttribute, reset: resetAttribute } = useForm({
        attribute_category_id: '',
        attribute_type_id: '',
        item_name: '',
        price: '',
        unit: 'per yard',
        notes: '',
        image: null,
        is_available: true,
    });

    const openNewAttributeModal = (catId) => {
        setTargetCategoryId(catId);
        setAttrData('attribute_category_id', catId);
        setNewAttributeModal(true);
    };
    const closeNewAttributeModal = () => {
        setTargetCategoryId(null);
        resetAttribute();
        setNewAttributeModal(false);
    };

    const submitNewAttribute = (e) => {
        e.preventDefault();
        postAttribute(route('store.master-attributes.add'), { 
            forceFormData: true,
            onSuccess: () => {
                closeNewAttributeModal();
            }
        });
    };

    const {data: categoryFormData, setData: setCategoryFormData, post: postCategory, processing: categoryProcessing, reset: resetCategoryForm } = useForm({
        name: '',
    });

    const submitCategory = (e) => {
        e.preventDefault();
        postCategory(route('store.categories.add'), { 
            onSuccess: () => {
                setCategoryModal(false);
                resetCategoryForm();
            }
        });
    };

    const {data: editAttrData, setData: setEditAttrData, processing: attrProcessing, reset: resetEditAttr} = useForm({
        attribute_type_id: '',
        item_name: '',
        price: '',
        unit: '',
        notes: '',
        image: null,
        is_available: true,
    });

    const openEditAttrModal = (attr) => {
        setEditingAttribute(attr);
        setEditAttrData({
            attribute_type_id: attr.pivot.id,
            item_name: attr.pivot.item_name || '',
            price: attr.pivot.price,
            unit: attr.pivot.unit,
            notes: attr.pivot.notes || '',
            is_available: attr.pivot.is_available,
        });
    };
    const closeEditAttrModal = () => {
        setEditingAttribute(null);
        resetEditAttr();
    };
const submitEditAttr = (e) => {
        e.preventDefault();
        
        // When sending FormData (files) via PUT in Laravel, we must use a POST request
        // and append _method: 'PUT' to bypass the 405 Method Not Allowed error.
router.post(route('store.attributes.update', editingAttribute.pivot.id), {
            ...editAttrData,
            _method: 'PUT' 
        }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () =>{ closeEditAttrModal();
                alert("Inventory item updated successfully!");
            }, 
            onError: (errors) => {
                // If Laravel rejects the image or data, this will catch it!
                console.error("Validation Errors:", errors);
                alert("Update failed! Please check your browser console. The image might be too large or the wrong format.");
            }
        });
    };

    const deleteAttribute = (id) => {
        if (confirm('Are you sure you want to remove this attribute from your inventory?')) {
            router.delete(route('store.attributes.delete', id));
        }
    };

    const activeCategories = categories.filter(cat => 
        shopAttributes.some(attr => attr.attribute_category_id === cat.id)
    );
    const inactiveCategories = categories.filter(cat => 
        !shopAttributes.some(attr => attr.attribute_category_id === cat.id)
    );

    const getCategoryAssets = (catId) => shopAttributes.filter(sa => sa.attribute_category_id === catId);

    return (
        <>
            <div className="bg-white/70 backdrop-blur-2xl rounded-[2rem] border border-emerald-100/50 p-10 shadow-2xl shadow-emerald-900/5">
                <div className="flex justify-between items-center mb-12">
                    <h2 className="text-4xl font-black bg-gradient-to-r from-emerald-900 to-emerald-600 bg-clip-text text-transparent tracking-tight">Inventory Assets</h2>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setCategoryModal(true)}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-black py-3 px-6 rounded-2xl shadow-xl hover:shadow-slate-500/50 hover:scale-[1.02] transition-all duration-300 text-sm"
                        >
                            <Plus size={18} />
                            New Category
                        </button>
                    </div>
                </div>

                {/* Active Assets View */}
                {activeCategories.length === 0 ? (
                    <div className="text-center py-24 border-4 border-dashed border-emerald-200/50 rounded-3xl bg-emerald-50/50 backdrop-blur-xl">
                        <div className="text-8xl mb-8 opacity-20">📦</div>
                        <h3 className="text-4xl font-black text-slate-800 mb-4">No Active Assets</h3>
                        <p className="text-2xl text-slate-500 mb-8 max-w-2xl mx-auto">Activate a category below to start managing your inventory</p>
                    </div>
                ) : (
                    activeCategories.map((cat) => {
                        const categoryAssets = getCategoryAssets(cat.id);
                        return (
                            <div key={cat.id} className="mb-16">
                                <div className="flex justify-between items-center bg-gradient-to-r from-slate-950/20 to-slate-900/20 backdrop-blur-xl px-8 py-6 rounded-3xl border border-slate-800/20 mb-6">
                                    <h3 className="text-2xl font-black text-slate-50 drop-shadow-lg">{cat.name}</h3>
                                    <button 
                                        onClick={() => openNewAttributeModal(cat.id)}
                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black py-3 px-6 rounded-2xl shadow-xl hover:shadow-emerald-500/50 hover:scale-[1.02] transition-all duration-300 text-sm"
                                    >
                                        <Plus size={18} />
                                        Add Asset
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-emerald-100 [&_tr]:hover:bg-emerald-50/50 [&_tr]:transition-all [&_tr]:duration-300 [&_tr]:group">
<thead className="bg-emerald-50/80 backdrop-blur-md border-b-2 border-emerald-200/50">
                                            <tr>
                                                <th className="px-6 py-6 text-left text-sm font-black text-emerald-950 uppercase tracking-widest w-32">Image</th>
                                                <th className="px-6 py-6 text-left text-sm font-black text-emerald-950 uppercase tracking-widest">Asset Name</th>
                                                <th className="px-6 py-6 text-left text-sm font-black text-emerald-950 uppercase tracking-widest">Price</th>
                                                <th className="px-6 py-6 text-left text-sm font-black text-emerald-950 uppercase tracking-widest">Unit</th>
                                                <th className="px-6 py-6 text-left text-sm font-black text-emerald-950 uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-6 text-right text-sm font-black text-emerald-950 uppercase tracking-widest">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white/80 backdrop-blur-sm divide-y divide-emerald-100">
{categoryAssets.map((shopAttr, index) => (
    <tr key={`shopAttr-${shopAttr.id}-${shopAttr.pivot?.id || 'nopivot'}-${index}`} className="group hover:bg-emerald-50/50 transition-all duration-300">
        {/* 1. Larger Image */}
        <td className="px-6 py-6">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-stone-100 border-2 border-stone-200 shadow-md group-hover:border-emerald-300 transition-all">
                {shopAttr.pivot?.image_url ? (
                    <img 
                        src={`/storage/${shopAttr.pivot.image_url}`} 
                        alt={shopAttr.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = '/images/placeholder.jpg'; }}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 font-bold text-xs bg-stone-50">
                        <span className="text-xl mb-1">📷</span>
                        No img
                    </div>
                )}
            </div>
        </td>
        
        {/* 2. Larger Asset Name Pill */}
        <td className="px-6 py-6">
            <span className="inline-flex items-center px-5 py-2.5 bg-slate-900 text-white text-sm font-black uppercase tracking-widest rounded-xl shadow-lg border border-slate-700">
                {shopAttr.pivot?.item_name || '-'}
            </span>
        </td>
        
        {/* 3. Price & Unit */}
        <td className="px-6 py-6 font-mono font-black text-3xl text-emerald-900">
            ₱{Number(shopAttr.pivot?.price || 0).toFixed(2)}
        </td>
        <td className="px-6 py-6 font-bold text-slate-600 text-base uppercase tracking-wider">
            {shopAttr.pivot?.unit}
        </td>
        
        {/* 4. Status Badge */}
        <td className="px-6 py-6">
            <span className={`inline-flex px-5 py-2 text-sm font-black uppercase tracking-wider rounded-xl shadow-sm border ${shopAttr.pivot?.is_available ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-stone-100 text-stone-600 border-stone-300'}`}>
                {shopAttr.pivot?.is_available ? 'In Stock' : 'Out of Stock'}
            </span>
        </td>
        
        {/* 5. Larger Action Buttons */}
        <td className="px-6 py-6 text-right space-x-3">
            <button 
                onClick={() => openEditAttrModal(shopAttr)}
                className="p-4 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm"
                title="Edit"
            >
                <Pencil size={22} />
            </button>
            <button 
                onClick={() => deleteAttribute(shopAttr.id)}
                className="p-4 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-2xl transition-all shadow-sm"
                title="Remove"
            >
                <Trash2 size={22} />
            </button>
        </td>
    </tr>
))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Available Categories Grid */}
                {inactiveCategories.length > 0 && (
                    <div className="mt-20 pt-12 border-t-4 border-emerald-200/30">
                        <h3 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight mb-10 text-center">
                            Available Categories
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {inactiveCategories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => openNewAttributeModal(cat.id)}
                                    className="group relative bg-white/80 backdrop-blur-xl hover:bg-white hover:shadow-2xl hover:shadow-emerald-500/25 hover:border-emerald-400/80 hover:scale-[1.05] transition-all duration-500 rounded-3xl border-2 border-emerald-200/50 p-10 text-center shadow-xl hover:shadow-emerald-300/20"
                                >
                                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400/20 to-emerald-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:animate-tilt"></div>
                                    <div className="relative flex flex-col items-center gap-4">
                                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-3xl flex items-center justify-center shadow-2xl group-hover:shadow-emerald-300/50 group-hover:scale-110 transition-all">
                                            <Plus className="w-10 h-10 text-emerald-700 font-bold" />
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 drop-shadow-lg leading-tight">{cat.name}</h4>
                                        <span className="text-sm text-emerald-600 font-bold uppercase tracking-wider px-4 py-2 bg-emerald-100/80 rounded-2xl border border-emerald-200/50 backdrop-blur-sm shadow-inner">Activate</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals - props passed correctly */}
            <AddNewAttributeModal 
                isOpen={newAttributeModal}
                onClose={closeNewAttributeModal}
                categories={categories}
                targetCategoryId={targetCategoryId}
                data={attrData}
                setData={setAttrData}
                onSubmit={submitNewAttribute}
                processing={processingAttribute}
                attributeTypes={attributeTypes}
            />
            <EditShopAttributeModal 
                show={!!editingAttribute}
                onClose={closeEditAttrModal}
                attribute={editingAttribute}
                editAttrData={editAttrData}
                setEditAttrData={setEditAttrData}
                submitEditAttr={submitEditAttr}
                attrProcessing={attrProcessing}
                attributeTypes={attributeTypes}
            />
            <AddCategoryModal 
                isOpen={categoryModal}
                onClose={() => setCategoryModal(false)}
                data={categoryFormData}
                setData={setCategoryFormData}
                onSubmit={submitCategory}
                processing={categoryProcessing}
                categories={categories}
            />
        </>
    );
}
