// API route for geocoding addresses server-side
// This protects the API key from being exposed to clients

import { NextRequest, NextResponse } from 'next/server';

const ORS_API_KEY = process.env.NEXT_PUBLIC_OPENROUTE_API_KEY;
const ORS_BASE_URL = 'https://api.openrouteservice.org/v2';

export async function POST(request: NextRequest) {
    try {
        const { address } = await request.json();

        if (!address) {
            return NextResponse.json(
                { error: 'Address is required' },
                { status: 400 }
            );
        }

        if (!ORS_API_KEY) {
            return NextResponse.json(
                { error: 'OpenRouteService API key not configured' },
                { status: 500 }
            );
        }

        const response = await fetch(
            `${ORS_BASE_URL}/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(address)}&boundary.country=PL&size=1`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Geocoding failed: ${response.status}`);
        }

        const data = await response.json();

        if (!data.features || data.features.length === 0) {
            return NextResponse.json(
                { error: 'Address not found' },
                { status: 404 }
            );
        }

        const coords = data.features[0].geometry.coordinates;
        const properties = data.features[0].properties;

        return NextResponse.json({
            lat: coords[1],
            lng: coords[0],
            formatted: properties.label || address,
        });
    } catch (error: any) {
        console.error('Geocoding error:', error);
        return NextResponse.json(
            { error: error.message || 'Geocoding failed' },
            { status: 500 }
        );
    }
}
