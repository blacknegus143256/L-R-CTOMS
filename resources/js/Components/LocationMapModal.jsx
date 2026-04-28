import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef } from 'react';

export default function LocationMapModal({ locations = [], onClose }) {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const locationData = locations[0] || {};

    useEffect(() => {
        if (!locations || locations.length === 0) return;

        const map = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://tiles.openfreemap.org/styles/bright',
            center: [locations[0].lng, locations[0].lat],
            zoom: 14,
        });

        mapRef.current = map;

        map.on('load', () => {
            map.resize();
            
            // Create bounds and add markers
            const bounds = new maplibregl.LngLatBounds();
            
            locations.forEach(location => {
                if (location.lat && location.lng) {
                    // Create marker with popup
                    const popup = new maplibregl.Popup({ offset: 25 })
                        .setHTML(`
                            <div class="p-2">
                                <div class="font-semibold text-sm">${location.shopName}</div>
                                <div class="text-xs text-gray-600">${location.street || ''}, ${location.barangay || ''}</div>
                            </div>
                        `);
                    
                    new maplibregl.Marker()
                        .setLngLat([location.lng, location.lat])
                        .setPopup(popup)
                        .addTo(map);
                    
                    // Extend bounds
                    bounds.extend([location.lng, location.lat]);
                }
            });
            
            // Fit bounds to show all markers
            if (locations.length > 0) {
                map.fitBounds(bounds, { padding: 50 });
            }
        });

        return () => map.remove();
    }, [locations]);

    if (!locations || locations.length === 0) return null;

    // Generate Google Maps link
    const getGoogleMapsLink = () => {
        if (locations.length === 2) {
            const loc1 = locations[0];
            const loc2 = locations[1];
            return `https://www.google.com/maps/dir/${loc1.lat},${loc1.lng}/${loc2.lat},${loc2.lng}`;
        } else if (locations.length === 1) {
            const loc = locations[0];
            return `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;
        }
        return null;
    };

    return (
        <div className="fixed inset-0 z-[100] isolate flex items-center justify-center bg-stone-900/80 backdrop-blur-sm p-4 sm:p-6" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div 
                className='bg-white rounded-lg w-[90%] max-w-2xl p-4 max-h-[90vh] overflow-hidden flex flex-col' 
                onClick={e => e.stopPropagation()}
            >
                <div className='flex justify-between items-start mb-2'>
                    <div className='flex-1'>
                        <h2 className='text-lg font-semibold text-stone-800'>
                            {locations.length === 1 ? locations[0].shopName : `Comparing ${locations.length} Locations`}
                        </h2>
                        <div className='text-sm text-stone-600 mt-2 space-y-1'>
                            {locations.map((loc, idx) => (
                                <div key={idx} className='flex items-start gap-2'>
                                    <span className='font-medium'>{idx + 1}.</span>
                                    <div>
                                        <div className='font-medium'>{loc.shopName}</div>
                                        <div className='text-xs text-stone-500'>{loc.street}, {loc.barangay}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className='text-stone-400 hover:text-stone-600 p-1 flex-shrink-0'
                    >
                        <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                        </svg>
                    </button>
                </div>

                {getGoogleMapsLink() && (
                    <a 
                        href={getGoogleMapsLink()}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-sm text-blue-600 hover:underline flex items-center gap-1 mb-2'
                    >
                        {locations.length === 2 ? 'Get Directions' : 'Google Maps Link'}
                    </a>
                )}

                <div 
                    ref={mapContainer}
                    className='w-full h-64 rounded-lg border border-stone-200 flex-shrink-0'
                    style={{ minHeight: '250px' }}
                />

                {locationData.google_maps_link && (
                    <a
                        href={locationData.google_maps_link}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='mt-4 block text-center text-base font-bold text-blue-600 hover:underline'
                    >
                        🗺️ Open in Google Street View
                    </a>
                )}
            </div>
        </div>
    );
}
