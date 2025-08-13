// Haversine distance in meters between two {lat,lng}
function distanceMeters(a, b) {
	const toRad = (d) => (d * Math.PI) / 180;
	const R = 6371e3;
	const dLat = toRad(b.lat - a.lat);
	const dLon = toRad(b.lng - a.lng);
	const lat1 = toRad(a.lat);
	const lat2 = toRad(b.lat);
	const sinDLat = Math.sin(dLat / 2);
	const sinDLon = Math.sin(dLon / 2);
	const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
	const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
	return R * c;
}

function isOutOfRadius(origin, point, radiusMeters = 1000) {
	return distanceMeters(origin, point) > radiusMeters;
}

module.exports = { distanceMeters, isOutOfRadius };


