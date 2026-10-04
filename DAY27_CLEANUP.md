# Day 27: Repository Cleanup

## Changes

- Removed unused frontend components and stylesheet, the incomplete duplicate
  backend entry point, and the broken `testFold.js` helper.
- Removed the unused aurora theme styles.
- Moved backend review and test notes into `docs/backend/`.
- Renamed and cleaned up the Event Store verification note, retaining the schema
  reference and its verification limitations.

## Verification

- Confirmed the removed files have no imports or runtime references.
- `git diff --check` passed.
- Automated tests were not run as part of this cleanup.
