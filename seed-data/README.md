# Seed data (import only)

JSON snapshots under `processes/` and `dictionaries/` are **not** read by the running API. Use them only with:

- `npm run db:seed-mongo` → [`scripts/seedMongoFromJson.mjs`](../scripts/seedMongoFromJson.mjs)

Runtime data lives in **MongoDB** (`MONGODB_URI`).
