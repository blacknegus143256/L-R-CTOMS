import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";

export default function MapLibrePicker({ data, setData }) {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);

    const [search, setSearch] = useState("");

    // Reverse Geocoding (auto-detect barangay + street)
    const reverseGeocode = async (lat, lng) => {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );

        const result = await response.json();

        if (result.address) {
            setData("barangay", result.address.suburb || result.address.village || "");
            setData("street", result.address.road || "");
        }
    };

    // Search location
    const handleSearch = async () => {
        if (!search) return;

        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${search}, Dumaguete City, Philippines`
        );

        const results = await response.json();

        if (results.length > 0) {
            const { lat, lon } = results[0];
            const lngLat = [parseFloat(lon), parseFloat(lat)];

            mapRef.current.setCenter(lngLat);
            mapRef.current.setZoom(18);
            markerRef.current.setLngLat(lngLat);

            setData("latitude", parseFloat(lat));
            setData("longitude", parseFloat(lon));

            reverseGeocode(lat, lon);
        }
    };

    // Use current location
    const useMyLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation not supported");
            return;
        }

        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            const lngLat = [lng, lat];

            mapRef.current.setCenter(lngLat);
            mapRef.current.setZoom(18);
            markerRef.current.setLngLat(lngLat);

            setData("latitude", lat);
            setData("longitude", lng);

            reverseGeocode(lat, lng);
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
        <div className="relative">
            {/* Search Input */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search street..."
                    className="p-2 border rounded-md bg-white"
                />
                <button
                    type="button"
                    onClick={handleSearch}
                    className="px-3 bg-blue-600 text-white rounded-md"
                >
                    Search
                </button>
                <button
                    type="button"
                    onClick={useMyLocation}
                    className="px-3 bg-green-600 text-white rounded-md"
                >
                    Use My Location
                </button>
            </div>

            {/* Map */}
            <div ref={mapContainer} className="w-full h-96 rounded-lg" />
        </div>
    );
}