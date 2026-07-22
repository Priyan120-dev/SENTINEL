import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

export default function HeatmapLayer({ points }: { points: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    // The points array is expected to be [lat, lon, intensity]
    // We'll map hotspots from DBSCAN to heat points
    const heatData = points.map(p => [p.lat, p.lon, p.count * 10]); // scale intensity

    const heatLayer = (L as any).heatLayer(heatData, {
      radius: 45,
      blur: 35,
      maxZoom: 17,
      gradient: { 0.2: 'blue', 0.4: 'cyan', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red' }
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}
