# Oakland Animal Services API

--------------------------
# Access Levels

| Role | Level |
|------|-------|
| `volunteer` / `device` | 1 — Standard access |
| `staff` | 2 — Elevated access |
| `admin` | 3 — Full access |

All endpoints require a valid access token (`Authorization: Bearer <accessToken>`), except `/api/auth/*`.

--------------------------
# Types

### Pet
- `id: number`
- `name: string`
- `age: number`
- `birthdate: string | null`
- `sex: string`
- `species: string`
- `image: string | null`
- `description: string | null`
- `summary: string`
- `breed: string | null`
- `status: string | null`
- `rescueId: string | null`
- `availableDate: string | null`
- `otherNames: string | null`
- `distinguishingMarks: string | null`
- `generalAge: string | null`
- `generalSize: string | null`
- `colorDetails: string | null`
- `specialNeeds: string | null`

--------------------------
### LocationPet
- `id: number`
- `name: string`
- `summary: string`
- `image?: string | null`

--------------------------
### ObserverNote
- `id: number`
- `status?: string`
- `timestamp: string`
- `content: string`
- `author: string`
- `petId: number`

--------------------------
# End Points

## Auth

### POST `/api/auth/login`

- Access: Public
- Description: Log in with username and password. Sets an httpOnly `refreshToken` cookie valid for 30 days.
- Body JSON:
  - `username` (string, required)
  - `password` (string, required)
- Success: `200` with `{ accessToken: string, user: SafeUser }`
- Error: `400` for missing fields, `401` for invalid credentials

### POST `/api/auth/refresh`

- Access: Public (requires `refreshToken` cookie)
- Description: Silently obtain a new access token. Called automatically by the client when the access token expires.
- Success: `200` with `{ accessToken: string }`
- Error: `401` if refresh token is missing, expired, or invalidated (e.g. after password reset)

### POST `/api/auth/logout`

- Access: Public (requires `refreshToken` cookie)
- Description: Log out and invalidate the refresh token. Clears the cookie.
- Success: `200` with `{ success: true }`

### GET `/api/auth/me`

- Access: **Level 1** (volunteer, device, staff, admin)
- Description: Returns the currently authenticated user's info decoded from the access token. No DB lookup — use this to determine what UI to show.
- Success: `200` with `{ user: { userId, username, role, deviceName?, mustChangePassword } }`

### POST `/api/auth/change-password`

- Access: **Level 1** (volunteer, device, staff) — not available for admin (managed via `.env`)
- Description: Change the current user's password. Invalidates all active sessions and requires re-login.
- Body JSON:
  - `currentPassword` (string, required)
  - `newPassword` (string, required)
- Success: `200` with `{ success: true }`
- Error: `400` if fields missing or user is admin, `401` if current password is incorrect

--------------------------
## Users

### POST `/api/users`

- Access: **Level 2** (staff, admin) — staff can only create `volunteer` with `expiresAt` required
- Description: Create a new user. Password is temporary; user must change it on first login.
- Body JSON:
  - `username` (string, required)
  - `password` (string, required)
  - `role` (`staff` | `volunteer` | `device`, required)
  - `deviceName` (string, required if role is `device`)
  - `expiresAt` (string, required if role is `volunteer`) — ISO date string
- Success: `201` with `{ success: true, user: SafeUser }`
- Error: `400` for validation failure, `403` if staff tries to create non-volunteer, `409` if username taken

### GET `/api/users`

- Access: **Level 3** (admin only)
- Description: List all users.
- Success: `200` with `{ success: true, users: SafeUser[] }`

### PUT `/api/users/:userId/password`

- Access: **Level 2** (staff, admin) — staff can only reset volunteers
- Description: Reset a user's password. Sets `mustChangePassword` to true and logs out all active sessions for that user.
- Body JSON:
  - `password` (string, required) — new temporary password
- Success: `200` with `{ success: true }`
- Error: `400` for missing password, `403` if staff tries to reset non-volunteer, `404` if user not found

### PATCH `/api/users/:userId`

- Access: **Level 2** (staff, admin) — staff can only update volunteers
- Description: Update a user's details (e.g. extend volunteer expiry date).
- Body JSON (all optional):
  - `expiresAt` (string) — new expiry date ISO string
- Success: `200` with `{ success: true, user: SafeUser }`
- Error: `403` if staff tries to update non-volunteer, `404` if user not found

### DELETE `/api/users/:userId`

- Access: **Level 2** (staff, admin) — staff can only delete volunteers
- Description: Delete a user and invalidate all their active sessions.
- Success: `200` with `{ success: true }`
- Error: `403` if staff tries to delete non-volunteer, `404` if user not found

--------------------------
## Pets

### GET `/api/pets/:petId`

- Access: **Level 1** (volunteer, device, staff, admin)
- Description: Get a single pet by petId.
- Path param:
  - `petId` (number, required)
- Success: `200` with `{ success: true, pet: Pet }`
- Error: `400` for invalid petId, `404` if not found

