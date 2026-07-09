# Firestore Security Rules Setup

This app stores shared trip content under `trips/{tripId}/...` and user profile/preference data under `users/{uid}`.

## Shared Trip Paths

Authenticated users can create their own user profile and join the shared trip as `trips/{tripId}/members/{uid}`. Once a user is a member, they can read and write shared trip content:

```text
trips/{tripId}/documents/{documentId}
trips/{tripId}/flights/{flightId}
trips/{tripId}/hotels/{hotelId}
trips/{tripId}/expenses/{expenseId}
trips/{tripId}/budget/{budgetItemId}
trips/{tripId}/checklist/{checklistItemId}
trips/{tripId}/itinerary/{itemId}
trips/{tripId}/places/{placeId}
```

User-scoped legacy data under `users/{uid}/trips/{tripId}/...` remains readable/writable only by that user so the app can safely migrate old data without deleting it.

## Deploy via Firebase Console

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your Travel Trip project.
3. In the left sidebar, go to **Build -> Firestore Database**.
4. Open the **Rules** tab.
5. Copy the entire contents of `firestore.rules` from this repo.
6. Paste them into the rules editor, replacing any existing rules.
7. Click **Publish**.

## Verify After Publishing

1. Sign in to the app with an allowed Google account.
2. Confirm `users/{uid}` and `trips/osaka-kyoto-ine-kobe-2026/members/{uid}` are created.
3. Add or edit a flight, hotel, expense, checklist item, and itinerary item.
4. Confirm shared documents appear under `trips/osaka-kyoto-ine-kobe-2026/...`.
5. Sign in with another allowed account and confirm both users see the same shared trip data.
