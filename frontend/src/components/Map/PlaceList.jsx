import React from 'react';
import PlaceCard from './PlaceCard';

export default function PlaceList({ loading, pois }) {
    if (loading) {
        return <p className="my-4 text-center text-sm text-slate-400">Locating safe places…</p>;
    }

    if (pois.length === 0) {
        return <p className="my-4 text-center text-sm text-slate-400">No safe places found nearby.</p>;
    }

    return (
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {pois.map(poi => (
                <PlaceCard key={poi.id} poi={poi} />
            ))}
        </div>
    );
}
