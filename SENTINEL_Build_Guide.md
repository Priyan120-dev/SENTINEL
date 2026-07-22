# SENTINEL — Complete Build Guide
### AI-Driven Crime Analytics & Visualization Platform for Karnataka State Police (SCRB)
**Challenge 02 — KSP Hackathon | Step-by-step instruction manual**

This guide merges the ambition of the SENTINEL pitch with the realism of the Project Report so a small team can actually build, demo, and defend every claim they make to the judges. Nothing in here is aspirational — every step is something you can execute in a hackathon timeframe (or a short follow-on sprint for the parts marked "Phase 2 Roadmap").

---

## 0. How to Use This Guide

- Follow the phases in order. Each phase has: **Goal → Tasks → Commands/Code → Definition of Done**.
- Build the "Core" features first, fully working, before touching anything marked "Stretch." A judge remembers a polished narrow demo far better than a broad broken one.
- Everything here uses **synthetic data** modeled on real Karnataka geography and station structure — never use real FIR/victim/suspect data in a hackathon build.

---

## 1. Problem Statement (what you're solving, in one paragraph)

SCRB Karnataka receives crime data from 1,100+ police stations, but it is siloed, manually compiled, and offers no way to see hotspots, repeat-offender networks, or emerging trends until days after the fact. Officers in the field have no access to intelligence beyond radio and paper. There is no predictive capability, no way to correlate crime with socio-economic context, and no transparency mechanism for the public. SENTINEL fixes this with one platform: ingest → analyze → predict → explain → deliver to command and to the officer's phone.

---

## 2. Product Scope: Core vs. Stretch

