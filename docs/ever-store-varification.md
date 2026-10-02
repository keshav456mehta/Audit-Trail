Haan, screenshot se clear hai — tum Dependency graph page par ho, Contributors par nahi.

Left side mein Contributors likha hua hai, wahi click karo:

👉 Contributors (left menu, sabse upar)

Uske baad tumhe project ke contributors aur unka contribution graph dikhna chahiye.

Agar Contributors click karne ke baad bhi tumhara naam/commit count nahi dikhe, uska screenshot bhej dena, main bataunga next kya check karna hai.

Today 1:05 PM
day 13,14, ke liye md file create kare

Day 13–14 ki MD file create kar di hai. Isme version increment, duplicate detection, expected behavior aur verification status documented hai.

Download day-13-14-concurrency-notes.md

Repo mein rakhna ho to recommended path:

docs/day-13-14-concurrency-notes.md

Phir commit:

& 'C:\Program Files\Git\cmd\git.exe' add docs/day-13-14-concurrency-notes.md
& 'C:\Program Files\Git\cmd\git.exe' commit -m "docs: add Day 13-14 concurrency notes"
& 'C:\Program Files\Git\cmd\git.exe' push origin Rakesh

day-13-14-concurrency-notes.md
Document
& 'C:\Program Files\Git\cmd\git.exe' add docs/day-13-14-concurrency-notes.md
>> & 'C:\Program Files\Git\cmd\git.exe' commit -m "docs: add Day 13-14 concurrency notes"
>> & 'C:\Program Files\Git\cmd\git.exe' push origin Rakesh
fatal: pathspec 'docs/day-13-14-concurrency-notes.md' did not match any files
warning: unable to find all commit-graph files
On branch Rakesh
Your branch is up to date with 'origin/Rakesh'.

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        docs/ever-store-varification.md

nothing added to commit but untracked files present (use "git add" to track)
Everything up-to-date
PS C:\Users\rakes\OneDrive\Desktop\Audit Trail\Audit-Trail> 

Samajh gaya. Error ka reason clear hai:

docs/day-13-14-concurrency-notes.md local repo mein file nahi hai

Tumhare repo mein ye untracked file hai:

docs/ever-store-varification.md
Isliye commit nahi hua.
Everything up-to-date ka matlab koi naya commit push nahi hua.

Abhi rename/commit mat karo jab tak us file ka content check na kar lein.

Ye command chalao:

Get-Content "docs\ever-store-varification.md"

Uska output bhejo. Main check karke bataunga ki isi file ko Day 13–14 documentation ke liye use karna hai ya nayi MD file banani hai.

Day 15–16 — Mid Review and Schema Compatibility
Day 15 (Sep 23) — Mid Review Support
Objective

Be prepared to explain the Event Store schema during the mid review.

Schema Fields
aggregateId — identifies the shipment/entity associated with the event.
eventType — identifies the type of event and is restricted to the agreed event types.
payload — stores the event-specific data.
timestamp — records when the event occurred.
version — tracks the event version for the aggregate.
Validation

The schema requires the key Event Store fields and validates eventType against the supported event types.

Indexes

The schema includes indexes on:

eventSchema.index({ aggregateId: 1 });
eventSchema.index({ timestamp: 1 });

These indexes support efficient aggregate-based and timestamp-based event queries.

Day 16 (Sep 24) — V. Divyesh Review
Objective

Review V. Divyesh's query/fold and command logic to confirm that it reads and uses the Event Store schema correctly.

Query Review

The shipment query retrieves events using:

const events = await EventStore.find({
    aggregateId: req.params.id
}).sort({ timestamp: 1 });

The query correctly uses aggregateId to retrieve events for a shipment and sorts them by timestamp.

Command Review

The shipment command flow uses the Event Store fields as follows:

aggregateId — used for shipment identification and event lookup.
eventType — validated against the schema enum.
payload — stored with the event and used during duplicate detection.
timestamp — stored when the event is created.
version — incremented from the latest event for the same aggregate.
Review Result

The reviewed query and command logic are compatible with the Event Store schema.

No schema mismatch was identified during this review.

# Day 19 — Full Regression Test

## Objective

Perform a full regression test to confirm that the existing shipment event-sourcing functionality continues to work after the Event Store schema, validation, versioning, and duplicate-event changes.

## Regression Test

The existing shipment command test suite was executed using:

```bash
node --test backend/test/shipmentCommands.test.js


# Day 20 — Integration Testing Support

## Objective

Support Keshav's integration testing and identify or fix any Event Store schema issues that appear during the integration flow.

## Integration Flow

The expected end-to-end flow is:

Frontend  
↓  
`POST /move`  
↓  
EventStore  
↓  
`GET /:id`  
↓  
Timeline

## Integration Checklist

- Confirm integration testing timing with Keshav.
- Keep the backend current and ready for testing.
- Verify the `POST /move` request during the integration test.
- Confirm that events reach the EventStore with the expected shipment ID and payload.
- Monitor backend logs during the integration walkthrough.
- If an issue is found, reproduce it and identify whether it is related to the route, validation, or event write.
- Apply the smallest safe fix for any confirmed issue.
- Re-run the failing integration step after the fix.
- Confirm that the newly written event appears correctly in the shipment timeline.

## Schema Fields to Verify

The integration flow should remain compatible with the Event Store fields:

- `aggregateId`
- `eventType`
- `payload`
- `timestamp`
- `version`

## Day 20 Result

The latest `main` branch was merged into the `Rakesh` branch successfully.

The working tree was verified as clean after removing an unintended untracked file.

No Event Store schema issue was identified during the current preparation/check.

Further fixes should only be made if an actual integration-test failure is observed.

## Status

Day 20 integration-testing preparation is complete.