### GET `/api/location/:petType/:location`

- Access: **Level 1** (volunteer, device, staff, admin)
- Description: Lookup pet location ID by species and location (dog/cat).
- Path params:
  - `petType` (`dog` or `cat`, required)
  - `location` (string, required)
    - Spaces in location name should use `-` to seperate ex: `holding-a:2`
- Query params:
  - `refresh` (boolean, optional) - If true, bypass cache and fetch fresh data
- Success: `200` with `{ success: true, pets: LocationPet[] }`
- Error: `400` for invalid petType/location or missing params, `404` if not found

Example:
```json
{
  "success": true,
  "pets": [
    {
      "id": 22254131,
      "name": "Nala",
      "summary": "I am at Oakland Animal Services in kennel E:1",
      "image": "https://example.com/pet.jpg"
    }
  ]
}
```


## ObserverNotes

### GET `/api/observer-notes?limit=10&page=1`

- Access: **Level 1** (volunteer, device, staff, admin)
- Description: List observer notes with optional pagination.
- Query params:
  - `limit` (number, optional)
  - `page` (number, optional)
- Success: `200` with `{ success: true, observerNotes: ObserverNote[] }`
- Error: `400` for invalid query values

Example:
```json
{
  "success": true,
  "observerNotes": [
    {
      "id": 1,
      "status": "active",
      "timestamp": "2024-06-01T10:00:00.000Z",
      "content": "Buddy has been very energetic today",
      "author": "Dr. A",
      "petId": 1
    },
    {
      "id": 2,
      "status": "active",
      "timestamp": "2024-06-01T10:00:00.000Z",
      "content": "Buddy showed signs of limping",
      "author": "Dr. Smith",
      "petId": 1
    }
  ]
}
```

### GET `/api/pets/:petId/observer-notes`

- Access: **Level 1** (volunteer, device, staff, admin)
- Description: List observer notes for one pet.
- Path param:
  - `petId` (number, required)
- Success: `200` with `{ success: true, observerNotes: ObserverNote[] }`
- Error: `400` if `petId` invalid

### POST `/api/observer-notes`

- Access: **Level 1** (volunteer, device, staff, admin)
- Description: Add a new observer note. The `author` field is resolved server-side from the authenticated user — device accounts must supply a name.
- Body JSON:
  - `content` (string, required)
  - `petId` (number, required)
  - `author` (string, required if role is `device`, min 2 characters) — the person using the shared device. Ignored for all other roles.
  - `title` (string, optional)
- Author resolution:
  - `staff` / `volunteer`: author set to `username`
  - `device`: author set to `"Author (DeviceName)"` e.g. `"Jane (DogIpad1)"`
- Success: `200` with `{ success: true, message: string, observerNote: ObserverNote }`
- Error: `400` for validation failure or device account missing/short author

### DELETE `/api/observer-notes/:id`

- Access: **Level 1** (volunteer, device, staff, admin)
- Description: Delete an observer note by id.
- Path param:
  - `id` (number, required)
- Success: `200` with `{ success: true, message: "Observer note deleted" }`
- Error: `400` for invalid id, `404` if not found

### PATCH `/api/observer-notes/:id/status`

- Access: **Level 2** (staff, admin)
- Description: Update status for an observer note.
- Path param:
  - `id` (number, required)
- Body JSON:
  - `status` (string, required)
- Success: `200` with `{ success: true, message: "Observer note status updated" }`
- Error: `400` for invalid id/status, `404` if not found

### DELETE `/api/pets/:petId/observer-notes`

- Access: **Level 1** (volunteer, device, staff, admin)
- Description: Delete all observer notes for a given pet.
- Path param:
  - `petId` (number, required)
- Success: `200` with `{ success: true, message: "Observer notes deleted for pet" }`
- Error: `400` for invalid id, `404` if no notes exist for that pet

## Summarizer

### POST `/api/pets/:petId/behavior-notes/summarize`

- Access: **Level 1** (volunteer, device, staff, admin)
- Description: Summarize behavior notes for a specific pet into concise text.
- Path params:
  - `petId` (number, required)
- Body JSON:
  - `prompt` (string, optional) - Custom instructions for summarization; falls back to default.
- Success: `200` with `{ success: true, summary: string }`
- Error:
  - `400` for invalid `petId`
  - `500` if summarization service fails

Example:
```json
{
  "success": true,
  "summary": "Marley has been friendly with staff and shows mild anxiety around loud noises; weekly crate desensitization is recommended."
}
```

## Search

### POST `/api/search`

- Access: **Level 1** (volunteer, device, staff, admin)
- Description: Filter all observer notes by query text; if `petId` is provided, filter by pet.
- Body JSON:
  - `query` (string, required)
    - The search query text.
  - `petId` (number, optional)
  - `nameToExclude` (string, optional)
  - `maxResults` (number, optional)
  - `page` (number, optional)
