/**
 * Pure Comparison Engine - No React dependencies
 * Transforms raw props into UI-ready flat rows + metadata
 * Data Contract: { rows: Row[], hasGhostColumn: bool, shopIds: string[], highlightStrategy: string }
 */

export function createComparisonData({
  compareShops = [],
  categories = [],
  uniqueServiceCategories = [],
  highlightStrategy = 'lowest-price'
}) {
  const shopIds = compareShops.map(shop => shop.id);
  const hasGhostColumn = compareShops.length === 1;

  const rows = [];

  // 1. Location Row (always first)
  rows.push(createLocationRow(compareShops));

  // 2. Services Section
  if (uniqueServiceCategories.length > 0) {
    rows.push({
      id: 'header-services',
      type: 'section-header',
      section: 'services',
      label: 'Services',
      cells: []
    });

    const serviceRows = createServiceRows(compareShops, uniqueServiceCategories);
    rows.push(...serviceRows);
  }

  // 3. Materials Section  
  if (categories.length > 0) {
    rows.push({
      id: 'header-materials',
      type: 'section-header', 
      section: 'materials',
      label: 'Materials & Specifications',
      cells: []
    });

    const materialRows = createMaterialRows(compareShops, categories);
    rows.push(...materialRows);
  }

  return {
    rows,
    hasGhostColumn,
    shopIds,
    highlightStrategy,
    numShops: compareShops.length
  };
}

function createLocationRow(compareShops) {
  return {
    id: 'row-location',
    type: 'location',
    section: 'location',
    label: 'Location',
    cells: compareShops.map(shop => {
      const profile = shop.user?.profile || {};
      const addressParts = [
        profile.purok ? `Purok ${profile.purok}` : null,
        profile.street,
        profile.barangay ? `Brgy. ${profile.barangay}` : null
      ].filter(Boolean).join(', ') || 'Address not set';

      const lat = profile.latitude;
      const lng = profile.longitude;
      const hasCoords = lat && lng;

      return {
        shopId: shop.id,
        isAvailable: !!profile.street || !!profile.barangay,
        displayValue: addressParts,
        isHighlight: false, // Location never highlighted
        meta: {
          type: 'location',
          raw: profile,
          coordinates: hasCoords ? { lat, lng } : null,
          hasCoords,
          shopName: shop.shop_name
        }
      };
    })
  };
}

function createServiceRows(compareShops, uniqueServiceCategories) {
  const rows = [];
  const fallbackCategory = 'Uncategorized';

  const getServiceCategoryName = (service) => {
    const catName = service?.service_category?.name;

    if (!catName) {
      console.warn('Service is missing a category and will be grouped under Uncategorized.', service);
      return fallbackCategory;
    }

    return catName;
  };

  const normalizedCategories = Array.from(
    new Set([
      ...uniqueServiceCategories,
      ...compareShops.flatMap((shop) => (shop.services || []).map(getServiceCategoryName)),
    ])
  );

  normalizedCategories.forEach(category => {
    const allCategoryServices = compareShops.flatMap(shop =>
      (shop.services || []).filter(s => getServiceCategoryName(s) === category)
    );

    const globalMin = allCategoryServices
      .map(service => Number(service.price ?? service.starting_price ?? 0))
      .filter(price => price > 0)
      .reduce((min, price) => (min === null || price < min ? price : min), null);

    const shopCells = compareShops.map(shop => {
      const shopServices = (shop.services || []).filter(s => getServiceCategoryName(s) === category);

      if (shopServices.length === 0) {
        return {
          shopId: shop.id,
          isAvailable: false,
          displayValue: null,
          isHighlight: false,
          meta: { type: 'service-na' }
        };
      }

      const shopPrices = shopServices
        .map(service => Number(service.price ?? service.starting_price ?? 0))
        .filter(price => price > 0);
      const shopMin = shopPrices.length > 0 ? Math.min(...shopPrices) : 0;

      return {
        shopId: shop.id,
        isAvailable: true,
        displayValue: shopMin > 0 
        ? `${shopServices[0].service_name} ₱${shopMin.toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`
        : `${shopServices.length} Options`,
        isHighlight: shopMin > 0 && shopMin === globalMin,
        meta: {
          type: 'service',
          raw: shopServices[0],
          allItems: shopServices
        }
      };
    });

    rows.push({
      id: `category-${category.toLowerCase().replace(/\s+/g, '-')}`,
      type: 'data',
      section: 'services',
      label: category,
      cells: shopCells
    });
  });

  return rows;
}

function createMaterialRows(compareShops, categories) {
  const rows = [];

  categories.forEach(cat => {
    const visibleAttrs = cat.attribute_types?.filter(attr => 
      compareShops.some(shop => 
        (shop.attributes || []).some(a => a.id === attr.id && a.pivot)
      )
    ) || [];

    if (visibleAttrs.length === 0) return;

    // Subsection header for category
    rows.push({
      id: `subsection-${cat.id || cat.name.toLowerCase().replace(/\s+/g, '-')}`,
      type: 'subsection-header',
      section: 'materials',
      label: cat.name,
      cells: []
    });

    // One row per unique attribute
    visibleAttrs.forEach(attr => {
      // Get all matching attr prices across shops
      const allAttrPrices = compareShops.flatMap(shop => 
        (shop.attributes || [])
          .filter(a => a.id === attr.id && a.pivot)
          .map(a => Number(a.pivot?.price ?? 0))
          .filter(p => p > 0)
      );

      const globalMin = allAttrPrices.length > 0 ? Math.min(...allAttrPrices) : null;

      const shopCells = compareShops.map(shop => {
        const matchedItems = (shop.attributes || []).filter(a => a.id === attr.id && a.pivot);
        
        if (matchedItems.length === 0) {
          return {
            shopId: shop.id,
            isAvailable: false,
            displayValue: null,
            isHighlight: false,
            meta: { type: 'attribute-na' }
          };
        }

        // For simplicity, take first match (UI shows list, but atomic cell takes primary)
        const item = matchedItems[0];
        const itemPrice = Number(item.pivot?.price ?? 0);

        return {
          shopId: shop.id,
          isAvailable: itemPrice > 0,
          displayValue: `₱${itemPrice.toLocaleString()}`,
          isHighlight: itemPrice > 0 && itemPrice === globalMin,
          meta: {
            type: 'attribute',
            raw: item,
            price: itemPrice,
            itemName: item.pivot?.item_name || 'Generic',
            allItems: matchedItems // for UI lists
          }
        };
      });

      rows.push({
        id: `attr-${attr.id}-${cat.id}`,
        type: 'data',
        section: 'materials',
        label: attr.name,
        cells: shopCells
      });
    });
  });

  return rows;
}

// Export for testing
export { createLocationRow, createServiceRows, createMaterialRows };

