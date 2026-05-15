import React, { useState } from 'react';
import { ChevronDown, Navigation2, Loader2, Scale, X, Zap } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import { router, usePage } from '@inertiajs/react';

/**
 * Dumb Row Primitives - Zero Logic, Pure Props-to-UI
 * Consume exact data contract from engine
 */

// Price Badge (core primitive) - can be sized for different contexts
export function PriceBadge({ isHighlight, value, label, className = '', compact = false }) {
  const sizeClass = compact ? 'text-sm px-2 py-1' : 'text-sm px-2 py-1';
  if (isHighlight) {
    return (
      <div className={`bg-emerald-50 text-emerald-700 rounded-full font-bold w-fit inline-flex items-center gap-1 border border-emerald-200 ${sizeClass} ${className}`}>
        {label} {value}
      </div>
    );
  }
  return (
    <div className={`bg-stone-100 text-stone-600 rounded-full font-medium w-fit inline-flex items-center gap-1 border border-stone-200 ${sizeClass} ${className}`}>
      {label} {value}
    </div>
  );
}

// NA Badge
export function NABadge() {
  return (
    <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-400 border border-slate-200 rounded-md text-xs uppercase font-bold">
      N/A
    </span>
  );
}

// Data Cell (services/attributes)
export function DataCell({ cell }) {
  const { displayValue, isHighlight, meta } = cell;
  const [imageFailed, setImageFailed] = useState(false);

  if (!cell.isAvailable) {
    return <NABadge />;
  }
  const label = meta?.serviceName || meta?.itemName || meta?.label || '';

  // Normalize image path for both services and materials
  const rawImage = meta?.raw?.image || meta?.raw?.image_url || meta?.raw?.pivot?.image_url;
  let imageSrc = '';
  if (rawImage) {
    if (rawImage.startsWith('http')) {
      imageSrc = rawImage;
    } else if (rawImage.startsWith('/storage/')) {
      imageSrc = rawImage;
    } else {
      imageSrc = `/storage/${rawImage.replace(/^\/+/, '')}`;
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* Image thumbnail (h-16 w-16) for better readability */}
      <div className="w-16 h-16 rounded-md overflow-hidden bg-stone-100 border border-stone-200 flex-shrink-0">
        {imageSrc && !imageFailed ? (
          <img
            src={imageSrc}
            alt={label}
            className="w-full h-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-400 text-xs font-medium">
            No Image
          </div>
        )}
      </div>

      {/* Price badge with compact sizing */}
      <div>
        <PriceBadge 
          isHighlight={isHighlight} 
          value={displayValue} 
          label={label}
          compact={true}
        />
        {/* Rush availability badge for services */}
        {meta?.type === 'service' && (meta?.raw?.rush_service_available || meta?.raw?.is_rush) && (
          <div className="flex items-center gap-1 text-xs font-semibold text-amber-500 mt-1">
            <Zap size={14} />
            <span>Available</span>
          </div>
        )}
        {meta.allItems && meta.allItems.length > 1 && (
          <div className="text-[9px] text-stone-500 mt-0.5">
            +{meta.allItems.length - 1} more
          </div>
        )}
      </div>
    </div>
  );
}

// Location Cell
export function LocationCell({ cell, handleGetDirections, isLocating }) {
  const { displayValue, meta } = cell;
  const { hasCoords, coordinates } = meta || {};
  const shopCoordinates = coordinates || null;
  const canRoute = hasCoords && shopCoordinates?.lat !== undefined && shopCoordinates?.lng !== undefined;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium">{displayValue}</span>
      {canRoute && (
        <button
          type="button"
          onClick={() => handleGetDirections?.(shopCoordinates)}
          disabled={isLocating}
          className="inline-flex w-fit items-center gap-1.5 rounded-full bg-stone-100/90 px-2 py-1 text-xs text-stone-600 transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLocating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Finding you...
            </>
          ) : (
            <>
              <Navigation2 className="h-3.5 w-3.5" />
              Get Directions
            </>
          )}
        </button>
      )}
    </div>
  );
}

// Ghost Cell
export function GhostCell({ onGhostClick, heightClass = 'min-h-[84px]' }) {
  return (
    <div
      className={`h-full ${heightClass} border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center text-stone-400 animate-pulse cursor-pointer hover:border-orchid-blue/60 hover:bg-orchid-blue/5 transition-all`}
      onClick={onGhostClick}
      onKeyDown={(e) => e.key === 'Enter' && onGhostClick?.()}
      role="button"
      tabIndex={0}
    >
      <div className="text-2xl font-bold">+</div>
    </div>
  );
}

// Section Header for accordions
export function SectionHeader({ label, isExpanded, onToggle, className = '' }) {
  return (
    <div 
      className={`flex justify-between items-center p-4 bg-stone-50 rounded-xl cursor-pointer hover:bg-stone-100 transition-colors font-bold text-stone-800 ${className}`}
      onClick={onToggle}
    >
      <span>{label}</span>
      <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
    </div>
  );
}

