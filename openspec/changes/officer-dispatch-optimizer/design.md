## Context

SENTINEL command staff currently rely on manual judgment to dispatch patrol units to areas highlighted by the Predictive Risk module. To ensure faster, objective deployment, we need an automated routing mechanism. This change implements the Officer Dispatch Optimizer, assigning officers algorithmically to predictive hotspots.

## Goals / Non-Goals

**Goals:**
- Provide automated dispatch recommendations based on nearest available units and risk severity.
- Allow command staff to review and confirm algorithmic dispatches.
- Notify field officers of dispatches in real-time.

**Non-Goals:**
- Fully autonomous dispatch (staff confirmation is still required).
- Turn-by-turn navigation for field officers (we only provide the hotspot coordinates and severity).

## Decisions

- **Routing Algorithm**: We will use a simple distance-based heuristic weighted by risk severity. This is computationally inexpensive and predictable, avoiding the black-box nature of deep reinforcement learning models.
- **State Management**: Officer locations and availability will be temporarily stored in the existing `sentinel.db` (SQLite) to avoid adding heavy new dependencies like Redis, keeping the architecture lean for edge deployments.
- **Real-time Notifications**: We will leverage the existing `/live` endpoints or add server-sent events (SSE) in a new `/dispatch` router to push notifications to Cockpit and FieldView.

## Risks / Trade-offs

- **Risk: Outdated officer locations** → Mitigation: Officers will need to periodically ping their locations. We will fallback to last known location with a clear timestamp warning in the UI if stale.
- **Trade-off: SQLite concurrency** → We are using SQLite, which might lock under high write concurrency for location updates. We will rely on WAL mode and connection pooling in FastAPI to mitigate this.
