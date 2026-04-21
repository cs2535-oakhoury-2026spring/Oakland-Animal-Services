# Oakland-Animal-Services
Project for Oakland Animal Services

# Background

Oakland Animal Services (OAS) is an open- admission shelter taking in over 7,000 animals per year. Almost every process within the organization- checking visitors in, matching animals, record keeping- is managed by paper forms, resulting in data which is fragmented, difficult to access, and absent from decision-making. The project is being done in conjunction with Acting Director Joe DeVries, Operations Manager Melinda Tierney, and Technical Volunteer Andy Rifken.

# Goals

To provide an operational system that removes paper-based or otherwise fragmented information and integrates it into a digital system, making it easier for staff to perform every aspect of animal care, simplify interactions with adopting visitors, and give staff of all levels real-time information for decision making, with the added aim of creating a template for use by any shelter in the region dealing with similar issues.

# How

Provide each kennel in the shelter a QR code which when scanned will bring the voluenter to the current pets page. This page will display basic information about the pet and also allow the volunteer to add observeration notes or behavior notes to the pet which staff can later access.

![](https://cdn.corenexis.com/files/c/3358593720.png)

# Oakland Animal Services — Digital Operations Platform

A full-stack web application that digitizes animal care operations at Oakland Animal Services (OAS), replacing fragmented paper-based workflows with a real-time, role-aware digital system.

Built in partnership with OAS Acting Director Joe DeVries, Operations Manager Melinda Tierney, and Technical Volunteer Andy Rifken.

> **Repository Note:** This is a course project for CS 2535 at Northeastern University (Spring 2026). The main repository is maintained at `https://github.com/cs2535-oakhoury-2026spring/Oakland-Animal-Services`.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)
- [Architecture Overview](#architecture-overview)
- [Deployment](#deployment)
- [Architecture Decision Records](#architecture-decision-records)

---

## Project Overview

Oakland Animal Services processes over 7,000 animals per year. Prior to this system, staff relied on paper forms for check-ins, animal matching, and record keeping — resulting in fragmented, inaccessible data.

This platform provides:

- **QR-code-based pet pages** — each kennel has a QR code linking directly to the current pet's profile
- **Observer and behavior notes** — volunteers and staff can log notes on any animal in real time
- **AI-powered note summarization** — behavior notes are condensed using OpenAI for quick staff review
- **Role-based access control** — admin, staff, volunteer, and shared device accounts with appropriate permissions
- **Activity audit log** — full history of note creation/deletion, user management, and password changes
- **Dog-to-dog compatibility tracking** — assessment data surfaced alongside pet profiles

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend runtime | Node.js (ES Modules) |
| Backend language | TypeScript 5.x |
| Backend framework | Express 4.x |
| Database | AWS DynamoDB (local: DynamoDB Local via Docker) |
| Authentication | JWT (access + refresh tokens) + bcrypt |
| Validation | Zod |
| External pet data | RescueGroups API |
| AI summarization | OpenAI API (GPT) |
| Frontend framework | React 18 |
| Frontend build | Create React App (react-scripts) |
| PDF export | jsPDF |
| QR codes | qrcode |
| Containerization | Docker + docker-compose |

---

## Prerequisites

Ensure the following are installed before beginning setup:

- **Node.js** v18 or later — [nodejs.org](https://nodejs.org)
- **npm** v9 or later (bundled with Node.js)
- **Docker Desktop** — [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
- **Git** — [git-scm.com](https://git-scm.com)
- A code editor — [VS Code](https://code.visualstudio.com) is recommended

Verify installations:

```bash
node --version    # v18+
npm --version     # v9+
docker --version  # 20+
```

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/cs2535-oakhoury-2026spring/Oakland-Animal-Services
cd Oakland-Animal-Services
```

### 2. Install dependencies

```bash
# Backend dependencies
npm install

# Frontend dependencies
cd frontend && npm install && cd ..
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the required values (see [Environment Variables](#environment-variables) below). At minimum you need `JWT_SECRET`, `ADMIN_USER`, and `ADMIN_PASS` to run locally. `LLM_API_KEY` and `RESCUE_GROUPS_*` values are needed for full functionality.

### 4. Start infrastructure services

```bash
docker-compose up -d
```

This starts:
- **DynamoDB Local** on `http://localhost:8000`
- **DynamoDB Admin UI** on `http://localhost:8001` (browser-based table inspector)

### 5. Initialize the database

Run once to create all DynamoDB tables:

```bash
npm run create-tables
```

### 6. Start the development servers

```bash
npm run dev
```

This concurrently starts:
- **Backend** (Express) — compiles TypeScript and serves on port `3001`
- **Frontend** (React dev server) — hot-reloading on `http://localhost:3000`, automatically proxies API calls to the backend

Open `http://localhost:3000` in your browser and log in with the `ADMIN_USER` / `ADMIN_PASS` credentials from your `.env`.

**Note:** The React dev server runs on port 3000 and automatically proxies API requests to the backend on port 3001. To modify the proxy target, edit the `proxy` field in `frontend/package.json`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | Yes | Secret key for signing JWTs. Use a long random string in production. |
| `ADMIN_USER` | Yes | Username for the built-in admin account |
| `ADMIN_PASS` | Yes | Password for the built-in admin account |
| `LLM_API_KEY` | For summarization | API key for note summarization |
| `RESCUE_GROUPS_ENDPOINT` | For pet data | Base URL of the RescueGroups API proxy |
| `RESCUE_GROUPS_BEARER` | For pet data | Bearer token for authenticating with RescueGroups |
| `AWS_REGION` | Yes | AWS region (use `us-east-1` locally) |
| `AWS_ACCESS_KEY_ID` | Yes | Use `local` for local DynamoDB |
| `AWS_SECRET_ACCESS_KEY` | Yes | Use `local` for local DynamoDB |
| `AWS_ENDPOINT` | Local only | `http://localhost:8000` for DynamoDB Local |
| `PET_LOCATION_CACHE_TTL` | No | Pet location cache duration in ms (default: 1 hour) |
| `NODE_ENV` | No | `development` or `production` |
| `USE_AWS_NOTES` | No | `true` to use AWS DynamoDB for notes, `false` to use rescue groups journals (default: `false`) |
| `SERVE_FRONTEND` | No | `true` to serve the built React frontend from the backend, `false` for separate frontend (default: `false`) |
---

## Project Structure

```
Oakland-Animal-Services/
├── src/                        # Backend TypeScript source
│   ├── config/                 # DynamoDB client initialization
│   ├── controllers/            # HTTP request handlers
│   ├── middleware/             # JWT auth + role-based access control
│   ├── models/                 # Zod validation schemas
│   ├── routes/                 # Express router definitions
│   ├── services/               # Business logic layer
│   ├── types/                  # Shared TypeScript interfaces
│   ├── utils/                  # Helper utilities (activity logging, note deduplication)
│   ├── db/
│   │   ├── repositories/       # DynamoDB data access objects
│   │   ├── rescueGroups/       # RescueGroups APIs
│   │   └── scripts/            # Table initialization scripts
│   └── server.ts               # Express application entry point
├── frontend/                   # React frontend
│   └── src/
│       ├── screens/            # Full-page route components
│       ├── components/         # Reusable UI components
│       ├── styles/             # CSS stylesheets
│       ├── utils/              # Frontend utilities (fuzzy search, date helpers)
│       ├── api.js              # Centralized API client with token management
│       ├── hooks.js            # Custom React hooks
│       ├── constants.js        # Shared constants
│       └── App.jsx             # Root component and routing
├── docs/
│   ├── adr/                    # Architecture Decision Records
│   └── user-guide/             # User documentation by role
├── docker/                     # Docker support files
├── docker-compose.yml          # Local infrastructure services
├── dockerfile                  # Production Docker image
├── package.json                # Backend scripts and dependencies
├── tsconfig.json               # TypeScript compiler configuration
└── .env                        # Local environment variables (not committed)
```

---

## Available Scripts

Run from the project root:

| Command | Description |
|---|---|
| `npm run dev` | Start backend + frontend concurrently for development |
| `npm run server` | Build and start the backend only |
| `npm run client` | Start the frontend React dev server only |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run create-tables` | Initialize DynamoDB tables (run once on first setup) |

---

## Troubleshooting

### Port Already in Use
If you see "port 3000 already in use" or similar:

```bash
# Find and kill the process using the port (macOS/Linux)
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# On Windows, use:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### DynamoDB Connection Issues
- Ensure `docker-compose up -d` has finished successfully: `docker ps | grep dynamodb`
- Verify the endpoint in `.env` matches your Docker setup: `http://localhost:8000` (not 4566)
- Check Docker logs: `docker logs dynamodb-local`
- Reset tables: `docker-compose down -v && docker-compose up -d && npm run create-tables`

### Frontend Not Connecting to Backend
- Verify backend is running: `npm run server` outputs "Server running at http://localhost:3001"
- Check `frontend/package.json` proxy field points to `http://localhost:3001`
- Check browser console for CORS errors or network failures (DevTools → Network tab)

### Environment Variables Not Loaded
- Ensure `.env` is in the project root (not `backend/.env` or `frontend/.env`)
- Restart the development servers after changing `.env`
- Verify required variables: `JWT_SECRET`, `ADMIN_USER`, `ADMIN_PASS`

---

## Maintenance

### Switching AI Models

The app currently uses **OpenAI API** for note summarization. It uses the `LLMClient` interface (`src/types/index.ts`) to abstract the AI provider, making it easy to swap implementations.

**To switch AI models (e.g., OpenAI → AWS Bedrock):**

1. **Implement the `LLMClient` interface** in `src/services/summarizeService.ts`:
   ```typescript
   class AwsBedrockSummarizer implements LLMClient {
     async summarize({ instruction, text }: { instruction: string; text: string }): Promise<string> {
       // Call AWS Bedrock API
       // Return summarized text as string
     }
   }
   ```

2. **Update the default instance** in `summarizeService.ts`:
   ```typescript
   const defaultLlm = new AwsBedrockSummarizer(defaultSystemPrompt);
   ```

3. **Update environment variables** in `.env.example`:
   ```bash
   LLM_API_KEY=your-aws-bedrock-key
   ```

4. **Test with a real pet note** — verify summarization works before deploying

The interface contract is simple: implement `summarize()` to accept `instruction` + `text`, return a `Promise<string>`.

### Switching Pet/Note Storage

The app supports two backends for storing pet data and notes:

#### Option 1: AWS DynamoDB 
Already configured. To enable:
```bash
# In .env
USE_AWS_NOTES=true
AWS_ENDPOINT=https://dynamodb.us-east-1.amazonaws.com  # Production
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

**Pros:** Full control, scalable, integrated audit logging  
**Cons:** Requires AWS account and DynamoDB setup

#### Option 2: RescueGroups API (Current Default)
Uses RescueGroups journal entries for notes, RescueGroups API for pet data.

```bash
# In .env
USE_AWS_NOTES=false
RESCUE_GROUPS_ENDPOINT=your-rescue-groups-endpoint
RESCUE_GROUPS_BEARER=your-bearer-token
```

**Pros:** No infrastructure to manage, existing RescueGroups integration  
**Cons:** Limited to RescueGroups' data model, slower API calls

#### Migrating Between Backends

**From RescueGroups → DynamoDB:**
1. Set `USE_AWS_NOTES=true` in `.env`
2. Run `npm run create-tables` to initialize DynamoDB tables
3. Old notes in RescueGroups remain; new notes go to DynamoDB

**From DynamoDB → RescueGroups:**
1. Set `USE_AWS_NOTES=false` in `.env`
2. Create corresponding journal entries in RescueGroups for critical data
3. New notes will be created as RescueGroups journal entries

---

## Architecture Overview

### Authentication

- Login issues a short-lived **JWT access token** (15 min) and a long-lived **refresh token** (30 days) stored in an httpOnly cookie
- The frontend API client automatically refreshes the access token on 401 responses
- Logout invalidates the refresh token in DynamoDB
- Staff password changes invalidate all existing refresh tokens for that user

### Pet Data

- Pet profiles are sourced from the **RescueGroups API** and normalized at the API boundary
- RescueGroups repurposes certain fields for shelter-specific data (handler level, compatibility, location); a remapping layer corrects semantics — see [ADR-003](docs/adr/ADR-003.md)
- Pet data is cached on the frontend for 1 minute to reduce API load

### Notes

- Notes are stored in DynamoDB or using Rescue Group Journals under two tables: `ObserverNotes` and `BehaviorNotes`
- Duplicate note detection uses client-side **Levenshtein distance** fuzzy matching — see [ADR-002](docs/adr/ADR-002.md)
- Behavior notes can be summarized via the OpenAI API (staff/admin only)

### Role-Based Access

| Role | Capabilities |
|---|---|
| Admin | Full access; credentials sourced from `.env` or created in portal |
| Staff | Manage volunteers, view activity log, all note operations |
| Volunteer | Create/view notes; account expires at configured date |
| Device | Shared account for kiosk tablets; notes attributed by human name |

---

## Deployment

### Frontend Deployment

The React frontend can be deployed independently or alongside the backend. Choose an approach based on your infrastructure:

#### Option 1: Static Hosting (Vercel, Netlify, GitHub Pages)

Build the frontend for production:

```bash
cd frontend
npm run build
```

This creates a `build/` directory with optimized static assets. Deploy to:
- **Vercel** — `vercel deploy`
- **Netlify** — Drag `build/` folder into Netlify dashboard
- **AWS S3 + CloudFront** — Upload `build/` contents to S3, serve via CloudFront
- **GitHub Pages** — Push `build/` to gh-pages branch

**Important:** Update the API endpoint in the deployed app to point to your backend. Either:
- Update `frontend/package.json` `proxy` field before building, or
- Set an environment variable `REACT_APP_API_URL` and update `frontend/src/api.js` to use it

#### Option 2: Backend + Frontend Bundle

Serve the frontend from the Express backend:

1. Build the frontend:
   ```bash
   cd frontend && npm run build && cd ..
   ```

2. Enable frontend serving in `.env`:
   ```bash
   SERVE_FRONTEND=true
   ```

3. The backend automatically serves the React app at the root path. The Express server will:
   - Serve static assets from `frontend/build`
   - Return `index.html` for all non-API routes (client-side routing)

4. Deploy the backend Docker container — it now serves both API and frontend on the same port

### Backend / Docker Deployment

To build a production Docker image:

```bash
docker build -t oakland-animal-services:latest .
```

The `Dockerfile` is a multi-stage build that:
1. Compiles the backend TypeScript
2. Builds the frontend React app
3. Copies both into the production container
4. Defaults to `SERVE_FRONTEND=false` (does not serve React from Express),

Run the image:

```bash
docker run -p 3000:3000 \
  -e JWT_SECRET=your-secret \
  -e ADMIN_USER=admin \
  -e ADMIN_PASS=password \
  -e AWS_ENDPOINT=https://dynamodb.us-east-1.amazonaws.com \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=your-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret \
  oakland-animal-services:latest
```

All required environment variables must be provided at runtime.

### AWS Deployment

For production deployment on AWS:

1. Configure real AWS credentials (not local test credentials)
2. Update `AWS_ENDPOINT` to point to your production AWS region
3. Create DynamoDB tables in your AWS account (or the init script will create them)
4. Set `NODE_ENV=production` for security features (e.g., secure cookies)
5. Use a production-grade database backup and restore strategy

### Environment Configuration for Production

Key differences from local development:

- `NODE_ENV` → set to `production`
- `JWT_SECRET` → use a strong, randomly generated secret (min 32 characters)
- `AWS_ENDPOINT` → remove or set to your AWS region endpoint
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` → use production credentials
- Consider using AWS Secrets Manager or similar for credential rotation

---

## Architecture Decision Records

Significant design decisions are documented in [`docs/adr/`](docs/adr/):

- **ADR-001** — Database choice (DynamoDB)
- **ADR-002** — Client-side note deduplication (moved from server-side NLP)
- **ADR-003** — RescueGroups field remapping
- **ADR-004** — Role-based access control model
- **ADR-005** — Refresh token storage strategy
- **ADR-006** — Frontend state management approach
- **ADR-007** — Note search architecture
- **ADR-008** — Migrating from inline styles to CSS variables and external stylesheets
- **ADR-009** — Migrating from single-file to multi-component architecture
- **ADR-010** — Local state with prop drilling over global state management

---

## Developer Resources

- **[Developer's Guide](docs/DEVELOPER_GUIDE.md)** — Codebase walkthrough, how to add features, common tasks, areas for improvement
- **[User Guide](docs/user-guide/USER_GUIDE.md)** — End-user documentation organized by role (Volunteer, Staff, Admin)
- **[Architecture Decision Records](docs/adr/)** — Design decisions and rationale

---

*This README file was created with the assistance of Claude Code, revised and edited by Grace Shang, Haotian, Rafay Malik, and Nafis Rahman*