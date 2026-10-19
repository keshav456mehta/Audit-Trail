# Day 6 Integration Test Notes (Sep 14)

## Bugs found and fixed
1. Stray "Audit-Trail" gitlink reintroduced via PR #23 (Praveen) - removed
2. Duplicate/unwired backend/shipmentQueries.js from PR #25 (V_Divyesh) - merged improved response format into correct backend/queries/shipmentQueries.js, deleted duplicate

## Manual test results
- POST /shipment/move: creates event correctly
- GET /shipment/:id (existing ID): returns { success, shipmentId, count, events }
- GET /shipment/:id (non-existent ID): returns success:true, count:0, empty events - no crash
- Multiple events for same aggregateId: returned in correct timestamp order
- POST /shipment/move with missing fields: returns clean 400 error, no crash

## Status
Schema + command route + query route + MongoDB confirmed fully connected end-to-end.
