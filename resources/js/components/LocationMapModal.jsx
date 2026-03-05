import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

export default function LocationMapModal({ location, onClose }) {
    const mapContainer = useRef(null);

    useEffect(() => {
        if (!location) return;

        const map = new maplibregl.Map({
            container: mapContainer.current,
            style: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
            center: [location.lng, location.lat],
            zoom: 17,
        });

        new maplibregl.Marker()
            .setLngLat([location.lng, location.lat])
            .addTo(map);

        return () => map.remove();
    }, [location]);

    if (!location) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg w-3/4 max-w-3xl p-4">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-semibold">
                        {location.shopName}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 font-bold"
                    >
                        ✕
                    </button>
                </div>

                <div className="mb-2 text-sm text-stone-600">
                    {location.street}, {location.barangay}
                </div>

                <div
                    ref={mapContainer}
                    className="w-full h-96 rounded-lg"
                />
            </div>
        </div>
    );
}