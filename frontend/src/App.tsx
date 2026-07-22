import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Shield, Map as MapIcon, Network, Smartphone } from 'lucide-react';
import clsx from 'clsx';
import Cockpit from './pages/Cockpit';
import NetworkExplorer from './pages/NetworkExplorer';
import FieldView from './pages/FieldView';
import DistrictView from './pages/DistrictView';

function CommandBar() {
  const location = useLocation();
  const links = [
    { to: '/', icon: <Shield size={16} />, label: 'Cockpit' },
    { to: '/district', icon: <MapIcon size={16} />, label: 'Predictive Risk' },
    { to: '/network', icon: <Network size={16} />, label: 'Network' },
    { to: '/field', icon: <Smartphone size={16} />, label: 'Field Alerts' },
  ];

  return (
    <header className="h-12 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-1 rounded-sm">
            <Shield size={16} />
          </div>
          <h1 className="text-sm font-bold tracking-tight uppercase text-foreground">Sentinel</h1>
        </div>
        <div className="w-px h-4 bg-border"></div>
        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-sm transition-colors",
                location.pathname === link.to
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground border border-transparent hover:bg-accent hover:text-foreground"
              )}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
        OP-COM // KSP-Hackathon
      </div>
    </header>
  );
}

function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
        <CommandBar />
        <main className="flex-1 overflow-auto relative">
          <Routes>
            <Route path="/" element={<Cockpit />} />
            <Route path="/district" element={<DistrictView />} />
            <Route path="/network" element={<NetworkExplorer />} />
            <Route path="/field" element={<FieldView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