- Success: `200` with:
  - `{ success: true, query: string, results: SimilarNoteResult[], resultCount: number }`
- Error: `400` if required fields are missing or invalid

Example:
```json
{
  "success": true,
  "query": "limping",
  "results": [
    {
      "observerNote": {
        "id": 2,
        "status": "active",
        "timestamp": "2024-06-01T10:00:00.000Z",
        "content": "Buddy showed signs of limping",
        "author": "Dr. Smith",
        "petId": 1
      },
      "matchCount": 2,
      "matchedKeywords": [
        {
          "keyword": "limping",
          "positions": [{ "start": 24, "end": 31 }]
        }
      ],
      "highlightedContent": "Buddy showed signs of <b>limping</b>"
    }
  ],
  "resultCount": 1
}
```

## Activity Log

### GET `/api/activity`

- Access: **Level 2** (staff, admin)
- Description: Paginated activity feed of note and auth events. Staff can only query note tags; admin can query all tags including `authEvent`.
- Query params:
  - `tags` (string, optional) — comma-separated: `behaviorNote`, `observerNote`, `authEvent`
  - `actor` (string, optional) — filter by username
  - `action` (string, optional) — filter by action name
  - `from` (string, optional) — ISO date string, inclusive lower bound on timestamp
  - `to` (string, optional) — ISO date string, inclusive upper bound on timestamp
  - `limit` (number, optional, default 20)
  - `page` (number, optional, default 1)
- Success: `200` with `{ success: true, logs: ActivityLog[] }`
- Error: `400` for invalid tags/pagination, `403` if staff requests `authEvent` tag

#### ActivityLog object
- `logId: string` — UUID
- `date: string` — YYYY-MM-DD
- `timestamp: string` — ISO string (newest first)
- `tag: "behaviorNote" | "observerNote" | "authEvent"`
- `actor: string` — username of who performed the action
- `action: string`
- `jsonData?: object` — event-specific data

#### Actions logged per tag
| Tag | Action | jsonData fields |
|-----|--------|----------------|
| `behaviorNote` | `CREATED` | `petId`, `content` |
| `behaviorNote` | `DELETED` | `noteId` |
| `behaviorNote` | `BULK_DELETED` | `petId` |
| `observerNote` | `CREATED` | `petId`, `content` |
| `observerNote` | `DELETED` | `noteId` |
| `observerNote` | `BULK_DELETED` | `petId` |
| `observerNote` | `STATUS_CHANGED` | `noteId`, `status` |
| `authEvent` | `PASSWORD_CHANGED` | — |
| `authEvent` | `USER_CREATED` | `username`, `role` |
| `authEvent` | `USER_UPDATED` | `targetUserId`, `expiresAt` |
| `authEvent` | `USER_DELETED` | `targetUserId`, `targetUsername`, `role` |

--------------------------
## Behavior Notes

### GET `/api/behavior-notes?limit=10&page=1`

- Access: **Level 1** (volunteer, device, staff, admin)
- Description: List behavior notes with optional pagination.
- Query params:
  - `limit` (number, optional)
  - `page` (number, optional)
- Success: `200` with `{ success: true, behaviorNotes: BehaviorNote[] }`
- Error: `400` for invalid query values

### GET `/api/pets/:petId/behavior-notes`

- Access: **Level 1** (volunteer, device, staff, admin)
- Description: List behavior notes for a single pet.
- Path params:
  - `petId` (number, required)
- Success: `200` with `{ success: true, behaviorNotes: BehaviorNote[] }`
- Error: `400` if `petId` is invalid

### POST `/api/behavior-notes`

- Access: **Level 1** (volunteer, device, staff, admin)
- Description: Add a new behavior note. The `author` field is resolved server-side from the authenticated user — device accounts must supply a name.
- Body JSON:
  - `content` (string, required)
  - `petId` (number, required)
  - `author` (string, required if role is `device`, min 2 characters) — the person using the shared device. Ignored for all other roles.
  - `title` (string, optional)
- Author resolution:
  - `staff` / `volunteer`: author set to `username`
  - `device`: author set to `"Author (DeviceName)"` e.g. `"Jane (DogIpad1)"`
- Success: `200` with `{ success: true, message: string, behaviorNote: BehaviorNote }`
- Error: `400` for validation failure or device account missing/short author

### DELETE `/api/behavior-notes/:id`

- Access: **Level 1** (volunteer, device, staff, admin)
- Description: Delete a behavior note by id.
- Path params:
  - `id` (number, required)
- Success: `200` with `{ success: true, message: "Behavior note deleted" }`
- Error: `400` for invalid id, `404` if not found

### DELETE `/api/pets/:petId/behavior-notes`

- Access: **Level 1** (volunteer, device, staff, admin)
- Description: Delete all behavior notes for a given pet.
- Path params:
  - `petId` (number, required)
- Success: `200` with `{ success: true, message: "Behavior notes deleted for pet" }`
- Error: `400` for invalid id, `404` if no notes exist for that pet

