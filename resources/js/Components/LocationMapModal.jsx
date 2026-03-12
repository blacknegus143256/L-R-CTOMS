import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef } from 'react';

export default function LocationMapModal({ location, onClose }) {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);

    useEffect(() => {
        if (!location) return;

        const map = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://api.maptiler.com/maps/streets/style.json?key=',
            center: [location.lng, location.lat],
            zoom: 17,
        });

        mapRef.current = map;

        map.on('load', () => {
            map.resize();
        });

        new maplibregl.Marker()
            .setLngLat([location.lng, location.lat])
            .addTo(map);

        return () => map.remove();
    }, [location]);

    if (!location) return null;

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50' onClick={onClose}>
            <div 
                className='bg-white rounded-lg w-[90%] max-w-2xl p-4 max-h-[90vh] overflow-hidden flex flex-col' 
                onClick={e => e.stopPropagation()}
            >
                <div className='flex justify-between items-start mb-2'>
                    <div>
                        <h2 className='text-lg font-semibold text-stone-800'>
                            {location.shopName}
                        </h2>
                        <div className='text-sm text-stone-600 mt-1'>
                            {location.street}, {location.barangay}
                        </div>
                    <button
                        onClick={onClose}
                        className='text-stone-400 hover:text-stone-600 p-1'
                    >
                        <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                        </svg>
                    </button>
                </div>

                {location.lat && location.lng && (
                    <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-sm text-blue-600 hover:underline flex items-center gap-1 mb-2'
                    >
                        Google Maps Link
                    </a>
                )}

                <div 
                    ref={mapContainer}
                    className='w-full h-64 rounded-lg border border-stone-200 flex-shrink-0'
                    style={{ minHeight: '250px' }}
                />
            </div>
            </div>
            </div>
    );
}
