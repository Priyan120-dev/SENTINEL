import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Rectangle, Tooltip, useMap } from 'react-leaflet';
import { fetchDistricts, fetchRiskGrid, fetchIncidents, fetchOfficers, confirmDispatch } from '../api/client';
import { Filter, BrainCircuit, ShieldAlert } from 'lucide-react';

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function DistrictView() {
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<any>(null);
  const [riskGrid, setRiskGrid] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [dispatching, setDispatching] = useState<Record<number, boolean>>({});
  const [dispatched, setDispatched] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchDistricts().then(d => {
      setDistricts(d);
      if (d.length > 0) {
        // Auto-select Bangalore Urban for demo
        const blr = d.find((x: any) => x.name === 'Bengaluru Urban') || d[0];
        setSelectedDistrict(blr);
        fetchRiskGrid({ district_id: blr.district_id }).then(setRiskGrid);
        fetchIncidents({ district_id: blr.district_id, limit: 100 }).then(setIncidents);
      }
    });
  }, []);

  const handleDistrictChange = (e: any) => {
    const dId = e.target.value;
    const dist = districts.find(d => d.district_id == dId);
    setSelectedDistrict(dist);
    fetchRiskGrid({ district_id: dId }).then(setRiskGrid);
    fetchIncidents({ district_id: dId, limit: 100 }).then(setIncidents);
  };

  const handleConfirmDispatch = async (incident: any) => {
    setDispatching(prev => ({ ...prev, [incident.event_id]: true }));
    try {
      const officers = await fetchOfficers({ 
        hotspot_lat: incident.lat, 
        hotspot_lon: incident.lon, 
        severity: incident.severity 
      });
      if (officers && officers.length > 0) {
        const bestOfficer = officers[0];
        await confirmDispatch({ officer_id: bestOfficer.officer_id, event_id: incident.event_id });
        setDispatched(prev => ({ ...prev, [incident.event_id]: true }));
      } else {
        alert("No officers available");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to dispatch");
    } finally {
      setDispatching(prev => ({ ...prev, [incident.event_id]: false }));
    }
  };

  const center: [number, number] = selectedDistrict ? [selectedDistrict.lat, selectedDistrict.lon] : [15.0, 76.0];
  const zoom = 11;
  const GRID_SIZE = 0.05;

  const getRiskColor = (score: number) => {
    if (score > 80) return '#ef4444'; // Red
    if (score > 50) return '#f97316'; // Orange
    if (score > 20) return '#eab308'; // Yellow
    return '#22c55e'; // Green
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Predictive Risk Intel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">AI-driven spatio-temporal risk forecasting (5km grid)</p>
        </div>
        <div className="flex items-center gap-2 bg-card px-2 py-1 border border-border">
          <Filter size={14} className="text-muted-foreground" />
          <select 
            className="bg-transparent border-none outline-none text-xs cursor-pointer text-foreground uppercase tracking-wider font-mono"
            onChange={handleDistrictChange}
            value={selectedDistrict?.district_id || ''}
          >
            {districts.map(d => (
              <option key={d.district_id} value={d.district_id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        
        {/* Sidebar Info */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
          <div className="bg-card border border-border p-3 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 transition-opacity">
              <BrainCircuit size={100} />
            </div>
            <div className="flex items-center gap-2 mb-3 border-b border-border pb-2 relative z-10">
              <BrainCircuit size={14} className="text-muted-foreground" />
              <h3 className="font-semibold text-xs tracking-wider uppercase text-foreground">Risk Model</h3>
            </div>
            <div className="space-y-3 relative z-10">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Algorithm</div>
                <div className="text-xs font-medium text-foreground mt-0.5">RandomForest Ensemble</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Resolution</div>
                <div className="text-xs font-medium text-foreground mt-0.5">5km² Spatial Grid</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Features Evaluated</div>
                <div className="text-[10px] font-mono mt-1 space-y-1">
                  <div className="bg-background border border-border p-1">Historical Density</div>
                  <div className="bg-background border border-border p-1">Severity Index</div>
                  <div className="bg-background border border-border p-1">Temporal Recency</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border p-3">
            <h3 className="font-semibold text-xs tracking-wider uppercase text-foreground mb-3 border-b border-border pb-2">Legend</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-destructive opacity-80 border border-destructive/50"></div>
                <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">Critical Risk (&gt;80)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 opacity-80 border border-orange-500/50"></div>
                <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">High Risk (50-80)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 opacity-80 border border-yellow-500/50"></div>
                <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">Elevated Risk (20-50)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 opacity-80 border border-green-500/50"></div>
                <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">Baseline (&lt;20)</span>
              </div>
            </div>
          </div>

          {/* Predictive Risk Alerts */}
          <div className="bg-card border border-border p-3">
            <h3 className="font-semibold text-xs tracking-wider uppercase text-foreground mb-3 border-b border-border pb-2 flex items-center gap-2">
              <ShieldAlert size={14} className="text-destructive" />
              Predictive Risk Alerts
            </h3>
            <div className="space-y-2">
              {incidents.filter(i => i.severity > 3).slice(0, 5).map(inc => (
                <div key={inc.event_id} className="p-2 bg-background border border-border flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[11px] font-bold uppercase text-foreground">{inc.crime_type.replace('_', ' ')}</div>
                      <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{new Date(inc.occurred_at).toISOString().split('T')[0]}</div>
                    </div>
                    <div className="flex items-center justify-center px-1.5 py-0.5 bg-destructive/10 text-destructive text-[10px] font-mono border border-destructive/20">
                      SEV: {inc.severity}
                    </div>
                  </div>
                  <button
                    onClick={() => handleConfirmDispatch(inc)}
                    disabled={dispatching[inc.event_id] || dispatched[inc.event_id]}
                    className={`w-full py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                      dispatched[inc.event_id] 
                        ? 'bg-success/20 border-success/50 text-success cursor-not-allowed'
                        : dispatching[inc.event_id]
                        ? 'bg-muted border-border text-muted-foreground cursor-not-allowed'
                        : 'bg-primary/10 border-primary text-primary hover:bg-primary/20'
                    }`}
                  >
                    {dispatched[inc.event_id] ? 'Dispatched' : dispatching[inc.event_id] ? 'Dispatching...' : 'Confirm Dispatch'}
                  </button>
                </div>
              ))}
              {incidents.filter(i => i.severity > 3).length === 0 && (
                <div className="text-xs text-muted-foreground p-2 text-center border border-border bg-background">No severe alerts in this district</div>
              )}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-3 relative border border-border bg-card">
          <MapContainer center={center} zoom={zoom} className="w-full h-full z-10" zoomControl={false}>
            <MapUpdater center={center} />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; CARTO'
            />
            {riskGrid.map((cell, idx) => {
              const bounds: [[number, number], [number, number]] = [
                [cell.lat - GRID_SIZE/2, cell.lon - GRID_SIZE/2],
                [cell.lat + GRID_SIZE/2, cell.lon + GRID_SIZE/2]
              ];
              const color = getRiskColor(cell.risk_score);
              return (
                <Rectangle
                  key={idx}
                  bounds={bounds}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.3,
                    weight: 1
                  }}
                >
                  <Tooltip className="custom-popup" sticky>
                    <div className="p-0">
                      <div className="text-[10px] font-mono tracking-widest text-muted-foreground mb-1 uppercase">Grid Intel</div>
                      <div className="font-bold mb-2 text-foreground text-sm border-b border-border pb-1 flex items-center gap-2">
                        <ShieldAlert size={14} style={{ color }} />
                        <span className="font-mono">SCORE: {cell.risk_score.toFixed(1)}</span>
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground">LAT: {cell.lat.toFixed(3)}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">LON: {cell.lon.toFixed(3)}</div>
                    </div>
                  </Tooltip>
                </Rectangle>
              );
            })}
          </MapContainer>
        </div>

      </div>
    </div>
  );
}
