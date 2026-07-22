const API_BASE = 'http://localhost:8000/api';

export const fetchIncidents = async (params: Record<string, any> = {}) => {
  const url = new URL(`${API_BASE}/incidents/`);
  Object.keys(params).forEach(key => {
    if (params[key]) url.searchParams.append(key, params[key]);
  });
  const res = await fetch(url.toString());
  return res.json();
};

export const fetchDistricts = async () => {
  const res = await fetch(`${API_BASE}/incidents/districts`);
  return res.json();
};

export const fetchHotspots = async (params: Record<string, any> = {}) => {
  const url = new URL(`${API_BASE}/hotspots/`);
  Object.keys(params).forEach(key => {
    if (params[key]) url.searchParams.append(key, params[key]);
  });
  const res = await fetch(url.toString());
  return res.json();
};

export const fetchNetwork = async (params: Record<string, any> = {}) => {
  const url = new URL(`${API_BASE}/network/`);
  Object.keys(params).forEach(key => {
    if (params[key]) url.searchParams.append(key, params[key]);
  });
  const res = await fetch(url.toString());
  return res.json();
};

export const fetchRiskGrid = async (params: Record<string, any> = {}) => {
  const url = new URL(`${API_BASE}/predictive/risk_grid`);
  Object.keys(params).forEach(key => {
    if (params[key]) url.searchParams.append(key, params[key]);
  });
  const res = await fetch(url.toString());
  return res.json();
};

export const fetchAnomalies = async (params: Record<string, any> = {}) => {
  const url = new URL(`${API_BASE}/anomalies/`);
  Object.keys(params).forEach(key => {
    if (params[key]) url.searchParams.append(key, params[key]);
  });
  const res = await fetch(url.toString());
  return res.json();
};

export const acknowledgeDispatch = async (payload: { officer_id: number; event_id: number }) => {
  const res = await fetch(`${API_BASE}/dispatch/acknowledge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const fetchOfficers = async (params: Record<string, any> = {}) => {
  const url = new URL(`${API_BASE}/dispatch/officers`);
  Object.keys(params).forEach(key => {
    if (params[key]) url.searchParams.append(key, params[key]);
  });
  const res = await fetch(url.toString());
  return res.json();
};

export const confirmDispatch = async (payload: { officer_id: number; event_id: number }) => {
  const res = await fetch(`${API_BASE}/dispatch/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return res.json();
};
