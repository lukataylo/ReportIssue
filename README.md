# Fix It London

A React Native Expo app that helps Londoners report civic issues to the right authority — automatically.

Report potholes, fly-tipping, broken streetlights, noise, crime, TfL problems, obstructing e-scooters, and more. The app detects your borough from GPS, routes your report via API or email, and gives you an escalation path all the way to your local councillor and MP.

## How It Works

```
Open app → Set up profile (name + postcode, once)
         → Borough auto-detected from your location
         → Pick a category (22 issue types across 5 groups)
         → Fill in details: location on map, photo, description
         → Report submitted via best available method:
              1. Open311 API (FixMyStreet) — all 33 boroughs
              2. Pre-drafted email to the council
              3. Deep link to the authority's web form
         → Track your report with an escalation timeline:
              Stage 1: Submitted
              Stage 2: Escalation available (after X working days)
              Stage 3: Email your local councillor
              Stage 4: Email your MP
```

## Architecture

```
app/                          # Expo Router (file-based navigation)
  _layout.tsx                 # Root layout + profile gate modal
  (tabs)/                     # Bottom tab navigator
    index.tsx                 # Home: grouped category grid + borough banner
    my-reports.tsx            # Report list with escalation indicators
    map.tsx                   # London-wide map with report markers
  report/
    [categoryId].tsx          # Dynamic form (map, photo, category fields)
    success.tsx               # Confirmation + escalation preview
  report-detail/
    [reportId].tsx            # Escalation timeline + action buttons

constants/
  authorities.ts              # 33 boroughs + TfL, police, Thames Water, etc.
  boroughs.ts                 # Borough IDs, names, GSS codes
  categories.ts               # 22 categories with groups and extra fields
  bankHolidays.ts             # UK bank holidays for working day calc

services/
  reportService.ts            # Submission orchestration (API → email → deeplink)
  open311.ts                  # FixMyStreet Open311 v2 API client
  emailService.ts             # Email composition via mailto: links
  boroughDetection.ts         # GPS → postcodes.io → borough lookup
  escalationService.ts        # Stage progression + working day math
  representativeLookup.ts     # MP lookup via Parliament API
  profileService.ts           # User name/postcode storage
  storage.ts                  # AsyncStorage CRUD + data migration

types.ts                      # All TypeScript interfaces
```

## Supported Authorities

| Authority | Method | Coverage |
|-----------|--------|----------|
| All 33 London boroughs | Open311 API / Email | Potholes, fly-tipping, graffiti, paving, streetlights, bins, parks, noise, ASB, abandoned vehicles |
| Transport for London | Deep link | Traffic lights, bus stops, tube issues, bus lanes, cycle lanes, road markings |
| Metropolitan Police | Deep link | Crime reports, suspicious activity |
| City of London Police | Deep link | Crime in the Square Mile |
| Thames Water | Deep link | Flooding and drainage |
| StreetLink | Deep link | Rough sleeping |
| Lime | Deep link | Obstructing scooters, damaged hire bikes |
| Canary Wharf Group | Email | Estate management issues |
| Network Rail | Email / Deep link | Bridge and infrastructure issues |

## Quick Start

```bash
# Install dependencies
npm install

# Start Expo dev server
npm start

# Run on iOS simulator
npm run ios
```

## Build for App Store

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in and initialise
eas login
eas init

# Build for iOS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

Before submitting, update `eas.json` with your Apple Developer credentials and add a privacy policy URL to App Store Connect.

## Tech Stack

- **Expo SDK 51** + expo-router (file-based navigation)
- **React Native** 0.74 + TypeScript
- **react-native-maps** (Apple Maps on iOS)
- **expo-location** / **expo-image-picker** / **expo-web-browser**
- **AsyncStorage** for local persistence
- **postcodes.io** for borough detection (free, no key)
- **Parliament Members API** for MP lookup (free, no key)
- **FixMyStreet Open311 v2** for council report submission

## External APIs

| API | Purpose | Auth |
|-----|---------|------|
| `api.postcodes.io` | Reverse geocode GPS → borough + postcode | None |
| `members-api.parliament.uk` | MP name + email lookup by postcode | None |
| `fixmystreet.com/open311/v2` | Submit reports to councils | API key (optional) |

No backend server required. All data stored locally on device.

## License

MIT
