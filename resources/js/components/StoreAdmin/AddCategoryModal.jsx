import {
    Dialog,
    DialogPanel,
    Transition,
    TransitionChild,
} from '@headlessui/react';

export default function AddCategoryModal({ 
    isOpen, 
    onClose, 
    data, 
    setData, 
    onSubmit, 
    processing 
}) {
    return (
        <Transition show={isOpen} leave="duration-200">
            <Dialog
                as="div"
                id="modal"
                className="fixed inset-0 z-50 flex transform items-center overflow-y-auto px-4 py-6 transition-all sm:px-0"
                onClose={onClose}
            >
                <TransitionChild
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="absolute inset-0 bg-gray-500/75" />
                </TransitionChild>

                <TransitionChild
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                    enterTo="opacity-100 translate-y-0 sm:scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                    leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                    <DialogPanel
                        className="mb-6 transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:mx-auto sm:w-full sm:max-w-md"
                    >
                        <form onSubmit={onSubmit} className="p-6">
                            <h2 className="text-lg font-bold mb-4">Add New Category</h2>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Category Name</label>
                                <input 
                                    type="text" 
                                    className="w-full mt-1 border-gray-300 rounded-md"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder="e.g., Threads, Buttons, Fabrics"
                                    required
                                />
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button type="button" onClick={onClose} className="mr-3 text-gray-600">Cancel</button>
                                <button 
                                    type="submit" 
                                    disabled={processing}
                                    className="bg-green-600 text-white px-4 py-2 rounded shadow disabled:opacity-50"
                                >
                                    Add Category
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </TransitionChild>
            </Dialog>
        </Transition>
    );
}
