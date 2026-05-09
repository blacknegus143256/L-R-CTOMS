import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { createComparisonData } from '@/utils/comparisonEngine';
import { usePage, router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import { 
  SectionHeader, 
  ContentRow,
  HeaderCell 
} from './RowComponents';
import { MapPin, X, Zap } from 'lucide-react';

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
                  // Grab all items if available, otherwise fallback to the single raw item
                  const itemsToRender = cell?.meta?.allItems || (cell?.meta?.raw ? [cell.meta.raw] : []);

                  return (
                    <div key={shop.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden h-fit">
                      {/* Shop Identifier */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orchid-blue to-orchid-purple opacity-50" />
                      <h4 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">
                        {shop.shop_name}
                      </h4>

                      {!isAvailable ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200">
                          <span className="text-lg font-bold text-stone-400">N/A</span>
                          <span className="text-xs text-stone-400 mt-1">Not offered by this shop</span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {isService && itemsToRender.map((item, idx) => (
                            <div key={idx} className="space-y-4 flex flex-col h-full">
                              {item.image ? (
                                <img
                                  src={item.image.startsWith('http') ? item.image : `/storage/${item.image}`}
                                  alt={item.service_name || 'Service'}
                                  className="w-full h-48 object-cover rounded-xl bg-stone-100"
                                />
                              ) : (
                                <div className="w-full h-48 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 text-sm font-medium">
                                  No Image
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-2xl font-black text-emerald-600">₱{Number(item.price || 0).toFixed(2)}</p>
                                  {(item.rush_service_available || item.is_rush || item.rush_service_available === 1) && (
                                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-500 bg-amber-50 px-2 py-1 rounded-full w-fit">
                                      <Zap size={12} fill="currentColor" /> Rush Available
                                    </div>
                                  )}
                                </div>
                                <p className="font-bold text-stone-800 mt-1">{item.service_name || item.item_name}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                                <div>
                                  <p className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Duration</p>
                                  <p className="text-sm font-semibold text-stone-700 mt-1">{item.duration_days || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Checkout</p>
                                  <p className="text-sm font-semibold text-stone-700 mt-1 capitalize">{item.checkout_type?.replace('_', ' ') || 'N/A'}</p>
                                </div>
                              </div>
                              {item.notes && (
                                <div className="pt-4 border-t border-stone-100">
                                  <p className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Notes</p>
                                  <p className="text-sm text-stone-600 mt-1">{item.notes}</p>
                                </div>
                              )}
                              <div className="pt-6 mt-auto">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (callbacks.onPlaceOrder) {
                                      // Pass shop and service ID (not entire item object)
                                      callbacks.onPlaceOrder(shop, item.id);
                                    }
                                  }}
                                  className="w-full py-3 px-4 bg-gradient-to-r from-orchid-blue to-orchid-purple text-white font-bold rounded-xl shadow-sm hover:opacity-90 hover:shadow-md transition-all active:scale-[0.98]"
                                >
                                  Order This
                                </button>
                              </div>
                            </div>
                          ))}
                          {!isService && (
                            <div className="space-y-4">
                              {itemsToRender.map((item, idx) => {
                                // Prefer pivot values (shop-specific) for attributes, fall back to raw
                                const pivot = item?.pivot || item?.meta?.pivot || null;
                                const rawFromCell = cell?.meta?.raw || {};

                                const rawImage = pivot?.image_url || item?.image || item?.image_url || rawFromCell.image_url || rawFromCell.pivot?.image_url || rawFromCell.attribute?.image_url;
                                const imageUrl = rawImage ? (String(rawImage).startsWith('http') ? rawImage : `/storage/${rawImage}`) : null;

                                const itemPrice = Number(pivot?.price ?? item?.price ?? cell?.meta?.price ?? rawFromCell.pivot?.price ?? 0);
                                const title = pivot?.item_name || item?.item_name || item?.name || cell?.meta?.itemName || rawFromCell.pivot?.item_name || rawFromCell.name || cell.displayValue;
                                const notes = pivot?.notes || item?.notes || rawFromCell.notes || rawFromCell.pivot?.notes;

                                return (
                                  <div key={`${shop.id}-mat-${idx}`} className="space-y-4 flex flex-col h-full relative">
                                    <div className="absolute top-6 right-6">
                                      <p className="text-2xl font-black text-emerald-600 bg-white/90 px-3 py-1 rounded-xl shadow">₱{Number(pivot?.price || item?.price || cell?.meta?.price || rawFromCell.pivot?.price || itemPrice || 0).toFixed(2)}</p>
                                    </div>

                                    {imageUrl ? (
                                      <img
                                        src={imageUrl}
                                        alt={title || 'Material'}
                                        className="w-full h-48 object-cover rounded-xl bg-stone-100"
                                      />
                                    ) : (
                                      <div className="w-full h-48 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 text-sm font-medium">
                                        No Image
                                      </div>
                                    )}

                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="text-base font-bold text-stone-800 truncate">{title}</p>
                                      </div>
                                      <p className="text-sm text-stone-600 mt-1">{cell.displayValue}</p>

                                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                                        <div>
                                          <p className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Unit</p>
                                          <p className="text-sm font-semibold text-stone-700 mt-1">{pivot?.unit_name || pivot?.unit || item?.unit || item?.unit_name || rawFromCell.pivot?.unit_name || rawFromCell.unit || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Availability</p>
                                          <p className="text-sm font-semibold text-stone-700 mt-1">{(pivot?.is_available ?? item?.is_available ?? rawFromCell.pivot?.is_available ?? rawFromCell.is_available) ? 'Available' : 'Unavailable'}</p>
                                          {((pivot?.stock_quantity ?? pivot?.stock_qty ?? item?.stock_quantity ?? rawFromCell.pivot?.stock_quantity ?? rawFromCell.stock_quantity) !== undefined) && (
                                            <p className="text-xs text-stone-500 mt-1">Stock: {pivot?.stock_quantity ?? pivot?.stock_qty ?? item?.stock_quantity ?? rawFromCell.pivot?.stock_quantity ?? rawFromCell.stock_quantity}</p>
                                          )}
                                        </div>
                                      </div>
                                      {notes && (
                                        <div className="pt-4 border-t border-stone-100">
                                          <p className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Notes</p>
                                          <p className="text-sm text-stone-600 mt-1">{notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
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
