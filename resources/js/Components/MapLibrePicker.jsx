import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { showAlert } from '@/utils/alert';
import { FiNavigation } from 'react-icons/fi';

export default function MapLibrePicker({ data, setData, initialLat, initialLng, selectedBarangay, searchQuery }) {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);

    const [search, setSearch] = useState("");
    const [landmark, setLandmark] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const fallbackCenter = { lat: 9.3068, lng: 123.3045 };

    // Dumaguete coordinates for viewbox constraint
    const DUMAGUETE_BOUNDS = {
        minLon: 123.25,
        minLat: 9.25,
        maxLon: 123.35,
        maxLat: 9.35
    };

    const recenterTo = (lat, lng, zoom = 17) => {
        const map = mapRef.current;
        const marker = markerRef.current;

        if (!map || !marker) {
            return;
        }

        const lngLat = [Number(lng), Number(lat)];
        marker.setLngLat(lngLat);
        map.easeTo({ center: lngLat, zoom, duration: 400 });
    };

    const applySearchSelection = (lat, lng) => {
        recenterTo(lat, lng, 18);
        setData("latitude", Number(lat));
        setData("longitude", Number(lng));
        reverseGeocode(Number(lat), Number(lng));
    };

    const resetToInitialCoordinates = () => {
        const fallbackLat = Number(initialLat || fallbackCenter.lat);
        const fallbackLng = Number(initialLng || fallbackCenter.lng);

        recenterTo(fallbackLat, fallbackLng, 16.5);
        setData("latitude", fallbackLat);
        setData("longitude", fallbackLng);
        reverseGeocode(fallbackLat, fallbackLng);
    };

    // Enhanced Reverse Geocoding with Purok and Landmark detection + Fallback Street Mapping
    const reverseGeocode = async (lat, lng) => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&namedetails=1`
            );

            const result = await response.json();

            if (result.address) {
                const addr = result.address;
                const apiBarangay = addr.village || addr.suburb || "";
                const purok = addr.neighbourhood || addr.residential || addr.quarter || addr.subdivision || "";
                const cleanStreet = [...new Set([addr.road, addr.suburb, addr.neighbourhood].filter(Boolean))].join(', ');

                let detectedLandmark = "";
                if (result.display_name) {
                    const parts = result.display_name.split(',');
                    for (let i = 0; i < Math.min(3, parts.length); i++) {
                        const part = parts[i].trim();
                        if (!/^\d+[A-Za-z]?$/.test(part) && part.length > 2) {
                            detectedLandmark = part; break;
                        }
                    }
                }
                setLandmark(detectedLandmark);
                const descriptiveStreet = [...new Set([cleanStreet, purok, detectedLandmark].filter(Boolean))].join(', ');

                // STRICT RULE: Only update street, lat, and lng. NEVER touch barangay.
                setData("street", descriptiveStreet || "Location Set");
                setData("apiBarangay", apiBarangay);
                setData("latitude", Number(lat));
                setData("longitude", Number(lng));
            } else {
                setLandmark("Manual Location Set");
                setData("apiBarangay", "");
                setData("street", "Location Set");
                setData("latitude", Number(lat));
                setData("longitude", Number(lng));
            }
        } catch (error) {
            console.error("Reverse geocoding error:", error);
            setLandmark("Location detected");
            setData("apiBarangay", "");
            setData("street", "Location detected");
            setData("latitude", Number(lat));
            setData("longitude", Number(lng));
        } finally {
            setIsLoading(false);
        }
    };

    // Search location with Dumaguete constraints
    const performSearch = async (overrideQuery = null) => {
        // 1. Get the exact term, bypassing async React state issues
        let searchTerm = '';
        if (typeof overrideQuery === 'string') {
            searchTerm = overrideQuery;
        } else {
            searchTerm = search;
        }

        if (!searchTerm || !searchTerm.trim()) {
            resetToInitialCoordinates();
            return;
        }

        setIsLoading(true);
        try {
            // 2. Spoon-feed Nominatim by adding the city and province if missing
            const query = searchTerm.toLowerCase().includes('dumaguete')
                ? searchTerm
                : `${searchTerm}, Dumaguete City, Negros Oriental, Philippines`;

            const viewbox = `${DUMAGUETE_BOUNDS.minLon},${DUMAGUETE_BOUNDS.minLat},${DUMAGUETE_BOUNDS.maxLon},${DUMAGUETE_BOUNDS.maxLat}`;
            
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${viewbox}&bounded=1&limit=5`
            );

            const results = await response.json();

            if (results.length > 0) {
                applySearchSelection(results[0].lat, results[0].lon);
            } else {
                // 3. Fallback: Prepend "Barangay" if the API still struggles
                const fallbackQuery = query.toLowerCase().includes('barangay')
                    ? query
                    : `Barangay ${query}`;
                const fallbackResponse = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&limit=5`
                );
                const fallbackResults = await fallbackResponse.json();
                
                if (fallbackResults.length > 0) {
                    applySearchSelection(fallbackResults[0].lat, fallbackResults[0].lon);
                } else {
                    resetToInitialCoordinates();
                    // Only show error alert if user manually clicked search, not on auto-load
                    if (!overrideQuery) {
                        showAlert({
                            title: 'Location Not Found',
                            message: `We couldn't find "${searchTerm}" in ${selectedBarangay || 'Dumaguete City'}. Please check your spelling or manually drag the pin to your exact location.`,
                            type: 'error',
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Search error:", error);
            resetToInitialCoordinates();
        } finally {
            setIsLoading(false);
        }
    };

    // Use current location
    const useMyLocation = () => {
        if (!navigator.geolocation) {
            showAlert({
                title: 'Location Error',
                message: 'Geolocation not supported.',
                type: 'error',
            });
            return;
        }

        setIsLoading(true);
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            const lngLat = [lng, lat];

            if (mapRef.current) {
                mapRef.current.setCenter(lngLat);
                mapRef.current.setZoom(18);
            }
            if (markerRef.current) markerRef.current.setLngLat(lngLat);

            setData("latitude", lat);
            setData("longitude", lng);

            reverseGeocode(lat, lng);
        }, (error) => {
            console.error("Geolocation error:", error);
            showAlert({
                title: 'Location Error',
                message: 'Unable to get your location. Please check your browser permissions.',
                type: 'error',
            });
            setIsLoading(false);
        });
    };

    useEffect(() => {
        const startLat = Number(initialLat || data?.latitude || fallbackCenter.lat);
        const startLng = Number(initialLng || data?.longitude || fallbackCenter.lng);

        const map = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://tiles.openfreemap.org/styles/bright',
            center: [startLng, startLat],
            zoom: (initialLat || data?.latitude) ? 17 : 15,
            maxZoom: 20,
        });

        const marker = new maplibregl.Marker({ draggable: true })
            .setLngLat([startLng, startLat])
            .addTo(map);

        mapRef.current = map;
        markerRef.current = marker;

        // Fix map visibility
        map.on('load', () => {
            map.resize();

            if (data?.latitude && data?.longitude) {
                // We already have coordinates, just reverse geocode to get the street
                reverseGeocode(data.latitude, data.longitude);
            } else if (initialLat && initialLng) {
                setData('latitude', Number(initialLat));
                setData('longitude', Number(initialLng));
                reverseGeocode(Number(initialLat), Number(initialLng));
            } else if (searchQuery) {
                // Use the highly specific query passed from the parent!
                // If it doesn't contain "Dumaguete", add it so Nominatim finds it.
                const finalQuery = searchQuery.toLowerCase().includes('dumaguete')
                    ? searchQuery
                    : `${searchQuery}, Dumaguete City, Negros Oriental, Philippines`;

                setSearch(searchQuery); // Show what we are searching for in the UI
                performSearch(finalQuery); // Execute it
            }
        });

        marker.on("dragend", () => {
            const lngLat = marker.getLngLat();
            setData("latitude", lngLat.lat);
            setData("longitude", lngLat.lng);
            reverseGeocode(lngLat.lat, lngLat.lng);
        });

        map.on("click", (e) => {
            marker.setLngLat(e.lngLat);
            setData("latitude", e.lngLat.lat);
            setData("longitude", e.lngLat.lng);
            reverseGeocode(e.lngLat.lat, e.lngLat.lng);
        });

        return () => map.remove();
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        const marker = markerRef.current;
        if (!map || !marker || !initialLat || !initialLng) {
            return;
        }

        const lat = Number(initialLat);
        const lng = Number(initialLng);
        if (Number.isNaN(lat) || Number.isNaN(lng)) {
            return;
        }

        marker.setLngLat([lng, lat]);
        map.easeTo({ center: [lng, lat], zoom: 16.5, duration: 400 });
    }, [initialLat, initialLng]);

    return (
        <div className="relative space-y-3">
            {/* 1. Top Controls */}
            <div className="flex gap-2 flex-wrap">
                <div className="flex-1 min-w-[100px]">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                        placeholder="Search street or purok..."
                        className="w-full p-1.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                </div>
                <button
                    type="button"
                        onClick={() => performSearch()}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                    {isLoading ? '...' : 'Search'}
                </button>
                <button
                    type="button"
                    onClick={useMyLocation}
                    disabled={isLoading}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                    <div className="flex items-center gap-1.5">
                        <FiNavigation className="w-4 h-4" /> Me
                    </div>
                </button>
            </div>

            {/* 2. Fixed-Size Map */}
            <div 
                ref={mapContainer} 
                style={{ height: '200px', minHeight: '200px' }}
                className="w-full rounded-lg border border-stone-200 shadow-inner" 
            />

            {/* 3. Scrollable Info Area */}
            <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                    <h4 className="text-sm font-semibold text-stone-700">📍 Detected Location</h4>
                    
                    {/* Google Maps Link */}
                    {data.latitude && data.longitude && (
                        <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                            🌐 Open in Google Maps
                        </a>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex items-center gap-2 text-stone-500">
                        <div className="w-4 h-2 border-2 border-stone-300 border-t-amber-600 rounded-full animate-spin"></div>
                        <span>Detecting location...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                        <div className="bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                            <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider block mb-0.5">Purok</span>
                            <p className="text-xs font-bold text-stone-800 truncate" title={data.purok || '—'}>{data.purok || '—'}</p>
                        </div>
                        <div className="bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                            <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider block mb-0.5">Landmark</span>
                            <p className="text-xs font-bold text-stone-800 truncate" title={landmark || '—'}>{landmark || '—'}</p>
                        </div>
                        <div className="bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                            <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider block mb-0.5">Street</span>
                            <p className="text-xs font-bold text-stone-800 truncate" title={data.street || '—'}>{data.street || '—'}</p>
                        </div>
                        <div className="bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm overflow-hidden md:col-span-2">
                            <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider block mb-0.5">Coordinates</span>
                            <p className="text-xs font-bold text-stone-800 truncate" title={data.latitude && data.longitude ? `${data.latitude}, ${data.longitude}` : '—'}>
                                {data.latitude && data.longitude ? `${data.latitude}, ${data.longitude}` : '—'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Instructions */}
            <p className="text-xs text-stone-500">
                💡 Tip: Drag marker or click map to set location. {!data.street && <span className="text-amber-600">If no street, we use purok + landmark.</span>}  
            </p>
        </div>
    );
}

