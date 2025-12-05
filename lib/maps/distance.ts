// OpenRouteService distance calculation utility
// Free tier: 2,000 requests/day

const ORS_API_KEY = process.env.NEXT_PUBLIC_OPENROUTE_API_KEY;
const ORS_BASE_URL = 'https://api.openrouteservice.org/v2';

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface RouteResponse {
    distance: number; // in meters
    duration: number; // in seconds
    distanceKm: number; // in kilometers
}

/**
 * Calculate distance and duration between two points using OpenRouteService
 */
export async function calculateRoute(
    start: Coordinates,
    end: Coordinates
): Promise<RouteResponse> {
    if (!ORS_API_KEY) {
        console.warn('OpenRouteService API key not configured, using fallback');
        return calculateDistanceFallback(start, end);
    }

    try {
        const response = await fetch(
            `${ORS_BASE_URL}/directions/driving-car`,
            {
                method: 'POST',
                headers: {
                    'Authorization': ORS_API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    coordinates: [
                        [start.lng, start.lat],
                        [end.lng, end.lat],
                    ],
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`ORS API error: ${response.status}`);
        }

        const data = await response.json();
        const route = data.routes[0];
        const summary = route.summary;

        return {
            distance: summary.distance, // meters
            duration: summary.duration, // seconds
            distanceKm: parseFloat((summary.distance / 1000).toFixed(2)),
        };
    } catch (error) {
        console.error('Error calculating route:', error);
        return calculateDistanceFallback(start, end);
    }
}

/**
 * Geocode an address to coordinates using OpenRouteService
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
    if (!ORS_API_KEY) {
        console.warn('OpenRouteService API key not configured');
        return null;
    }

    try {
        const response = await fetch(
            `${ORS_BASE_URL}/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(address)}&boundary.country=PL`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Geocoding error: ${response.status}`);
        }

        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const coords = data.features[0].geometry.coordinates;
            return {
                lng: coords[0],
                lat: coords[1],
            };
        }

        return null;
    } catch (error) {
        console.error('Error geocoding address:', error);
        return null;
    }
}

/**
 * Fallback: Calculate straight-line distance using Haversine formula
 * Used when API is unavailable or limit exceeded
 */
function calculateDistanceFallback(
    start: Coordinates,
    end: Coordinates
): RouteResponse {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(end.lat - start.lat);
    const dLng = toRad(end.lng - start.lng);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(start.lat)) *
        Math.cos(toRad(end.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // km

    // Estimate road distance (add 20% for roads vs straight line)
    const distanceKm = parseFloat((distance * 1.2).toFixed(2));
    const distanceMeters = distanceKm * 1000;

    // Estimate duration (assuming 30 km/h average in city)
    const durationSeconds = (distanceKm / 30) * 3600;

    return {
        distance: distanceMeters,
        duration: durationSeconds,
        distanceKm,
    };
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
        return `${(distanceKm * 1000).toFixed(0)} m`;
    }
    return `${distanceKm.toFixed(2)} km`;
}

/**
 * Format duration for display
 */
export function formatDuration(durationSeconds: number): string {
    const minutes = Math.round(durationSeconds / 60);
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
}
