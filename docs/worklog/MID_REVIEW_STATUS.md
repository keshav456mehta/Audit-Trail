# Mid Review Status (Day 15 - Sep 23)

## Architecture
CQRS pattern - separate command/query routes, event-sourced MongoDB store, React/Vite frontend.

## Confirmed working end-to-end
- POST /shipment/move: creates events, auto-incrementing version, duplicate detection (5s window), event type validation
- GET /shipment/:id: returns full event history + computed currentState (folded from event stream)
- Frontend: SearchBar -> live backend fetch -> color-coded Timeline UI
- Loading and error states handled gracefully
- Tested across multiple independent shipment IDs (shipA, shipB) with different lifecycle stages, verified live in browser

## Team contributions live in the app
- Rakesh: schema hardening, indexing
- Vinay: command router, event store integration
- V. Divyesh: query route, current-state fold/projection logic
- Praveen: frontend components and styling
- Keshav: full-stack wiring, integration testing, bug fixes, daily QA

## Status
On track for Mid Review. No blockers.
