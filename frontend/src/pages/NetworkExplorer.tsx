import { useEffect, useState, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { fetchDistricts, fetchNetwork } from '../api/client';
import { Network, Filter, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

export default function NetworkExplorer() {
  const [districts, setDistricts] = useState<any[]>([]);
  const [graphData, setGraphData] = useState<{nodes: any[], links: any[]}>({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  useEffect(() => {
    fetchDistricts().then(setDistricts);
    loadNetwork();

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    // Initial size
    setTimeout(handleResize, 100);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadNetwork = (dId?: string) => {
    const params = dId ? { district_id: dId } : {};
    fetchNetwork(params).then(data => {
      setGraphData(data);
    });
  };

  const handleDistrictChange = (e: any) => {
    const dId = e.target.value;
    loadNetwork(dId);
  };

  // Color scale for communities
  const communityColors = useMemo(() => [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
  ], []);

  const getNodeColor = (node: any) => {
    const index = (node.community || 0) % communityColors.length;
    return communityColors[index];
  };

  const handleZoomIn = () => {
    if (graphRef.current) {
      const zoom = graphRef.current.zoom();
      graphRef.current.zoom(zoom * 1.5, 400);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      const zoom = graphRef.current.zoom();
      graphRef.current.zoom(zoom / 1.5, 400);
    }
  };

  const handleFit = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Network & Link Analysis
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Suspect syndicates and structural community detection</p>
        </div>
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

      <div className="flex-1 bg-background border border-border relative overflow-hidden" ref={containerRef}>
        
        {/* Controls Overlay */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          <div className="bg-card p-3 border border-border shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Topology Stats</div>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-lg font-mono text-primary leading-none">{graphData.nodes.length}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Entities</div>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div>
                <div className="text-lg font-mono text-primary leading-none">{graphData.links.length}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Links</div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-3 right-3 z-10 flex flex-col bg-card border border-border p-0.5 shadow-sm">
          <button onClick={handleZoomIn} className="p-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Zoom In">
            <ZoomIn size={14} />
          </button>
          <div className="w-full h-px bg-border"></div>
          <button onClick={handleZoomOut} className="p-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Zoom Out">
            <ZoomOut size={14} />
          </button>
          <div className="w-full h-px bg-border"></div>
          <button onClick={handleFit} className="p-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Fit to Screen">
            <Maximize size={14} />
          </button>
        </div>

        {graphData.nodes.length > 0 ? (
          <ForceGraph2D
            ref={graphRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel="name"
            nodeColor={getNodeColor}
            nodeRelSize={4}
            linkColor={() => 'rgba(255, 255, 255, 0.15)'}
            linkWidth={1}
            backgroundColor="transparent"
            d3AlphaDecay={0.05}
            d3VelocityDecay={0.4}
            cooldownTicks={100}
            onNodeClick={(node) => {
              // Center view on clicked node
              if (graphRef.current) {
                graphRef.current.centerAt(node.x, node.y, 1000);
                graphRef.current.zoom(8, 2000);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Network size={32} className="opacity-20" />
            <p className="text-xs uppercase tracking-widest font-mono">Loading topology...</p>
          </div>
        )}
      </div>
    </div>
  );
}
