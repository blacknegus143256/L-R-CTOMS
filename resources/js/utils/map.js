export const buildMapUrl = (lat, lng) => {
    const cleanLat = parseFloat(lat);
    const cleanLng = parseFloat(lng);

    if (isNaN(cleanLat) || isNaN(cleanLng)) return null;

    return `https://www.google.com/maps/search/?api=1&query=${cleanLat},${cleanLng}`;
};

