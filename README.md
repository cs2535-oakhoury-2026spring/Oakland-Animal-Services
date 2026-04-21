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

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Architecture Overview](#architecture-overview)
- [User Roles](#user-roles)
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
| AI summarization | OpenAI API (GPT) - to be changed to AWS Bedrock|
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
- **Frontend** (React dev server) — hot-reloading on `http://localhost:3000`, proxies API calls to backend

Open the link that the client created usually `http://localhost:3001` in your browser and log in with the `ADMIN_USER` / `ADMIN_PASS` credentials from your `.env`.

To change the proxy go to `frontend/package.json` and modify the `proxy` field.

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
│   └── adr/                    # Architecture Decision Records
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
| Admin | Full access; credentials sourced from `.env` |
| Staff | Manage volunteers, view activity log, all note operations |
| Volunteer | Create/view notes; account expires at configured date |
| Device | Shared account for kiosk tablets; notes attributed by human name |

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

*This README file was created with the assistance of Claude Code, revised and edited by Grace Shang, Haotian, Rafay Malik, and Nafis Rahman*