const axios = require('axios');

const decodePolyline = (encoded) => {
  if (!encoded) return [];

  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates = [];

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return coordinates;
};

const getRouteData = async ({ origin, destination }) => {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    throw new Error('GOOGLE_MAPS_API_KEY is missing');
  }

  const res = await axios.get(
    'https://maps.googleapis.com/maps/api/directions/json',
    {
      params: {
        origin,
        destination,
        mode: 'driving',
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    }
  );

  if (res.data.status !== 'OK') {
    throw new Error(res.data.error_message || `Google route error: ${res.data.status}`);
  }

  const route = res.data.routes[0];
  const leg = route.legs[0];
  const polyline = route.overview_polyline?.points || '';

  return {
    route_polyline: polyline,
    route_coordinates: decodePolyline(polyline),
    start_location: {
      latitude: leg.start_location.lat,
      longitude: leg.start_location.lng,
      address: leg.start_address,
    },
    destination_location: {
      latitude: leg.end_location.lat,
      longitude: leg.end_location.lng,
      address: leg.end_address,
    },
  };
};

module.exports = {
  getRouteData,
  decodePolyline,
};