// Content Row (data rows only)
export function ContentRow({ row, data, callbacks }) {
  const { label, cells } = row;
  const { hasGhostColumn, shopIds } = data;
  const cellCallbacks = callbacks || {};

  // Build all location data for the modal (for location rows)
  const allLocationData = row.type === 'location' 
    ? cells
        .filter(cell => cell.isAvailable)
        .map(cell => ({
          lat: cell.meta?.coordinates?.lat,
          lng: cell.meta?.coordinates?.lng,
          shopName: cell.meta?.shopName,
          street: cell.meta?.raw?.street,
          barangay: cell.meta?.raw?.barangay,
          google_maps_link: cell.meta?.raw?.google_maps_link || cell.meta?.shop?.google_maps_link || cell.meta?.google_maps_link
        }))
        .filter(loc => loc.lat && loc.lng)
    : null;

  const renderCell = (cell, shopIndex) => {
    const shopId = shopIds[shopIndex];
    const matchingCell = cells.find(c => c.shopId === shopId);
    
    if (!matchingCell) return <GhostCell {...cellCallbacks} />;

    switch (matchingCell.meta?.type) {
      case 'location':
        return <LocationCell cell={matchingCell} {...cellCallbacks} />;
      case 'service':
      case 'rush-availability':
      case 'attribute':
        return <DataCell cell={matchingCell} />;
      default:
        return <NABadge />;
    }
  };

  const numShopCells = shopIds.length;

  return (
    <div
      className="group relative grid grid-cols-1 md:grid-cols-[minmax(200px,1fr)_repeat(auto-fit,minmax(250px,1fr))] gap-4 py-4 px-4 border border-stone-100 rounded-lg hover:bg-stone-50/50 hover:border-stone-200 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orchid-blue/40"
      onClick={(e) => {
        if (e.target.closest('button')) return;
        cellCallbacks?.onRowClick?.(row);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          if (e.target.closest('button')) return;
          e.preventDefault();
          cellCallbacks?.onRowClick?.(row);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Compare details for ${label}`}
    >
      <span className="pointer-events-none absolute right-4 top-4 rounded-full border border-orchid-blue/20 bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orchid-blue opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
        Compare Details
      </span>
      <div className="font-black text-lg text-stone-800 px-6 py-4 bg-gradient-to-r from-stone-50 to-transparent rounded-l-lg sticky left-0">
        {label}
      </div>
      {Array.from({length: numShopCells}, (_, i) => {
        const shopId = data.shopIds[i];
        const matchingCell = cells.find(c => c.shopId === shopId);
        const auth = usePage().props.auth;

        return (
          <div key={`cell-${i}`} className="px-6 py-4 border-l border-stone-200 first-of-type:border-l-0">
            {renderCell(null, i)}

            {/* If this cell represents a service, show an Order button */}
            {matchingCell && matchingCell.meta?.type === 'service' && (
              <div className="mt-3">
                <PrimaryButton
                  className="w-full py-2 text-sm"
                  onClick={() => {
                    const serviceId = matchingCell.meta?.raw?.id || matchingCell.meta?.raw?.service_id || null;
                    const intentUrl = serviceId
                      ? `/shop/${shopId}?order=true&service_id=${serviceId}`
                      : `/shop/${shopId}?order=true`;

                    if (!auth?.user) {
                      router.visit(`/login?redirect=${encodeURIComponent(intentUrl)}`);
                      return;
                    }

                    router.visit(intentUrl);
                  }}
                >
                  Order This
                </PrimaryButton>
              </div>
            )}
          </div>
        );
      })}
      {hasGhostColumn && (
        <div className="px-6 py-4">
          <GhostCell onGhostClick={cellCallbacks.onGhostClick} />
        </div>
      )}
    </div>
  );
}



// HeaderCell for shops (used in main table)
export function HeaderCell({ shop, shopIndex, callbacks }) {
  const { onViewProfile, onPlaceOrder, onSwapShop } = callbacks || {};
  
  const className = shopIndex === 0 ? 'text-orchid-blue' : 'text-orchid-purple';

  return (
    <div className={`px-6 py-4 text-left font-bold text-lg min-w-[280px] flex-none ${className}`}>
      <div className="text-xl font-bold mb-1 tracking-tight bg-gradient-to-r from-orchid-blue to-orchid-purple bg-clip-text text-transparent">
        {shop.shop_name}
      </div>
      <div className="text-sm font-normal text-stone-600 mb-2">{shop.user.profile?.phone || 'No phone'}</div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onViewProfile(shop.id)}
          className="px-3 py-1 bg-gradient-to-r from-orchid-blue to-orchid-purple text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95"
        >
          View Profile
        </button>
        <button
          type="button"
          onClick={() => onPlaceOrder(shop)}
          className="px-3 py-1 bg-gradient-to-r from-orchid-blue to-orchid-purple text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95"
        >
          Place Order
        </button>
        <button
          type="button"
          onClick={() => onSwapShop(shopIndex)}
          className="text-xs text-stone-500 hover:text-orchid-blue"
        >
          Swap
        </button>
      </div>
    </div>
  );
}

