# Seraph

A local-first health tracking app for Android. Connects to a compatible BLE wearable, stores all data on-device, and runs its own calculations — no cloud, no subscription.

## What it does

- Connects to a wearable over Bluetooth LE
- Stores raw sensor data locally in SQLite
- Calculates HR, HRV, strain, sleep, recovery, and activity scores on-device
- Displays everything in a clean React Native app — sleep detail, workout history, trends, training load

All data stays on your phone.

## Repo structure

```
Seraph.App/        React Native (Expo) frontend — TypeScript
Seraph.Native/     Kotlin Multiplatform native layer — BLE, SQLDelight, sync, aggregation
Seraph.Core/       Pure KMP calculators — HR, HRV, Strain, Sleep, Activity, Recovery
```

## Architecture

```
Wearable
    │ BLE
    ▼
Seraph.Native (Kotlin)
    ├── ConnectionManager
    ├── SyncSession — pulls raw packets
    ├── WorkOrchestrator — sync + aggregation coordination
    ├── AggregationRunner — incremental HR, HRV, sleep, activity, training load
    └── SQLDelight DB
    │
    ▼  React Native bridge (NativeModules.SeraphModule)
    │
Seraph.App (TypeScript)
    ├── Drizzle ORM — reads the same SQLite file Native writes
    ├── React Query — all data access through hooks
    └── UI — screens, charts, detail views
```

Native writes. App reads. The bridge is thin — no business logic.

## Building

### Requirements

- Android Studio / JDK 17
- Node 18+
- Expo CLI

### Run

```bash
cd Seraph.App
npm install
npx expo start
```

### Android build

Always build from `Seraph.App/android/`:

```bash
cd Seraph.App/android
./gradlew assembleDebug
```

### Environment

Copy `.env.example` to `.env` and fill in values.

## Versioning

Semver from `0.0.0`. Four build tiers:

| Tier | Format | Trigger |
|------|--------|---------|
| Debug | — | Local only |
| Development | `X.Y.Z-dev-<feature>-<N>` | Push to `feature/*` |
| Beta | `X.Y.Z-beta.<N>` | Merge to `develop` |
| Release | `X.Y.Z` | Merge to `main` |

## Branches

```
feat/* ──→ develop ──→ main
```

## Platform

Android only for now. iOS support planned.

## License

Private.
