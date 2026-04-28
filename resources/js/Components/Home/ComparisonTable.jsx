import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { createComparisonData } from '@/utils/comparisonEngine';
import { usePage } from '@inertiajs/react';
import { 
  SectionHeader, 
  ContentRow,
  HeaderCell 
} from './RowComponents';
import { MapPin, X } from 'lucide-react';

/**
 * Dumb ComparisonTable - Pure UI layer over pre-computed engine data
 * Zero business logic, filtering, or calculations
 */

export default function ComparisonTable({
  compareLoading,
  compareShops = [],
  categories = [],
  uniqueServiceCategories = [],
  onViewProfile,
  onSwapShop,
  onOpenLocationMap,
  onPlaceOrder,
  onGhostClick
}) {
  const [selectedRow, setSelectedRow] = useState(null);
  const { auth } = usePage().props;
  const customerLat = auth?.user?.profile?.latitude;
  const customerLng = auth?.user?.profile?.longitude;

  // Single memoized engine call - UI boundary only
  const data = useMemo(() => 
    createComparisonData({ 
      compareShops, 
      categories, 
      uniqueServiceCategories 
    }), 
    [compareShops, categories, uniqueServiceCategories]
  );

  const handleRowClick = useCallback((row) => {
    setSelectedRow(row);
  }, []);

  const callbacks = useMemo(() => ({
    onViewProfile,
    onSwapShop,
    onOpenLocationMap,
    onPlaceOrder,
    onGhostClick,
    onRowClick: handleRowClick
  }), [onViewProfile, onSwapShop, onOpenLocationMap, onPlaceOrder, onGhostClick, handleRowClick]);

  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const toggleGroup = useCallback((groupId) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  const closeModal = useCallback(() => {
    setSelectedRow(null);
  }, []);

  const getShopDistanceKm = useCallback((coordinates) => {
    if (
      customerLat === undefined ||
      customerLat === null ||
      customerLng === undefined ||
      customerLng === null ||
      !coordinates?.lat ||
      !coordinates?.lng
    ) {
      return null;
    }

    const R = 6371;
    const dLat = (coordinates.lat - customerLat) * Math.PI / 180;
    const dLon = (coordinates.lng - customerLng) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(customerLat * Math.PI / 180) * Math.cos(coordinates.lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
  }, [customerLat, customerLng]);

const groupedRows = useMemo(() => {
  const tree = [];
  let currentSection = null;
  let currentCategory = null;
  let serviceCategoryMap = new Map(); // For Services L2 grouping

  data.rows.forEach(row => {
    if (row.type === 'section-header') {
      // L1 Section: Services/Materials/Location  
      currentSection = {
        id: row.id,
        label: row.label,
        type: 'group',
        level: 1,
        children: []
      };
      tree.push(currentSection);
      currentCategory = null;
      serviceCategoryMap.clear();
    } else if (row.type === 'subsection-header') {
      // L2 Materials Category (existing)
      currentCategory = {
        id: row.id,
        label: row.label, 
        type: 'group',
        level: 2,
        children: []
      };
      if (currentSection) currentSection.children.push(currentCategory);
    } else if (row.type === 'data' && row.section === 'services') {
      // Services: Derive L2 by category name from each cell's meta
      // Get all unique categories from all shop cells
      const categories = new Set();
      row.cells?.forEach(cell => {
        if (cell?.meta?.raw?.service_category?.name) {
          categories.add(cell.meta.raw.service_category.name);
        }
      });
      // If all shops have the same category, use it; otherwise use the first available or Uncategorized
      const serviceCat = categories.size === 1 
        ? Array.from(categories)[0]
        : (row.cells?.[0]?.meta?.raw?.service_category?.name || 'Uncategorized');
      const catId = `services::${serviceCat}`;

      if (!serviceCategoryMap.has(catId)) {
        const serviceGroup = {
          id: catId,
          label: serviceCat,
          type: 'group',
          level: 2,
          children: []
        };
        serviceCategoryMap.set(catId, serviceGroup);
        if (currentSection) currentSection.children.push(serviceGroup);
      }
      serviceCategoryMap.get(catId).children.push(row);
    } else if ((row.type === 'data' || row.type === 'location') && row.section !== 'services') {
      // Materials data / Location → currentCategory or currentSection
      if (currentCategory) {
        currentCategory.children.push(row);
      } else if (currentSection) {
        currentSection.children.push(row);
      }
    }
  });

  // RESTORE LOCATION: Ensure Location is always the first L1 group
  const locationRow = data.rows.find(r => r.type === 'location');
  if (locationRow) {
    tree.unshift({
      id: 'group-location',
      label: 'Location',
      type: 'group',
      level: 1,
      children: [locationRow]
    });
  }

  return tree;
}, [data.rows]);

  useEffect(() => {
    // Auto-expand ONLY L1 sections  
    groupedRows.forEach(group => {
      if (group.level === 1 && !expandedGroups.has(group.id)) {
        toggleGroup(group.id);
      }
    });
  }, [groupedRows, toggleGroup, expandedGroups]);

  const renderGroup = useCallback((group, depth = 0) => {
    const isExpanded = expandedGroups.has(group.id);
    const paddingClass = depth === 0 ? 'pl-4' : depth === 1 ? 'pl-8 pb-2' : 'pl-12';
    const headerClass = group.level === 2 ? 'text-sm font-semibold px-2 -ml-2 rounded-lg bg-stone-100/50' : '';

    return (
      <div key={group.id} className={paddingClass}>
        <SectionHeader
          label={group.label}
          isExpanded={isExpanded}
          onToggle={() => toggleGroup(group.id)}
          className={headerClass}
        />
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100 mt-2' : 'max-h-0 opacity-50'
        }`}>
          <div className="space-y-3">
            {group.children.map(child =>
              child.type === 'group'
                ? renderGroup(child, depth + 1)
                : <ContentRow key={child.id} row={child} data={data} callbacks={callbacks} />
            )}
          </div>
        </div>
      </div>
    );
  }, [expandedGroups, toggleGroup, data, callbacks]);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {compareLoading ? (
        <div className="p-8 space-y-4 min-h-[400px]">
          <div className="flex gap-8">
            <div className="min-w-[180px] h-12 bg-gradient-to-r from-stone-200 to-stone-300 rounded-lg animate-pulse" />
            <div className="flex-1 space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex gap-8 h-20">
                  <div className="min-w-[180px] h-full bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 rounded-lg animate-pulse" />
                  <div className="flex-1 h-full bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 rounded-xl animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : compareShops.length > 0 ? (
        <div className="flex-1 overflow-hidden">
          <div className="flex flex-nowrap gap-4 min-w-max overflow-x-auto custom-scrollbar pb-4 sticky top-0 z-10 bg-white border-b border-stone-200 shadow-sm">
            <div className="min-w-[200px] flex-none px-6 py-4 font-bold text-lg text-left text-stone-900 bg-white/80 backdrop-blur-xl flex-shrink-0">
              Shops
            </div>
            {compareShops.map((shop, shopIndex) => (
              <HeaderCell
                key={shop.id}
                shop={shop}
                shopIndex={shopIndex}
                callbacks={callbacks}
              />
            ))}
            {data.hasGhostColumn && (
              <div className="min-w-[280px] flex-none px-6 py-4 font-bold text-lg text-left text-stone-400 bg-white/80 flex-shrink-0">
                Challenger Slot
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 px-4 pt-4">
            {groupedRows.map((group) => renderGroup(group))}
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-stone-500">
          Select one or two shops to start comparison.
        </div>
      )}

      {selectedRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 px-4 py-8 backdrop-blur-sm"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="w-full max-w-6xl max-h-[85vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-stone-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Comparison details for ${selectedRow.label}`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-6 py-5 sticky top-0 bg-white z-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Compare Details</p>
                <h3 className="text-2xl font-black text-stone-900 mt-1">{selectedRow.label}</h3>
                <p className="text-sm text-stone-500 mt-1">Side-by-side shop comparison based on the selected row.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition"
                aria-label="Close comparison details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(85vh-92px)] overflow-y-auto px-6 py-6 custom-scrollbar">
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${compareShops.length}, minmax(260px, 1fr))` }}>
                {compareShops.map((shop) => {
                  const cell = selectedRow.cells.find(c => c.shopId === shop.id);
                  const isAvailable = cell && cell.isAvailable;
                  const isService = selectedRow.section === 'services';
                  const isLocation = selectedRow.section === 'location';
                  
                  // NEW: Grab all items if available, otherwise fallback to the single raw item
                  const itemsToRender = cell?.meta?.allItems || (cell?.meta?.raw ? [cell.meta.raw] : []);

                  return (
                    <div key={shop.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden h-fit">
                      {/* Shop Identifier */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orchid-blue to-orchid-purple opacity-50" />
                      <h4 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">
                        {shop.shop_name}
                      </h4>

                      {!isAvailable || (itemsToRender.length === 0 && !isLocation) ? (
                        <div className="h-40 flex flex-col items-center justify-center text-stone-400 bg-stone-50 rounded-xl border border-stone-100 border-dashed">
                          <span className="text-lg font-bold">N/A</span>
                          <span className="text-xs">Not offered by this shop</span>
                        </div>
                      ) : isLocation ? (
                        <div className="space-y-4">
                          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 text-center flex flex-col items-center justify-center min-h-[200px]">
                            <MapPin className="w-12 h-12 text-orchid-blue mb-4" />
                            <h5 className="font-bold text-stone-800 text-lg mb-2">{cell?.displayValue || 'Location not set'}</h5>
                            <div className="text-sm text-stone-500 font-medium mb-4">
                              {shop.shop_name}
                            </div>

                            {getShopDistanceKm(cell?.meta?.coordinates) ? (
                              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-black border border-emerald-200 text-base">
                                🚗 {getShopDistanceKm(cell?.meta?.coordinates)} km away
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">Distance Unavailable</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {/* Loop through all variations of this item */}
                          {itemsToRender.map((itemData, itemIdx) => {
                            // Safely extract data for this specific variation
                            const rawImage = itemData?.image_url || itemData?.pivot?.image_url;
                            const imageUrl = rawImage ? (rawImage.startsWith('http') ? rawImage : `/storage/${rawImage}`) : null;
                            const itemPrice = itemData?.pivot?.price ?? itemData?.price ?? itemData?.starting_price ?? 0;
                            const itemName = itemData?.pivot?.item_name || itemData?.service_name || itemData?.name || selectedRow.label;
                            const isOutOfStock = itemData?.is_available === 0 || itemData?.is_available === false || itemData?.status === 'out_of_stock';

                            return (
                              <div key={itemIdx} className={itemIdx > 0 ? 'pt-6 border-t-2 border-stone-100' : ''}>
                                {/* Image Display */}
                                {imageUrl && (
                                  <div className="w-full h-48 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 mb-4">
                                    <img src={imageUrl} alt="Item" className="w-full h-full object-cover" />
                                  </div>
                                )}

                                {/* Primary Details */}
                                <div>
                                  <div className="text-2xl font-black text-emerald-600 mb-1">
                                    {itemPrice > 0 ? `₱${Number(itemPrice).toLocaleString(undefined, {minimumFractionDigits: 2})}` : 'Requires Quote'}
                                  </div>
                                  <div className="text-sm font-bold text-stone-800">
                                    {itemName}
                                  </div>

                                  {/* Service Badges */}
                                  {isService && (itemData?.is_rush || itemData?.requires_appointment || itemData?.is_appointment_required) && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                      {itemData?.is_rush && (
                                        <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-wider rounded-md border border-amber-200/60">
                                          Rush
                                        </span>
                                      )}
                                      {(itemData?.requires_appointment || itemData?.is_appointment_required) && (
                                        <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider rounded-md border border-indigo-200/60">
                                          Appt Required
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Specifics Grid */}
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-100 mt-4">
                                  {isService ? (
                                    <>
                                      <div>
                                        <span className="block text-[10px] font-bold text-stone-400 uppercase">Duration</span>
                                        <span className="text-sm font-semibold text-stone-700">{itemData?.duration || itemData?.duration_days || 'Standard'}</span>
                                      </div>
                                      <div>
                                        <span className="block text-[10px] font-bold text-stone-400 uppercase">Checkout</span>
                                        <span className="text-sm font-semibold text-stone-700">{itemData?.checkout_type === 'fixed_price' ? 'Fixed Price' : 'Requires Quote'}</span>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div>
                                        <span className="block text-[10px] font-bold text-stone-400 uppercase">Unit</span>
                                        <span className="text-sm font-semibold text-stone-700">{itemData?.pivot?.unit || itemData?.unit || 'Item'}</span>
                                      </div>
                                      <div>
                                        <span className="block text-[10px] font-bold text-stone-400 uppercase">Status</span>
                                        <span className={`text-sm font-bold ${isOutOfStock ? 'text-rose-500' : 'text-emerald-600'}`}>
                                          {isOutOfStock ? 'Out of Stock' : (itemData?.status || 'In Stock')}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>

                                {/* Notes Section */}
                                {(itemData?.notes || itemData?.pivot?.notes || itemData?.service_description) && (
                                  <div className="pt-4 border-t border-stone-100 mt-4">
                                    <span className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Notes / Description</span>
                                    <p className="text-sm text-stone-600 italic">
                                      {itemData?.notes || itemData?.pivot?.notes || itemData?.service_description}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
