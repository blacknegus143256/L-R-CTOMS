import React, { useState, useEffect } from 'react';
import MeasurementRequest from './BuilderComponent/MeasurementRequest';
import QuoteBuilder from './BuilderComponent/QuoteBuilder';

const TailorQuoteBuilder = ({
    currentOrder,
    categories,
    measurementFields,
    setMeasurementFields,
    measurementUnit,
    setMeasurementUnit,
    laborPrice,
    setLaborPrice,
    rushFee,
    setRushFee,
    productionMinDays,
    setProductionMinDays,
    productionMaxDays,
    setProductionMaxDays,
    tailorMaterials,
    setTailorMaterials,
    availableShopAttributes,
    isCustomerProvided,
    itemsTotal,
    addMaterial,
    removeMaterial,
    handleSendQuote,
    isSubmittingQuote,
    handleSendMeasurements,
    isSubmittingMeasurements,
    measurementSuccess,
    onMaterialChange,
    isMeasurementLocked,
    isQuoteLocked,
}) => {
    const [materials, setMaterials] = useState(tailorMaterials || []);
    const isFixedPrice = currentOrder?.service?.checkout_type === 'fixed_price';
    const normalizedStatus = (currentOrder?.status || '').toString().trim().toLowerCase();
    const isLocked = ['quoted', 'confirmed', 'ready for production', 'in progress', 'appointment scheduled', 'in production', 'ready for pickup', 'completed', 'rejected', 'declined', 'cancelled'].includes(normalizedStatus);

    const isSubmitted = !!currentOrder?.measurement_snapshot?.is_submitted;
    const isRequested = !!currentOrder?.measurement_snapshot?.is_requested;
    const hasSubmittedMeasurements = !!currentOrder?.measurement_snapshot?.submitted
        && Object.keys(currentOrder.measurement_snapshot.submitted).length > 0;

    const resolvedMeasurementLocked = isMeasurementLocked ?? (isLocked || isRequested || hasSubmittedMeasurements || measurementSuccess);
    const resolvedQuoteLocked = isQuoteLocked ?? isLocked;
    const isLaborLocked = isFixedPrice || resolvedQuoteLocked;

    useEffect(() => {
        setMaterials(tailorMaterials || []);
    }, [tailorMaterials]);

    const updateMaterial = (index, updateData) => {
        const newMaterials = [...materials];
        newMaterials[index] = { ...newMaterials[index], ...updateData };
        setMaterials(newMaterials);
        setTailorMaterials(newMaterials);
        onMaterialChange?.(newMaterials);
    };

    const addMaterialLocal = () => {
        const newMat = { attribute_type_id: null, name: '', price: 0, unit: '', quantity: 1 };
        const newMaterials = [...materials, newMat];
        setMaterials(newMaterials);
        setTailorMaterials(newMaterials);
        onMaterialChange?.(newMaterials);
    };

    const removeMaterialLocal = (index) => {
        const newMaterials = materials.filter((_, i) => i !== index);
        setMaterials(newMaterials);
        setTailorMaterials(newMaterials);
        onMaterialChange?.(newMaterials);
    };

    const calculateSubtotal = () => {
        return materials.reduce((total, mat) => {
            const price = Number(mat.price || 0);
            const quantity = Number(mat.quantity || 1);
            return total + (price * quantity);
        }, 0);
    };

    const getInitialItemsTotal = () => {
        if (currentOrder?.items) {
            return currentOrder.items.reduce((total, item) => {
                const price = Number(item.price || item.pivot?.price || 0);
                const qty = Number(item.quantity || item.pivot?.quantity || 1);
                return total + (price * qty);
            }, 0);
        }
        return Number(itemsTotal || 0);
    };

    const grandTotal = Number(currentOrder?.total_amount || currentOrder?.total_price || 0);
    const currentRushFee = Number(currentOrder?.rush_fee || 0);
    const effectiveLaborPrice = resolvedQuoteLocked && grandTotal > 0
        ? Math.max(0, grandTotal - calculateSubtotal() - getInitialItemsTotal() - currentRushFee)
        : Number(laborPrice || 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <MeasurementRequest
                currentOrder={currentOrder}
                measurementFields={measurementFields}
                setMeasurementFields={setMeasurementFields}
                measurementUnit={measurementUnit}
                setMeasurementUnit={setMeasurementUnit}
                handleSendMeasurements={handleSendMeasurements}
                handleSendQuote={handleSendQuote}
                isSubmittingMeasurements={isSubmittingMeasurements}
                measurementSuccess={measurementSuccess}
                isMeasurementFormLocked={resolvedMeasurementLocked}
                isMeasurementLocked={resolvedMeasurementLocked}
                isLocked={resolvedQuoteLocked}
                isSubmitted={isSubmitted}
                isRequested={isRequested}
            />

            <QuoteBuilder
                currentOrder={currentOrder}
                categories={categories}
                isCustomerProvided={isCustomerProvided}
                availableShopAttributes={availableShopAttributes}
                itemsTotal={itemsTotal}
                materials={materials}
                updateMaterial={updateMaterial}
                removeMaterialLocal={removeMaterialLocal}
                addMaterialLocal={addMaterialLocal}
                isLocked={resolvedQuoteLocked}
                isLaborLocked={isLaborLocked}
                isFixedPrice={isFixedPrice}
                effectiveLaborPrice={effectiveLaborPrice}
                setLaborPrice={setLaborPrice}
                rushFee={rushFee}
                setRushFee={setRushFee}
                productionMinDays={productionMinDays}
                setProductionMinDays={setProductionMinDays}
                productionMaxDays={productionMaxDays}
                setProductionMaxDays={setProductionMaxDays}
                getInitialItemsTotal={getInitialItemsTotal}
                calculateSubtotal={calculateSubtotal}
                handleSendQuote={handleSendQuote}
                isSubmittingQuote={isSubmittingQuote}
                isQuoteLocked={resolvedQuoteLocked}
            />
        </div>
    );
};

export default TailorQuoteBuilder;
