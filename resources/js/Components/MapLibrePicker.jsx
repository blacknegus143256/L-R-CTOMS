import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";

export default function MapLibrePicker({ data, setData }) {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);

    const [search, setSearch] = useState("");
    const [landmark, setLandmark] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Dumaguete coordinates for viewbox constraint
    const DUMAGUETE_BOUNDS = {
        minLon: 123.25,
        minLat: 9.25,
        maxLon: 123.35,
        maxLat: 9.35
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

                // Extract individual address components
                const purok = addr.neighbourhood || addr.residential || addr.quarter || addr.subdivision || "";
                const street = addr.road || "";
                const barangay = addr.village || addr.suburb || addr.hamlet || addr.town || addr.city || "";
                
                // Extract landmark from display_name
                let detectedLandmark = "";
                if (result.display_name) {
                    const parts = result.display_name.split(',');
                    for (let i = 0; i < Math.min(3, parts.length); i++) {
                        const part = parts[i].trim();
                        if (!/^\d+[A-Za-z]?$/.test(part) && part.length > 2) {
                            detectedLandmark = part;
                            break;
                        }
                    }
                }

                // Set display values
                setLandmark(detectedLandmark);
                setData("landmark", detectedLandmark || "Manual Location Set");
                setData("purok", purok);
                setData("barangay", barangay);

                // FALLBACK STREET MAPPING: If no road, combine purok + landmark
                if (!street) {
                    const descriptiveStreet = [purok, detectedLandmark]
                        .filter(Boolean)
                        .join(", ");
                    setData("street", descriptiveStreet || "Location Set");
                } else {
                    setData("street", street);
                }
            } else {
                // Fallback for empty response
                setData("barangay", "");
                setData("purok", "");
                setLandmark("Manual Location Set");
                setData("landmark", "Manual Location Set");
                setData("street", "Location Set");
            }
        } catch (error) {
            console.error("Reverse geocoding error:", error);
            setLandmark("Location detected");
            setData("landmark", "Location detected");
            setData("street", "Location detected");
        } finally {
            setIsLoading(false);
        }
    };

    // Search location with Dumaguete constraints
    const handleSearch = async () => {
        if (!search) return;

        setIsLoading(true);
        try {
            const query = `${search}, Dumaguete`;
            const viewbox = `${DUMAGUETE_BOUNDS.minLon},${DUMAGUETE_BOUNDS.minLat},${DUMAGUETE_BOUNDS.maxLon},${DUMAGUETE_BOUNDS.maxLat}`;
            
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${viewbox}&bounded=1&limit=5`
            );

            const results = await response.json();

            if (results.length > 0) {
                const { lat, lon } = results[0];
                const lngLat = [parseFloat(lon), parseFloat(lat)];

                if (mapRef.current) {
                    mapRef.current.setCenter(lngLat);
                    mapRef.current.setZoom(18);
                }
                if (markerRef.current) markerRef.current.setLngLat(lngLat);

                setData("latitude", parseFloat(lat));
                setData("longitude", parseFloat(lon));

                reverseGeocode(lat, lon);
            } else {
                // Fallback search
                const fallbackResponse = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}, Dumaguete City, Philippines&limit=5`
                );
                const fallbackResults = await fallbackResponse.json();
                
                if (fallbackResults.length > 0) {
                    const { lat, lon } = fallbackResults[0];
                    const lngLat = [parseFloat(lon), parseFloat(lat)];

                    if (mapRef.current) {
                        mapRef.current.setCenter(lngLat);
                        mapRef.current.setZoom(18);
                    }
                    if (markerRef.current) markerRef.current.setLngLat(lngLat);

                    setData("latitude", parseFloat(lat));
                    setData("longitude", parseFloat(lon));

                    reverseGeocode(lat, lon);
                } else {
                    alert("Location not found. Please try a different search term.");
                }
            }
        } catch (error) {
            console.error("Search error:", error);
            alert("Search failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Use current location
    const useMyLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation not supported");
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
            alert("Unable to get your location. Please check your browser permissions.");
            setIsLoading(false);
        });
    };

    useEffect(() => {
        const defaultLng = data.longitude || 123.3054;
        const defaultLat = data.latitude || 9.3077;

        const map = new maplibregl.Map({
            container: mapContainer.current,
            style: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
            center: [defaultLng, defaultLat],
            zoom: data.latitude ? 17 : 15,
            maxZoom: 20,
        });

        const marker = new maplibregl.Marker({ draggable: true })
            .setLngLat([defaultLng, defaultLat])
            .addTo(map);

        mapRef.current = map;
        markerRef.current = marker;

        // Fix map visibility
        map.on('load', () => {
            map.resize();
        });

        // Initial geocode
        if (data.latitude && data.longitude) {
            reverseGeocode(data.latitude, data.longitude);
        }

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

    return (
        <div className="relative space-y-3">
            {/* 1. Top Controls */}
            <div className="flex gap-2 flex-wrap">
                <div className="flex-1 min-w-[100px]">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search street or purok..."
                        className="w-full p-1.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                </div>
                <button
                    type="button"
                    onClick={handleSearch}
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
                    📍 Me
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
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                            <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider block mb-0.5">Purok</span>
                            <p className="text-xs font-bold text-stone-800 truncate" title={data.purok || '—'}>{data.purok || '—'}</p>
                        </div>
                        <div className="bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                            <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider block mb-0.5">Landmark</span>
                            <p className="text-xs font-bold text-stone-800 truncate" title={landmark || '—'}>{landmark || '—'}</p>
                        </div>
                        <div className="bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                            <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider block mb-0.5">Barangay</span>
                            <p className="text-xs font-bold text-stone-800 truncate" title={data.barangay || '—'}>{data.barangay || '—'}</p>
                        </div>
                        <div className="bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                            <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider block mb-0.5">Street</span>
                            <p className="text-xs font-bold text-stone-800 truncate" title={data.street || '—'}>{data.street || '—'}</p>
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

