# Developer's Guide — Oakland Animal Services

This guide helps developers understand the codebase and contribute effectively to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Codebase Overview](#codebase-overview)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Adding Features](#adding-features)
- [Code Conventions](#code-conventions)
- [Common Tasks](#common-tasks)
- [Testing](#testing)
- [Debugging](#debugging)
- [Areas for Improvement](#areas-for-improvement)

---

## Getting Started

### Prerequisites

- **Node.js** v18+ — [nodejs.org](https://nodejs.org)
- **npm** v9+ (comes with Node.js)
- **Docker Desktop** — [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)

Verify installations:
```bash
node --version    # v18+
npm --version     # v9+
docker --version  # 20+
```

### Initial Setup

**1. Clone the repository**
```bash
git clone https://github.com/cs2535-oakhoury-2026spring/Oakland-Animal-Services
cd Oakland-Animal-Services
```

**2. Install dependencies**
```bash
# Backend dependencies
npm install

# Frontend dependencies
cd frontend && npm install && cd ..
```

**3. Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and set **minimum required values**:
- `JWT_SECRET` — any long random string (e.g., `myRandomSecret123!`)
- `ADMIN_USER` — username for login (e.g., `admin`)
- `ADMIN_PASS` — password for login (e.g., `password123`)

**Other values** :
- `LLM_API_KEY` — OpenAI API key (for note summarization)
- `RESCUE_GROUPS_ENDPOINT` — RescueGroups API endpoint (to fetch real pet data)
- `RESCUE_GROUPS_BEARER` — RescueGroups API token

Local DynamoDB defaults are already set in `.env.example` and work out-of-the-box.

See [Environment Variables](../README.md#environment-variables) in the README for detailed descriptions of all variables.

**4. Start Docker services**
```bash
docker-compose up -d
```

This starts DynamoDB on port 8000 and DynamoDB Admin UI on port 8001.

**5. Initialize database**
```bash
npm run create-tables
```

**6. Start the development servers**
```bash
npm run dev
```

This runs backend + frontend concurrently:
- **Backend** → http://localhost:3001 (Express API)
- **Frontend** → http://localhost:3000 (React dev server)

**7. Open in browser**
Navigate to http://localhost:3000 and log in with credentials from `.env`

**8. Verify everything works**
- See a login screen → ✅ frontend is running
- Log in successfully → ✅ backend is running and connected to database
- See list of animals → ✅ RescueGroups API is (optionally) connected

---

## Codebase Overview

### Directory Structure

```
src/                          Backend (TypeScript)
├── config/                   DynamoDB client setup
├── controllers/              HTTP request handlers
├── middleware/               Authentication, role-based access
├── models/                   Zod schemas for validation
├── routes/                   Express router definitions
├── services/                 Business logic (notes, auth, summarization)
├── types/                    TypeScript interfaces
├── utils/                    Helpers (logging, fuzzy matching)
├── db/
│   ├── repositories/         Data access layer (DynamoDB)
│   ├── rescueGroups/         RescueGroups API integration
│   └── scripts/              Database setup scripts
└── server.ts                 Express app entry point

frontend/src/                 React frontend
├── screens/                  Full-page route components
├── components/               Reusable UI components
├── styles/                   CSS stylesheets
├── utils/                    Helpers (search, dates)
├── api.js                    Centralized API client
├── hooks.js                  Custom React hooks
├── constants.js              App constants
└── App.jsx                   Root component + routing
```

---

## Backend Architecture

### Request Flow

```
HTTP Request
    ↓
Express Middleware (auth, rate-limiting)
    ↓
Route Handler (src/routes/*)
    ↓
Controller (src/controllers/*)
    ↓
Service (src/services/*) ← optional, only if business logic needed
    ↓
DB (src/db/*)
    ↓
DynamoDB / RescueGroups API
```

Controllers may call **services** (for complex logic) or **DB** (for simple queries) directly.

### Layers Explained

**Routes** (`src/routes/`)
- Define HTTP endpoints and middleware chain
- Example: `POST /api/behavior-notes` → authenticate → rate limit → controller
- Minimal logic; mostly wiring

**Controllers** (`src/controllers/`)
- Parse request params/body
- Call services or repositories
- Handle errors and send responses
- Keep thin; delegate business logic

**Services** (`src/services/`) — Optional
- Complex business logic (note deduplication, summarization, auth flows)
- Orchestrate multiple repositories
- No Express dependencies (testable in isolation)
- **Use when:** logic is reused, complex, or involves multiple data sources
- **Skip when:** simple CRUD operation with one repository

**Repositories** (`src/db/repositories/`)
- Data access abstraction
- Implement `NoteRepository` or `PetRepository` interfaces
- Handle DynamoDB queries or RescueGroups API calls
- Controllers can call repositories directly for simple operations

### Authentication Flow

1. **Login** → `POST /api/auth/login`
2. Controller validates credentials against `.env` or DynamoDB
3. Issues short-lived **access token** (15 min) + long-lived **refresh token** (30 days in httpOnly cookie)
4. Frontend stores access token in memory
5. **On 401 response** → frontend auto-refreshes token via `POST /api/auth/refresh`
6. Expired refresh token → user logs out

See [ADR-004](adr/ADR-004.md) for token storage strategy.

### Rate Limiting

The backend enforces rate limits to prevent abuse:

**General Rate Limit**
- **300 requests per minute** per user or IP
- Applied to all endpoints
- **Exception:** DELETE requests are not rate-limited (allows bulk deletion)
- Returns 429 error when limit exceeded

**Summarization Rate Limit**
- **6 requests per minute** per user or IP
- Stricter limit due to OpenAI API costs
- Applied to: `POST /api/pets/:petId/behavior-notes/summarize`
- Returns 429 error when exceeded

Rate limits are applied via `express-rate-limit` middleware. To adjust limits, edit:
- `src/server.ts` — general rate limiter
- `src/routes/summarize.ts` — summarization rate limiter

### Key Services

**Authentication** (`src/services/auth.ts`)
- Login, logout, token validation
- Admin account from `.env`

**Notes** (`src/services/notes.ts`)
- Create, list, delete notes
- Duplicate detection using Levenshtein distance (see [ADR-002](adr/ADR-002.md))

**Summarization** (`src/services/summarizeService.ts`)
- Implements `LLMClient` interface
- Fetches behavior + observer notes, sends to OpenAI
- Easy to swap providers (see [README Maintenance](../README.md#switching-ai-models))

---

## Frontend Architecture

### Component Structure

**Screens** — Full-page components tied to routes
- `LoginScreen.jsx` — Login form
- `PetDetailsScreen.jsx` — Pet profile + notes
- `AdminDashboard.jsx` — User management

**Components** — Reusable UI pieces
- `NoteList.jsx` — Display notes with filters
- `NoteForm.jsx` — Create/edit notes
- `LoginForm.jsx` — Login UI

### State Management

- **Component state** (`useState`) — local form input, UI toggles
- **Custom hooks** (`src/hooks.js`) — shared logic across components
- **localStorage** — persist user preferences (e.g., selected pet type)
- **API caching** — frontend caches pet data for 1 minute

### API Client

`src/api.js` — Centralized HTTP client with:
- Automatic token refresh on 401
- Bearer token in Authorization header
- Error handling and logging

Usage:
```javascript
import api from '../api.js';
const notes = await api.get('/api/behavior-notes');
```

---

## Adding Features

### Adding a New API Endpoint

**Goal:** Let staff export notes as PDF

**Step 1: Define the route** (`src/routes/notes.ts`)
```typescript
router.get(
  "/api/pets/:petId/notes/export",
  authenticate,
  requireStaff,
  exportNotesAsPdf
);
```

**Step 2: Create the controller** (`src/controllers/notesController.ts`)
```typescript
export const exportNotesAsPdf = async (req: Request, res: Response) => {
  const petId = parseInt(req.params.petId);
  
  try {
    const notes = await getNotesByPetId(petId);
    const pdf = generatePdf(notes);
    
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: "Export failed" });
  }
};
```

**Step 3: Add service logic if needed** (`src/services/notes.ts`)
```typescript
export const generatePdf = (notes: Note[]): Buffer => {
  // Use an pdf library
};
```

**Step 4: Test it**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/pets/123/notes/export
```

**Step 5: Wire it up in frontend** (`src/screens/PetDetailsScreen.jsx`)
```javascript
const handleExport = async () => {
  const response = await api.get(`/api/pets/${petId}/notes/export`);
  // Download the PDF
};
```

### Adding a New Frontend Screen

**Goal:** Add a volunteer management page

**Step 1: Create the screen** (`src/screens/VolunteerManagementScreen.jsx`)
```jsx
import React, { useEffect, useState } from 'react';
import api from '../api.js';

export default function VolunteerManagementScreen() {
  const [volunteers, setVolunteers] = useState([]);
  
  useEffect(() => {
    api.get('/api/users/volunteers').then(setVolunteers);
  }, []);
  
  return (
    <div>
      <h1>Volunteers</h1>
      {/* List volunteers */}
    </div>
  );
}
```

**Step 2: Add route** (`src/App.jsx`)
```jsx
<Route path="/volunteers" element={<VolunteerManagementScreen />} />
```

**Step 3: Add navigation** (update menu/navbar to link to `/volunteers`)

---

## Code Conventions

### TypeScript

- Use `interface` for object contracts, `type` for unions/primitives
- Strict mode enabled; avoid `any`
- Use descriptive names: `getPetByIdAndLocation` not `get`

### Style

**Functions/methods:** verb + noun
- ✅ `getPetById`, `createNote`, `validateToken`
- ❌ `pet`, `handle`, `auth`

**Variables:** noun
- ✅ `userCount`, `petList`, `isAuthenticated`
- ❌ `x`, `data`, `result`

**Constants:** SCREAMING_SNAKE_CASE
- ✅ `JWT_EXPIRY = 900`
- ❌ `jwtExpiry`, `jwt_expiry`

---

## Common Tasks

### Running the Backend Only

```bash
npm run server     # Runs on port 3001
```

### Running the Frontend Only

```bash
npm run client     # Runs on port 3000 with proxy to backend
```

### Checking the Database

1. Open http://localhost:8001 (DynamoDB Admin UI)
2. Browse tables, inspect items, run queries

### Generating a New Environment Variable

1. Add to `.env.example` with description
2. Document in [README.md](../README.md#environment-variables)
3. Access in code: `process.env.YOUR_VAR`
4. If its used often then add it to `src/config/index.ts` for centralized access.

### Switching to DynamoDB Backend

```bash
# In .env
USE_AWS_NOTES=true
```

New notes go to DynamoDB; old notes remain in RescueGroups.

### Running Database Initialization

```bash
npm run create-tables    # Creates DynamoDB tables
```

Only needed once per environment.

---

## Testing

Currently, the project has **no automated tests**. This is an area for improvement.

---

## Debugging

### Backend Logging

Add to any file:
```typescript
console.log('Pet ID:', petId);
console.error('Error fetching pet:', error);
```

Logs appear in terminal running `npm run dev`.

### Frontend DevTools

- **Network tab** — inspect API calls, responses, headers
- **Console** — JavaScript errors and warnings
- **React DevTools extension** — inspect component tree, props, state

### Common Issues

**"Cannot find module"**
- Check import path (TypeScript/ES Modules are case-sensitive)
- Restart dev server

**401 Unauthorized**
- Token expired or invalid
- Check localStorage in DevTools → Application tab
- Try logging out and back in

**Port 3000/3001 already in use**
- See [README Troubleshooting](../README.md#port-already-in-use)

---

## Areas for Improvement

### High Priority

1. **Add automated tests**
   - Unit tests for services (notes, auth, summarization)
   - Integration tests for API endpoints
   - Use Jest + Supertest

### Medium Priority

2. **Pet compatibility scoring**
   - Currently not shown but implemented in `src/services/compatibility.ts`
   - Add form to update compatibility assessments
   - Track assessment history

3. **Real-time updates**
   - Notes require page refresh to see updates from other staff

### Low Priority

4. **Multi-language support**
   - Currently English only

5. **Export/reporting**
   - Bulk export notes as CSV
   - Monthly reports on animal intake/adoption
   - Compatibility assessment trends

6. **AWS Bedrock integration**
    - Replace OpenAI with and cheaper model
    - Implement new `LLMClient` (see [README Maintenance](../README.md#switching-ai-models))

---

## Questions?

- Check [Architecture Decision Records](adr/) for design decisions
- Review [README.md](../README.md) for deployment and architecture overview
- Open an issue for bugs or feature requests
