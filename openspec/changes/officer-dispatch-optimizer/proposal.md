## Why

Currently, SENTINEL provides Predictive Risk (hotspots) and Field Alerts, but there is a gap in translating these hotspots into actionable operational logistics. An automated Officer Dispatch Optimizer will allow command staff to algorithmically route and deploy patrol units to high-risk zones efficiently, closing the loop between intelligence and action.

## What Changes

- Add an interactive Dispatch management panel in the Cockpit and DistrictView.
- Introduce algorithmic optimization logic in the backend (using FastAPI) to assign available officer units to predicted hotspots based on proximity, availability, and risk severity.
- Broadcast dispatch commands and push real-time alerts to the FieldView for officers on the ground.

## Capabilities

### New Capabilities
- `dispatch-optimization`: Automated recommendation and assignment of patrol units to predicted crime hotspots.

### Modified Capabilities
- (None)

## Impact

- **Backend**: New API endpoints in a `dispatch` router and enhancements to `models.py` / `schemas.py` to support officer availability state and dispatch orders.
- **Frontend**: New UI components in `src/components/` and updates to `Cockpit.tsx`, `DistrictView.tsx`, and `FieldView.tsx` to handle dispatch assignments.