| Tier | Feature | Why |
|---|---|---|
| **Core (build first, fully working)** | Interactive crime map with filters | Table stakes — everything else sits on top of it |
| Core | Hotspot detection (DBSCAN/KDE) | Deliverable, explainable, fast to build |
| Core | District/station drilldowns + charts | Judges expect basic BI |
| Core | Criminal network / link analysis (NetworkX) | Visually impressive, technically honest |
| Core | Risk scoring per district (gradient boosting) | Predictive angle without overselling |
| Core | Anomaly/trend alerts (moving average + z-score) | Easy, real, demoable |
| **Stretch (only if Core is fully polished)** | Natural-language query bar (rules + templated NLQ, not full LLM RAG) | Wows judges without needing a real RAG pipeline |
| Stretch | Officer PWA (mobile-responsive read-only view) | Shows field-readiness thinking |
| Stretch | Fairness/bias check panel (simple demographic parity stats on synthetic data) | Shows ethical awareness |
| **Phase 2 Roadmap (say it, don't build it)** | ST-GNN 72h forecasting, Neo4j graph embeddings, real LLM RAG copilot, Kafka streaming, Digital Twin, Keycloak/Vault/K8s | State clearly in the deck as "next 6–12 months," with a one-slide architecture sketch. Never claim these are built if they aren't. |

This scoping is your single biggest edge over a team that lists 8 buzzword capabilities but can only demo 2.

---

## 3. Technology Stack (buildable in days, not months)

### 3.1 Frontend
| Tool | Purpose |
|---|---|
| React (Vite) + Tailwind CSS | Dashboard UI |
| Leaflet.js (with `react-leaflet`) | Interactive map + heatmap overlay |
| Recharts | Trend/bar/line charts |
| react-force-graph or vis-network | Criminal network graph |
| React Router | Navigation between Cockpit / District View / Network / Field App |

### 3.2 Backend
| Tool | Purpose |
|---|---|
| Python 3.11 + FastAPI | REST API |
| Uvicorn | ASGI server |
| Pandas / NumPy | Data wrangling |
| SQLAlchemy | ORM over PostgreSQL |
| Pydantic v2 | Request/response validation |

### 3.3 ML & Analytics
| Tool | Purpose |
|---|---|
| scikit-learn | DBSCAN (hotspots), GradientBoostingRegressor (risk score) |
| NetworkX | Suspect/co-offender graph, community detection (Louvain via `python-louvain`) |
| statsmodels | Moving average + z-score anomaly detection |
| Faker + custom generator | Synthetic Karnataka crime dataset |

### 3.4 Data
| Tool | Purpose |
|---|---|
| PostgreSQL + PostGIS | Primary geospatial store |
| SQLite | Local rapid-prototyping fallback |

### 3.5 DevOps (lightweight, not enterprise theatre)
| Tool | Purpose |
|---|---|
| Docker Compose | One-command local spin-up (postgres + api + frontend) |
| GitHub | Version control |
| Zoho Catalyst | Free-tier live demo deployment (backend + frontend) |

---

## 4. System Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  React Cockpit  |  District Drilldown  |  Network Explorer  │
│  Mobile-responsive Field View (read-only PWA-lite)           │
└───────────────────────┬───────────────────────────────────┘
                         │  REST (JSON) + WebSocket (optional)
┌───────────────────────▼───────────────────────────────────┐
│                     API LAYER (FastAPI)                     │
│  /incidents  /hotspots  /districts  /network  /risk  /alerts │
└───────────────────────┬───────────────────────────────────┘
                         │
┌───────────────────────▼───────────────────────────────────┐
│                  ANALYTICS / ML LAYER                        │
│  DBSCAN hotspot clustering | GradientBoosting risk model     │
│  NetworkX graph + Louvain community detection                │
│  Moving-average / z-score anomaly detection                  │
└───────────────────────┬───────────────────────────────────┘
                         │
┌───────────────────────▼───────────────────────────────────┐
│                     DATA LAYER                               │
│         PostgreSQL + PostGIS (crime_events, districts,        │
│         stations, suspects, suspect_links)                   │
└───────────────────────────────────────────────────────────┘
```

---

## 5. Data Model

### 5.1 Core tables

```sql
CREATE TABLE districts (
  district_id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  population INT,
  geom GEOMETRY(MULTIPOLYGON, 4326)
);

CREATE TABLE stations (
  station_id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  district_id INT REFERENCES districts(district_id),
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION
);

CREATE TABLE crime_events (
  event_id SERIAL PRIMARY KEY,
  station_id INT REFERENCES stations(station_id),
  district_id INT REFERENCES districts(district_id),
  crime_type TEXT NOT NULL,       -- theft, burglary, assault, chain-snatching, etc.
  occurred_at TIMESTAMP NOT NULL,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  status TEXT,                    -- reported / under_investigation / closed
  severity SMALLINT               -- 1–5 synthetic severity index
);

CREATE TABLE suspects (
  suspect_id SERIAL PRIMARY KEY,
  alias TEXT,                     -- synthetic, never real names/PII
  district_id INT REFERENCES districts(district_id)
);

CREATE TABLE suspect_links (
  link_id SERIAL PRIMARY KEY,
  suspect_a INT REFERENCES suspects(suspect_id),
  suspect_b INT REFERENCES suspects(suspect_id),
  shared_event_id INT REFERENCES crime_events(event_id),
  link_type TEXT                   -- co-accused, same_station, same_case
);
```

### 5.2 Synthetic data generation rules (important for realism)

- Base districts on actual Karnataka district boundaries (30 districts) — download a public GeoJSON (e.g., from Survey of India / open government data portals) for realistic `geom` polygons.
- Weight crime-type frequency and density realistically: higher density in Bengaluru Urban, Mysuru, Mangaluru; lower in rural districts.
- Add **temporal seasonality**: festival weeks (Ugadi, Ganesh Chaturthi, Diwali) get elevated theft/crowd-crime rates; late-night hours get elevated assault rates. This is what makes anomaly detection and forecasting demos look credible instead of random.
- Generate **repeat-offender clusters**: deliberately seed 15–20 suspect groups with 3–8 members each, linked across 2–4 shared events, so the network graph has real structure to discover instead of random noise.
- Target 50,000–100,000 synthetic records for the hackathon (not 500k — smaller is faster to iterate on and equally convincing in a demo).

```python
# scripts/generate_synthetic_data.py (skeleton)
import numpy as np, pandas as pd
from faker import Faker

fake = Faker("en_IN")
CRIME_TYPES = ["theft", "burglary", "chain_snatching", "assault", "vehicle_theft", "cybercrime", "public_nuisance"]

def generate_events(districts_df, n=75000):
    rows = []
    for _ in range(n):
        d = districts_df.sample(weights=districts_df["density_weight"]).iloc[0]
        lat = d.lat + np.random.normal(0, 0.05)
        lon = d.lon + np.random.normal(0, 0.05)
        crime = np.random.choice(CRIME_TYPES, p=d.crime_type_profile)
        occurred_at = fake.date_time_between(start_date="-1y", end_date="now")
        rows.append({
            "district_id": d.district_id, "crime_type": crime,
            "lat": lat, "lon": lon, "occurred_at": occurred_at,
            "severity": np.random.choice([1,2,3,4,5], p=[.3,.3,.2,.15,.05])
        })
    return pd.DataFrame(rows)
```

---

## 6. Build Roadmap (4-week hackathon-realistic plan)

### Phase 1 (Days 1–3): Data Foundation
**Goal:** Realistic synthetic dataset loaded into PostGIS.
- Set up `docker-compose.yml` with `postgres+postgis` image.
- Write and run `generate_synthetic_data.py` — districts, stations, crime_events, suspects, suspect_links.
- Validate: query counts per district, plot a quick histogram of crime by hour-of-day to sanity-check seasonality.
- **Done when:** `SELECT count(*) FROM crime_events;` returns your target volume and a quick matplotlib plot shows believable spatial clustering.

### Phase 2 (Days 3–7): Core Dashboard
**Goal:** React app with live map + filters.
- FastAPI endpoint `GET /incidents?district=&crime_type=&date_from=&date_to=`
- React + Leaflet: plot points, add a `crime_type` legend, add filter sidebar (district dropdown, date range, crime type multi-select).
- Recharts: crime count by type (bar), crime over time (line).
- **Done when:** Selecting a district and date range updates the map and both charts without a page reload.

### Phase 3 (Days 7–10): Hotspot Detection
**Goal:** DBSCAN clustering exposed as an API and rendered as a heat layer.
```python
from sklearn.cluster import DBSCAN
import numpy as np

def detect_hotspots(df, eps_km=0.5, min_samples=8):
    coords = np.radians(df[["lat", "lon"]].values)
    db = DBSCAN(eps=eps_km/6371, min_samples=min_samples, metric="haversine").fit(coords)
    df["cluster"] = db.labels_
    hotspots = df[df.cluster != -1].groupby("cluster").agg(
        lat=("lat","mean"), lon=("lon","mean"), count=("cluster","size")
    ).reset_index()
    return hotspots
```
- Endpoint `GET /hotspots?district=&window_days=30`
- Frontend: `leaflet.heat` plugin, toggle button "Show Hotspots."
- **Done when:** Toggling hotspots shows 3–8 clearly visible clusters that align with your seeded high-density areas (e.g., central Bengaluru).

### Phase 4 (Days 10–13): Network & Link Analysis
**Goal:** Suspect network graph, community detection.
```python
import networkx as nx
import community as community_louvain  # python-louvain

def build_graph(links_df):
    G = nx.Graph()
    for _, row in links_df.iterrows():
        G.add_edge(row.suspect_a, row.suspect_b, event=row.shared_event_id)
    partition = community_louvain.best_partition(G)
    nx.set_node_attributes(G, partition, "community")
    return G
```
- Endpoint `GET /network?district=` returns nodes + edges JSON with community IDs.
- Frontend: `react-force-graph-2d`, color nodes by community, click node → side panel with linked events.
- **Done when:** You can click a suspect node and see the 2–3 other suspects and shared cases that connect them — this is your "hidden gang exposed" demo moment.

### Phase 5 (Days 13–16): Predictive Risk Scoring
**Goal:** District-level risk score (not individual-level — see ethics note in §9).
```python
from sklearn.ensemble import GradientBoostingRegressor

# Features: rolling 7/30-day crime count, day-of-week, month, festival_flag, population density
features = ["count_7d", "count_30d", "dow", "month", "is_festival_week", "density"]
model = GradientBoostingRegressor(n_estimators=200, max_depth=3)
model.fit(X_train[features], y_train)  # y = next-week incident count, normalized
```
- Endpoint `GET /risk?district=` → returns 0–100 risk score + top 3 contributing factors (feature importances, in plain language — this is your "explainability" without needing full SHAP).
- Frontend: colored district badges (green/amber/red) on a summary panel.
- **Done when:** Every district shows a risk score with a one-line human-readable explanation, e.g., "Elevated due to festival week + 18% rise in reported theft over 30 days."

### Phase 6 (Days 16–19): Anomaly & Trend Alerts
**Goal:** Automatic flagging of unusual spikes.
```python
def detect_anomaly(series, window=14, z_thresh=2.5):
    rolling_mean = series.rolling(window).mean()
    rolling_std = series.rolling(window).std()
    z = (series - rolling_mean) / rolling_std
    return z.abs() > z_thresh
```
- Endpoint `GET /alerts` returns districts currently in anomaly state.
- Frontend: red banner at top of cockpit: "⚠ Anomaly detected: Mysuru — chain-snatching up 240% vs 14-day average."
- **Done when:** Seeding an artificial spike in the synthetic data for one district correctly triggers the banner.

### Phase 7 (Days 19–21): Polish, Stretch Features, Demo Rehearsal
- Add the templated NL query bar if time allows: a small set of pattern-matched queries ("show me `<crime_type>` in `<district>` this `<month>`") mapped to your existing filter API — present this honestly as "structured NL, full RAG copilot is Phase 2."
- Add a read-only mobile view (just responsive CSS breakpoints on the existing React app — no need for a separate PWA build unless time allows).
- Add a one-page **Fairness Note** (not a full dashboard): show that risk scores are computed at district level only, never tied to any individual or demographic attribute, and state this explicitly in the deck.
- Rehearse the 7-minute demo (see §8) at least 3 times end-to-end.

---

## 7. Repository Structure

```
sentinel/
├── docker-compose.yml
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   │   ├── incidents.py
│   │   │   ├── hotspots.py
│   │   │   ├── network.py
│   │   │   ├── risk.py
│   │   │   └── alerts.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── db.py
│   ├── scripts/
│   │   └── generate_synthetic_data.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/ (Map, FilterBar, ChartsPanel, NetworkGraph, RiskBadge, AlertBanner)
│   │   ├── pages/ (Cockpit, DistrictView, NetworkExplorer, FieldView)
│   │   └── api/
│   └── package.json
└── README.md
```

---

## 8. Judge-Ready Demo Script (7 minutes, timed)

| Min | What you do | What you say |
|---|---|---|
| 0:00–1:00 | Load Cockpit, map populated with live synthetic incidents | "SCRB manages data from 1,100+ stations today with no unified view. This is that unified view, live." |
| 1:00–2:00 | Toggle hotspot heat layer | "DBSCAN clustering surfaces high-density zones in real time — no more waiting weeks for a post-hoc report." |
| 2:00–3:00 | Click a district, show risk badge + plain-language explanation | "Every district gets a risk score with the top contributing factors spelled out — not a black box." |
| 3:00–4:30 | Open Network Explorer, click a seeded suspect cluster | "This surfaces suspects linked across multiple cases — investigator research aid, always human-reviewed, never an automated accusation." |
| 4:30–5:30 | Trigger/show an anomaly banner | "The system flags unusual spikes automatically — this is proactive, not reactive, policing." |
| 5:30–6:15 | Show mobile-responsive view | "The same intelligence, readable on a constable's phone in the field." |
| 6:15–7:00 | Closing slide: what's built vs. roadmap | "Everything you just saw is fully working, on synthetic data modeled on real Karnataka crime patterns. The roadmap slide shows where this goes next — spatio-temporal forecasting, a full LLM copilot, and graph-embedding-based network discovery — but we chose to build a smaller set of features completely rather than a longer list partially." |

---

## 9. Ethics & Responsible-Use Notes (include this section in your written submission — judges will ask)

- **District-level, not individual-level, prediction.** Risk scores are computed per district/grid-cell, never per person. This avoids the most serious fairness concerns with predictive policing (individual risk scores compounding existing bias).
- **Network analysis is a research aid, not an accusation engine.** The suspect graph surfaces known-associate patterns from confirmed case data for a human investigator to review — it does not autonomously flag anyone as a suspect or rank individuals by "risk."
- **No demographic features in any model.** Caste, religion, and name-derived proxies are explicitly excluded from all features. State this as a design constraint, not an afterthought.
- **Synthetic data only.** No real FIR, victim, or suspect data is used in the hackathon build. Say this clearly — judges will assume otherwise if you don't.
- **Auditability.** Every risk score returns its top contributing factors in plain language (from feature importances) so any output can be explained to a reviewing officer or, eventually, in court.

---

## 10. What to Say About the Parts You Didn't Build

Be upfront in the deck with a single "Roadmap Beyond the Hackathon" slide:

| Capability | Why not built now | Real path to build it |
|---|---|---|
| ST-GNN 72h forecasting | Needs weeks of model iteration + labeled ground truth | Prototype with PyTorch Geometric on aggregated grid-cell time series once real historical data access is granted |
| Full LLM RAG copilot | Needs a vetted, approved LLM gateway + a curated crime corpus | Start with the templated NL query bar built here, replace with RAG once data governance sign-off exists |
| Neo4j graph embeddings | Overkill for the current data volume; NetworkX + Louvain already demonstrates the same insight | Migrate to Neo4j + Node2Vec once network size exceeds ~50k suspects |
| Kafka streaming from 1,100+ stations | No real station feeds available in a hackathon | Kafka Connect + CDC from each station's existing case management system in a pilot phase |
| Kubernetes/Keycloak/Vault production hardening | Not a hackathon concern | Standard pilot-to-production checklist once SCRB selects this for a live pilot |

This slide is what separates a credible team from a team that oversold.

---

## 11. Quick-Start Commands

```bash
# 1. Clone and start infra
git clone <your-repo>
cd sentinel
docker-compose up -d postgres

# 2. Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python scripts/generate_synthetic_data.py
uvicorn app.main:app --reload --port 8000

# 3. Frontend
cd ../frontend
npm install
npm run dev
```

---

## 12. Measurable Impact Table (for the written submission)

| Metric | Baseline (today) | With SENTINEL |
|---|---|---|
| Time to compile a district crime report | 2–3 days, manual | Under 5 seconds, live query |
| Hotspot detection | Weeks, post-hoc | Real-time, on-demand |
| Repeat-offender network discovery | Ad-hoc, manual case review | Automated graph surfacing, human-reviewed |
| District risk visibility | None | Continuously updated score + explanation |
| Field officer access to intelligence | Radio + paper | Mobile-responsive dashboard |
| Model transparency | None | Every score includes plain-language contributing factors |

---

**Bottom line for the pitch:** lead with the SENTINEL name and narrative, but every single feature you demo should be something you can open the code for and explain line by line if a judge asks "how does this actually work?" That combination — ambitious framing, honest engineering — is what wins hackathons judged by technical people.
