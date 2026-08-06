import React, { useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix custom markers styling since Leaflet adds hardcoded background and border
const customMarkerStyle = `
  .custom-leaflet-marker {
    background: transparent !important;
    border: none !important;
  }
`;

const createIcon = (type) => {
    const t = type?.toLowerCase() || '';
    let bgColor, iconName, colorClass;
    if (t === 'police') {
        bgColor = 'bg-cyan-500/15 border-cyan-400/30';
        iconName = 'shield';
        colorClass = 'text-cyan-200';
    } else if (t === 'hospital') {
        bgColor = 'bg-rose-500/15 border-rose-400/30';
        iconName = 'local_hospital';
        colorClass = 'text-rose-100';
    } else {
        bgColor = 'bg-violet-500/15 border-violet-300/30';
        iconName = 'home';
        colorClass = 'text-violet-200';
    }

    return new L.DivIcon({
        className: 'custom-leaflet-marker',
        html: `<div class="w-10 h-10 rounded-full shadow-md flex items-center justify-center z-10 border-2 ${bgColor}">
      <span class="material-symbols-outlined text-[20px] ${colorClass}">${iconName}</span>
    </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });
};

const userIcon = new L.DivIcon({
    className: 'custom-leaflet-marker',
    html: `<div class="relative flex items-center justify-center w-12 h-12">
    <div class="absolute w-12 h-12 bg-violet-400/20 rounded-full animate-ping"></div>
    <div class="w-7 h-7 rounded-full bg-slate-950 shadow-lg flex items-center justify-center z-10 border-2 border-violet-300">
      <div class="w-3.5 h-3.5 rounded-full bg-violet-300"></div>
    </div>
  </div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24]
});

function MapZoomController({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, 14);
        }
    }, [center, map]);
    return null;
}

export default function CustomMapContainer({ location, pois }) {
    return (
        <>
            <style>{customMarkerStyle}</style>
            <div className="absolute inset-0 z-0">
                <LeafletMap center={location} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={true}>
                    <MapZoomController center={location} />
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; OpenStreetMap contributors'
                    />

                    <Marker position={location} icon={userIcon}>
                        <Popup className="font-body shadow-sm text-center font-bold">You are here</Popup>
                    </Marker>

                    {pois.map(poi => (
                        <Marker key={poi.id} position={[poi.lat, poi.lon]} icon={createIcon(poi.type)}>
                            <Popup className="font-body shadow-sm border-none rounded-xl">
                                <div className="text-center p-1">
                                    <h4 className="font-serif font-bold text-on-surface text-[14px] mb-1">{poi.name}</h4>
                                    <p className="text-[10px] uppercase text-on-surface-variant font-bold">{poi.type}</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </LeafletMap>
            </div>
        </>
    );
}
