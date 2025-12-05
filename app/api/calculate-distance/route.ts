// API route for calculating distance between two points

import { NextRequest, NextResponse } from 'next/server';
import { calculateRoute } from '@/lib/maps/distance';

export async function POST(request: NextRequest) {
    try {
        const { start, end } = await request.json();

        if (!start || !end || !start.lat || !start.lng || !end.lat || !end.lng) {
            return NextResponse.json(
                { error: 'Start and end coordinates are required' },
                { status: 400 }
            );
        }

        const route = await calculateRoute(
            { lat: start.lat, lng: start.lng },
            { lat: end.lat, lng: end.lng }
        );

        return NextResponse.json({
            distance: route.distance,
            duration: route.duration,
            distanceKm: route.distanceKm,
        });
    } catch (error: any) {
        console.error('Distance calculation error:', error);
        return NextResponse.json(
            { error: error.message || 'Distance calculation failed' },
            { status: 500 }
        );
    }
}
