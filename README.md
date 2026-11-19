# Coy Discover

Swipe-based "Discover" tab for the Coy SDE Intern assignment. A placeholder **Home** tab sits beside a working **Discover** tab. Part A answers are in [PART_A.md](./PART_A.md).

## Run
```bash
npm install
npm run dev      # http://localhost:3000 (open in mobile view)
npm test         # unit tests for the swipe/match logic
```
Data lives in `data/db.json` (created and seeded on first request). "Reset demo data" on the empty state re-seeds it.

## Stack
Next.js 14 (App Router, JS), API routes, JSON-file persistence, no extra UI libraries. Drag gestures use plain pointer events.

## API
| Route | Description |
|---|---|
| `GET /api/feed` | Profiles not yet swiped on |
| `POST /api/swipe` | Body `{ profileId, direction: "like" \| "pass" }` returns `{ matched, profile, duplicate }` |
| `GET /api/matches` | Mutual matches only |
| `POST /api/reset` | Re-seed demo data |

## Design decisions
- **Privacy is structural.** The seeded "already liked you" ids sit in a separate `likesMe` list. No endpoint returns it, and profile objects have no "liked you" field. The client only learns about a like when `/swipe` reports a mutual match. A test checks the feed never leaks it.
- **No repeats.** The feed is every profile minus those in `swipes`, so a swiped profile can't come back, even after a reload.
- **Idempotent swipes.** Re-swiping a profile returns the original outcome (`duplicate: true`) and can't flip a pass into a match.
- **Matches are only created server-side**, when a `like` hits a profile in `likesMe`.
- **Seed data:** 32 profiles, 8 of whom already like you. Photos come from pravatar.cc with a colored-initial fallback when offline.
- **Persistence caveat:** a JSON file suits a local demo. On serverless hosts like Vercel the filesystem isn't durable, so I'd move to SQLite/Postgres there.

## Tests
`tests/store.test.mjs` covers seeding, no-leak, no-repeat, match / no-match / pass, idempotency, persistence across reloads, and input validation.
