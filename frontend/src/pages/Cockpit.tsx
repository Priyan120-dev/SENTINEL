import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { fetchDistricts, fetchIncidents, fetchHotspots, fetchOfficers } from '../api/client';
import 'leaflet/dist/leaflet.css';
import { Activity, Filter, Flame, BarChart3, AlertTriangle, Crosshair } from 'lucide-react';
import HeatmapLayer from '../components/HeatmapLayer';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function Cockpit() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<any>(null);
  const [showHotspots, setShowHotspots] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [availableOfficers, setAvailableOfficers] = useState<any[]>([]);

  useEffect(() => {
    fetchDistricts().then(setDistricts);
    fetchIncidents({ limit: 800 }).then(setIncidents);
  }, []);

  useEffect(() => {
    // Connect to WebSocket for real-time live incidents
    const ws = new WebSocket('ws://localhost:8000/ws/live-incidents');
    
    ws.onmessage = (event) => {
      const newIncident = JSON.parse(event.data);
      setIncidents((prev) => [newIncident, ...prev].slice(0, 800)); // Keep max 800
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleDistrictChange = async (e: any) => {
    const dId = e.target.value;
    if (!dId) {
      setSelectedDistrict(null);
      fetchIncidents({ limit: 800 }).then(setIncidents);
      if (showHotspots) {
        fetchHotspots().then(setHotspots);
      }
      return;
    }
    const dist = districts.find(d => d.district_id == dId);
    setSelectedDistrict(dist);
    fetchIncidents({ district_id: dId, limit: 800 }).then(setIncidents);
    if (showHotspots) {
      fetchHotspots({ district_id: dId }).then(setHotspots);
    }
  };

  const handleSelectIncident = async (inc: any) => {
    setSelectedIncident(inc);
    try {
      const officers = await fetchOfficers({ 
        hotspot_lat: inc.lat, 
        hotspot_lon: inc.lon, 
        severity: inc.severity 
      });
      setAvailableOfficers(officers);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleHotspots = () => {
    if (!showHotspots) {
      const params = selectedDistrict ? { district_id: selectedDistrict.district_id } : {};
      fetchHotspots(params).then(setHotspots);
    }
    setShowHotspots(!showHotspots);
  };

  const center: [number, number] = selectedDistrict ? [selectedDistrict.lat, selectedDistrict.lon] : [15.0, 76.0];
  const zoom = selectedDistrict ? 11 : 7;

  // Process data for charts
  const crimeTypeCounts = incidents.reduce((acc, inc) => {
    acc[inc.crime_type] = (acc[inc.crime_type] || 0) + 1;
    return acc;
  }, {});
  const barData = Object.keys(crimeTypeCounts).map(k => ({
    name: k.replace('_', ' ').substring(0, 10),
    count: crimeTypeCounts[k]
  })).sort((a, b) => b.count - a.count).slice(0, 5);

  const monthlyCounts = incidents.reduce((acc, inc) => {
    const month = new Date(inc.occurred_at).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});
  const lineData = Object.keys(monthlyCounts).map(k => ({ name: k, count: monthlyCounts[k] }));

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            State Command Cockpit
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Live Intelligence & Spatial Overview</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleHotspots}
            className={`flex items-center gap-2 px-3 py-1 border text-xs font-medium transition-colors ${
              showHotspots 
              ? 'bg-destructive/10 border-destructive text-destructive' 
              : 'bg-card border-border text-foreground hover:bg-border/50'
            }`}
          >
            <Flame size={14} />
            <span className="uppercase tracking-wider">Hotspots</span>
          </button>
          
          <div className="flex items-center gap-2 bg-card px-2 py-1 border border-border">
            <Filter size={14} className="text-muted-foreground" />
            <select 
              className="bg-transparent border-none outline-none text-xs cursor-pointer text-foreground uppercase tracking-wider font-mono"
              onChange={handleDistrictChange}
            >
              <option value="">All Karnataka</option>
              {districts.map(d => (
                <option key={d.district_id} value={d.district_id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        <div className="lg:col-span-3 relative border border-border bg-card">
          <MapContainer center={center} zoom={zoom} className="w-full h-full z-10" zoomControl={false}>
            <MapUpdater center={center} />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; CARTO'
            />
            {!showHotspots && incidents.map((incident) => (
              <CircleMarker
                key={incident.event_id}
                center={[incident.lat, incident.lon]}
                radius={3}
                pathOptions={{ 
                  color: incident.severity > 3 ? 'var(--destructive)' : 'var(--warning)',
                  fillColor: incident.severity > 3 ? 'var(--destructive)' : 'var(--warning)', 
                  fillOpacity: 0.8,
                  weight: 0
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-0">
                    <div className="text-[10px] font-mono tracking-widest text-muted-foreground mb-1">EVENT DETECTED</div>
                    <div className="font-bold mb-2 text-foreground uppercase text-sm border-b border-border pb-1">{incident.crime_type.replace('_', ' ')}</div>
                    <div className="text-xs text-foreground flex items-center gap-2 mb-2 bg-background p-1.5 border border-border">
                      <AlertTriangle size={12} className={incident.severity > 3 ? 'text-destructive' : 'text-warning'} />
                      <span className="font-mono">SEVERITY: {incident.severity}/5</span>
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">{new Date(incident.occurred_at).toISOString()}</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
            {showHotspots && <HeatmapLayer points={hotspots} />}
          </MapContainer>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
          
          {/* Top Crime Types */}
          <div className="bg-card border border-border p-3">
            <div className="flex items-center gap-2 mb-3 border-b border-border pb-2">
              <BarChart3 size={14} className="text-muted-foreground" />
              <h3 className="font-semibold text-xs tracking-wider uppercase text-foreground">Top Crime Categories</h3>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="var(--border)" fontSize={11} tick={{fill: 'var(--foreground)'}} />
                  <YAxis stroke="var(--border)" fontSize={11} tick={{fill: 'var(--foreground)'}} />
                  <Tooltip 
                    cursor={{fill: 'var(--border)', opacity: 0.4}} 
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                  />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Temporal Trend */}
          <div className="bg-card border border-border p-3">
            <div className="flex items-center gap-2 mb-3 border-b border-border pb-2">
              <Activity size={14} className="text-muted-foreground" />
              <h3 className="font-semibold text-xs tracking-wider uppercase text-foreground">Temporal Trends</h3>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--border)" fontSize={11} tick={{fill: 'var(--foreground)'}} />
                  <YAxis stroke="var(--border)" fontSize={11} tick={{fill: 'var(--foreground)'}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="var(--color-success)" strokeWidth={1.5} dot={{ r: 2, fill: 'var(--color-card)', strokeWidth: 1.5 }} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Pulse */}
          <div className="bg-card border border-border p-3">
            <div className="flex items-center gap-2 mb-3 border-b border-border pb-2">
              <AlertTriangle size={14} className="text-destructive" />
              <h3 className="font-semibold text-xs tracking-wider uppercase text-foreground">Recent Severe Alerts</h3>
            </div>
            <div className="space-y-1.5">
              {incidents.filter(i => i.severity > 3).slice(0, 5).map(inc => (
                <div 
                  key={inc.event_id} 
                  onClick={() => handleSelectIncident(inc)}
                  className={`flex justify-between items-center p-2 bg-background border hover:border-muted-foreground transition-colors cursor-pointer ${
                    selectedIncident?.event_id === inc.event_id ? 'border-primary' : 'border-border'
                  }`}
                >
                  <div>
                    <div className="text-[11px] font-bold uppercase text-foreground">{inc.crime_type.replace('_', ' ')}</div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{new Date(inc.occurred_at).toISOString().split('T')[0]}</div>
                  </div>
                  <div className="flex items-center justify-center w-6 h-6 bg-destructive/10 text-destructive text-[10px] font-mono border border-destructive/20">
                    {inc.severity}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Officer Dispatch Management */}
          {selectedIncident && (
            <div className="bg-card border border-border p-3">
              <div className="flex items-center gap-2 mb-3 border-b border-border pb-2">
                <Crosshair size={14} className="text-primary" />
                <h3 className="font-semibold text-xs tracking-wider uppercase text-foreground">Officer Dispatch</h3>
              </div>
              <div className="mb-2 text-[10px] font-mono text-muted-foreground uppercase">
                Selected: {selectedIncident.crime_type.replace('_', ' ')}
              </div>
              <div className="space-y-1.5">
                {availableOfficers.length === 0 ? (
                  <div className="text-xs text-muted-foreground p-2 text-center border border-border bg-background">No officers available</div>
                ) : (
                  availableOfficers.map(officer => (
                    <div key={officer.officer_id} className="flex flex-col p-2 bg-background border border-border">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-bold uppercase text-foreground">{officer.name}</span>
                        <span className="text-[10px] font-mono text-success">ETA: {officer.eta_minutes}m</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-muted-foreground">ID: {officer.badge_number}</span>
                        <span className="text-[10px] font-mono text-muted-foreground capitalize">{officer.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
