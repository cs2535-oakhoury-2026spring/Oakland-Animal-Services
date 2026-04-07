# Oakland Animal Services API

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
- `locationSummary: string`
- `breed: string | null`
- `status: string | null`
- `arn: string | null`
- `availableDate: string | null`
- `handlerLevel: string | null`
- `dogDogCategory: string | null`
- `generalAge: string | null`
- `generalSize: string | null`
- `colorDetails: string | null`
- `handlingDescription: string | null`

--------------------------
### LocationPet
- `id: number`
- `name: string`
- `locationSummary: string`
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


## Pets

### GET `/api/pets/:petId`

- Description: Get a single pet by petId.
- Path param:
  - `petId` (number, required)
- Success: `200` with `{ success: true, pet: Pet }`
- Error: `400` for invalid petId, `404` if not found

### GET `/api/location/:petType/:location`

- Description: Lookup pet location ID by species and location (dog/cat).
- Path params:
  - `petType` (`dog` or `cat`, required)
  - `location` (string, required)
    - Spaces in location name should use `-` to seperate ex: `holding-a:2`
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
      "locationSummary": "I am at Oakland Animal Services in kennel E:1",
      "image": "https://example.com/pet.jpg"
    }
  ]
}
```


## ObserverNotes

### GET `/api/observer-notes?limit=10&page=1`

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

- Description: List observer notes for one pet.
- Path param:
  - `petId` (number, required)
- Success: `200` with `{ success: true, observerNotes: ObserverNote[] }`
- Error: `400` if `petId` invalid

### POST `/api/observer-notes`

- Description: Add a new observer note.
- Body JSON:
  - `content` (string, required)
  - `author` (string, required)
  - `petId` (number, required)
- Success: `200` with `{ success: true, message: string, observerNote: ObserverNote }`
- Error: `400` for validation failure

### DELETE `/api/observer-notes/:id`

- Description: Delete an observer note by id.
- Path param:
  - `id` (number, required)
- Success: `200` with `{ success: true, message: "Observer note deleted" }`
- Error: `400` for invalid id, `404` if not found

### PATCH `/api/observer-notes/:id/status`

- Description: Update status for an observer note.
- Path param:
  - `id` (number, required)
- Body JSON:
  - `status` (string, required)
- Success: `200` with `{ success: true, message: "Observer note status updated" }`
- Error: `400` for invalid id/status, `404` if not found

### DELETE `/api/pets/:petId/observer-notes`

- Description: Delete all observer notes for a given pet.
- Path param:
  - `petId` (number, required)
- Success: `200` with `{ success: true, message: "Observer notes deleted for pet" }`
- Error: `400` for invalid id, `404` if no notes exist for that pet

## Summarizer

### POST `/api/pets/:petId/behavior-notes/summarize`

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

## Behavior Notes

### GET `/api/behavior-notes?limit=10&page=1`

- Description: List behavior notes with optional pagination.
- Query params:
  - `limit` (number, optional)
  - `page` (number, optional)
- Success: `200` with `{ success: true, behaviorNotes: BehaviorNote[] }`
- Error: `400` for invalid query values

### GET `/api/pets/:petId/behavior-notes`

- Description: List behavior notes for a single pet.
- Path params:
  - `petId` (number, required)
- Success: `200` with `{ success: true, behaviorNotes: BehaviorNote[] }`
- Error: `400` if `petId` is invalid

### POST `/api/behavior-notes`

- Description: Add a new behavior note.
- Body JSON:
  - `content` (string, required)
  - `author` (string, required)
  - `petId` (number, required)
- Success: `200` with `{ success: true, message: string, behaviorNote: BehaviorNote }`
- Error: `400` for validation failure

### DELETE `/api/behavior-notes/:id`

- Description: Delete a behavior note by id.
- Path params:
  - `id` (number, required)
- Success: `200` with `{ success: true, message: "Behavior note deleted" }`
- Error: `400` for invalid id, `404` if not found

### DELETE `/api/pets/:petId/behavior-notes`

- Description: Delete all behavior notes for a given pet.
- Path params:
  - `petId` (number, required)
- Success: `200` with `{ success: true, message: "Behavior notes deleted for pet" }`
- Error: `400` for invalid id, `404` if no notes exist for that pet

