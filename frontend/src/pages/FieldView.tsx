import { useEffect, useState } from 'react';
import { fetchDistricts, fetchAnomalies, acknowledgeDispatch } from '../api/client';
import { Filter, Siren, AlertTriangle, ShieldCheck, Clock, RadioTower } from 'lucide-react';

export default function FieldView() {
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [dispatchOrder, setDispatchOrder] = useState<any>(null);
  const [currentOfficerId, setCurrentOfficerId] = useState<number>(1);

  useEffect(() => {
    fetchDistricts().then(d => {
      setDistricts(d);
      if (d.length > 0) {
        setSelectedDistrict(d[0]);
        fetchAnomalies({ district_id: d[0].district_id }).then(setAnomalies);
      }
    });
  }, []);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/live-incidents');
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'DISPATCH_UPDATE' && data.action === 'CONFIRM') {
          // Compare as numbers or strings defensively
          if (Number(data.officer_id) === Number(currentOfficerId)) {
            setDispatchOrder(data);
          }
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [currentOfficerId]);

  const handleAcknowledge = async () => {
    if (!dispatchOrder) return;
    try {
      await acknowledgeDispatch({
        officer_id: dispatchOrder.officer_id,
        event_id: dispatchOrder.event_id
      });
      setDispatchOrder(null);
    } catch (err) {
      console.error('Failed to acknowledge dispatch', err);
    }
  };

  const handleDistrictChange = (e: any) => {
    const dId = e.target.value;
    const dist = districts.find(d => d.district_id == dId);
    setSelectedDistrict(dist);
    fetchAnomalies({ district_id: dId }).then(setAnomalies);
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Real-Time Anomaly Alerts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Live Z-Score monitoring and severity spikes for field officers</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-card px-2 py-1 border border-border">
            <RadioTower size={14} className="text-primary" />
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest hidden sm:inline">Officer ID:</span>
            <select 
              className="bg-transparent border-none outline-none text-xs cursor-pointer text-foreground uppercase tracking-wider font-mono"
              onChange={(e) => setCurrentOfficerId(Number(e.target.value))}
              value={currentOfficerId}
            >
              {[1, 2, 3, 4, 5].map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-card px-2 py-1 border border-border">
            <Filter size={14} className="text-destructive" />
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
      </div>

      {dispatchOrder && (
        <div className="bg-destructive/10 border border-destructive p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-destructive/5 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-destructive/20 text-destructive border border-destructive/30 rounded-none shrink-0">
              <Siren size={24} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest mb-1 text-destructive">Immediate Dispatch Order</h3>
              <p className="text-sm text-foreground/90">{dispatchOrder.message}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] font-mono tracking-widest uppercase border border-destructive/20 bg-destructive/10 px-2 py-1 text-destructive">
                  Event #{dispatchOrder.event_id}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleAcknowledge}
            className="w-full sm:w-auto px-6 py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold uppercase tracking-wider text-xs transition-colors shrink-0"
          >
            Acknowledge Receipt
          </button>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 gap-4 overflow-y-auto pb-4 custom-scrollbar pr-2">
        
        {anomalies.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center bg-card border border-border p-12 text-muted-foreground gap-3">
            <ShieldCheck size={48} className="text-success opacity-50" />
            <h2 className="text-sm uppercase tracking-widest font-mono">No Active Anomalies</h2>
            <p className="text-xs">Crime patterns are within normal baselines for the selected district.</p>
          </div>
        ) : (
          anomalies.map(anomaly => (
            <div key={anomaly.id} className={`bg-card border p-4 relative overflow-hidden transition-colors ${anomaly.severity === 5 ? 'border-destructive/40 hover:border-destructive' : 'border-warning/40 hover:border-warning'}`}>
              <div className={`absolute -right-10 -top-10 opacity-5 transition-opacity ${anomaly.severity === 5 ? 'text-destructive' : 'text-warning'}`}>
                <Siren size={150} />
              </div>
              
              <div className="flex gap-4 relative z-10">
                <div className={`p-3 border flex items-center justify-center self-start ${anomaly.severity === 5 ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-warning/10 border-warning/20 text-warning'}`}>
                  {anomaly.severity === 5 ? <Siren size={24} /> : <AlertTriangle size={24} />}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider mb-1 text-foreground">{anomaly.crime_type.replace('_', ' ')}</h3>
                      <p className="text-xs text-muted-foreground">{anomaly.message}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase border border-border bg-background px-2 py-1 text-muted-foreground">
                      <Clock size={12} />
                      {new Date(anomaly.date).toISOString().split('T')[0]}
                    </div>
                  </div>
                  
                  {anomaly.z_score !== undefined && (
                    <div className="grid grid-cols-3 gap-0 border border-border">
                      <div className="p-2 border-r border-border bg-background/50">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Z-Score</div>
                        <div className="text-sm font-mono text-warning leading-none">{anomaly.z_score}</div>
                      </div>
                      <div className="p-2 border-r border-border bg-background/50">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Current</div>
                        <div className="text-sm font-mono text-foreground leading-none">{anomaly.current_count}</div>
                      </div>
                      <div className="p-2 bg-background/50">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Baseline</div>
                        <div className="text-sm font-mono text-foreground leading-none">{anomaly.average}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

      </div>
    </div>
  );
}
