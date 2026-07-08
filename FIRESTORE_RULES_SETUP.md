# Firestore Security Rules Setup

This app stores per-user trip data under `users/{uid}/trips/{tripId}/...`. Each signed-in user may only read and write their own documents.

## Files

- `firestore.rules` — security rules source file in this repository

## Deploy via Firebase Console

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your Travel Trip project.
3. In the left sidebar, go to **Build → Firestore Database**.
4. Open the **Rules** tab.
5. Copy the entire contents of `firestore.rules` from this repo.
6. Paste them into the rules editor, replacing any existing rules.
7. Click **Publish**.

## What the rules do

```text
users/{userId}/...
```

- **Allowed:** authenticated users reading or writing documents under their own `users/{uid}` path
- **Denied:** all other paths and all unauthenticated access

This covers nested trip sync documents such as:

```text
users/{uid}/trips/{tripId}/settings/data
users/{uid}/trips/{tripId}/favorites/data
users/{uid}/trips/{tripId}/visited/data
users/{uid}/trips/{tripId}/checklist/data
users/{uid}/trips/{tripId}/memories/data
users/{uid}/trips/{tripId}/budget/data
```

## Verify after publishing

1. Sign in to the app with an allowed Google account.
2. Change a favorite, checklist item, or journal note.
3. In Firestore Database → **Data**, confirm documents appear under `users/{your-uid}/trips/...`.
4. Sign in with a different account and confirm you cannot read another user's documents.

## Optional: deploy with Firebase CLI

If you use the Firebase CLI locally:

```bash
firebase init firestore
# Select your project and use firestore.rules from this repo

firebase deploy --only firestore:rules
```

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `permission-denied` in the app | Rules not published, or user is not signed in |
| No cloud data after login | First sync runs on login; check browser network tab for Firestore writes |
| Data visible under wrong uid | Rules not published; republish `firestore.rules` |

The app keeps working offline via localStorage when Firestore is unavailable.
