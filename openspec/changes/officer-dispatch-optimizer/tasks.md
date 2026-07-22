## 1. Backend Data & Models

- [ ] 1.1 Update `models.py` and `schemas.py` to include `Officer` availability state (`AVAILABLE`, `DISPATCHED`, `OFF-DUTY`) and location coordinates.
- [ ] 1.2 Create database schema update to persist the new fields in `sentinel.db`.

## 2. Dispatch Logic & API

- [ ] 2.1 Create `dispatch.py` router to handle real-time officer dispatch orders.
- [ ] 2.2 Implement algorithmic heuristic: calculate distance between available officers and a given hotspot, weighting by risk severity.
- [ ] 2.3 Expose an endpoint for command staff to confirm dispatch (`POST /dispatch/confirm`).
- [ ] 2.4 Include dispatch updates in existing live notification streams (or add SSE logic).

## 3. Frontend Cockpit & DistrictView

- [ ] 3.1 Update `Cockpit.tsx` to include an Officer Dispatch Management panel.
- [ ] 3.2 Fetch officer state from the backend and display available officers.
- [ ] 3.3 Add a "Confirm Dispatch" button inside the Predictive Risk alerts (in `DistrictView.tsx`).

## 4. FieldView Integration

- [ ] 4.1 Update `FieldView.tsx` to receive real-time dispatch orders from the backend.
- [ ] 4.2 Add an "Acknowledge" button for field officers to accept the dispatch.
- [ ] 4.3 Ensure the acknowledgement updates the officer's state back to `DISPATCHED` on the server.
