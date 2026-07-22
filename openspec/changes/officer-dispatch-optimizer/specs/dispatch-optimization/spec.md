## ADDED Requirements

### Requirement: Algorithmic Dispatch Recommendations
The system SHALL generate dispatch recommendations for available officers to predicted hotspots, optimizing for minimum distance and highest risk severity.

#### Scenario: High risk hotspot identified with nearby officer
- **WHEN** a new hotspot with severity > 8.0 is identified and an available officer is within 5km
- **THEN** the system recommends dispatching that officer to the hotspot with highest priority

#### Scenario: Command staff confirms dispatch
- **WHEN** command staff clicks "Confirm Dispatch" on a recommendation
- **THEN** the officer's status changes to "DISPATCHED" and a notification is sent to the FieldView

### Requirement: Officer Availability State
The system SHALL track whether an officer is AVAILABLE, DISPATCHED, or OFF-DUTY.

#### Scenario: Officer receives a dispatch order
- **WHEN** the officer acknowledges the dispatch on FieldView
- **THEN** the system updates their state in real-time on the Cockpit
