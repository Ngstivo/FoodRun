'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
    center: [number, number]; // [lat, lng]
    zoom?: number;
    markers?: Array<{
        position: [number, number];
        label: string;
        type?: 'pickup' | 'delivery' | 'driver';
    }>;
    className?: string;
}

export default function MapView({ center, zoom = 13, markers = [], className = '' }: MapViewProps) {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        // Initialize map
        const map = L.map(mapContainerRef.current).setView(center, zoom);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);

        mapRef.current = map;

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Update markers when they change
    useEffect(() => {
        if (!mapRef.current) return;

        const map = mapRef.current;

        // Clear existing markers
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        // Add new markers
        markers.forEach((marker) => {
            const icon = getMarkerIcon(marker.type);
            const leafletMarker = L.marker(marker.position, { icon })
                .addTo(map)
                .bindPopup(marker.label);
        });

        // Fit bounds to show all markers
        if (markers.length > 1) {
            const bounds = L.latLngBounds(markers.map(m => m.position));
            map.fitBounds(bounds, { padding: [50, 50] });
        } else if (markers.length === 1) {
            map.setView(markers[0].position, zoom);
        }
    }, [markers, zoom]);

    return (
        <div
            ref={mapContainerRef}
            className={`rounded-lg overflow-hidden ${className}`}
            style={{ height: '400px', width: '100%' }}
        />
    );
}

function getMarkerIcon(type?: 'pickup' | 'delivery' | 'driver'): L.Icon {
    const iconUrls = {
        pickup: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        delivery: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        driver: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    };

    if (type && iconUrls[type]) {
        return L.icon({
            iconUrl: iconUrls[type],
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
        });
    }

    return new L.Icon.Default();
}
