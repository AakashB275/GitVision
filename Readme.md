# GitVision 🚀

A GitHub repository dependency visualization tool that analyzes repository structures, dependencies, and relationships in real-time with an interactive visual interface.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running Locally](#running-locally)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)

## 📖 Overview

GitVision is a full-stack application that connects to GitHub repositories, analyzes their structure, and provides real-time dependency visualization. It uses a sophisticated job-queuing system for async analysis and SSE streaming for live progress updates.

**Key Capabilities:**
- Authenticate with GitHub via Clerk
- Upload and analyze GitHub repositories
- Visualize file tree and dependencies
- View analysis history and saved repositories
- Real-time progress streaming during analysis

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React (TypeScript), Vite, TailwindCSS |
| **Backend** | Express 5 (TypeScript), Node.js |
| **Database** | PostgreSQL (via NeonDB) |
| **Caching** | PostgreSQL (commit-SHA-keyed) |
| **Job Queue** | BullMQ + Redis |
| **Real-time** | Server-Sent Events (SSE) |
| **Auth** | Clerk |
| **API** | GitHub REST API |
| **Containerization** | Docker & Docker Compose |
| **Monorepo** | TypeScript workspace |

## 📦 Prerequisites

- **Node.js** v18+ and npm/yarn/pnpm
- **Docker** and **Docker Compose** (for Redis, PostgreSQL)
- **Git** for repository operations
- A **Clerk account** for authentication
- A **GitHub account** and personal access token
- A **NeonDB account** (PostgreSQL hosting)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/AakashB275/GitVision.git
cd GitVision
```

### 2. Install Dependencies

This is a TypeScript monorepo. Install all workspace dependencies:

```bash
npm install
# or
yarn install
```

### 3. Set Up Docker Services

Start PostgreSQL and Redis containers:

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **Redis** on `localhost:6379`

Verify services are running:

```bash
docker ps
```

### 4. Initialize the Database

Run database migrations and seed scripts (if available):

```bash
npm run db:migrate
# or specify the workspace
npm run -w backend db:migrate
```

## 🔐 Environment Setup

Create a `.env` file in the root and backend directory with the following variables:

### Backend `.env`

```env
# Server
NODE_ENV=development
PORT=5000
BACKEND_URL=http://localhost:5000

# Frontend
FRONTEND_URL=http://localhost:5173

# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret_key_here
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# GitHub API
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_APP_ID=your_github_app_id

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/gitvision
NEON_DATABASE_URL=your_neon_db_connection_string

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# BullMQ
BULLMQ_QUEUE_NAME=analysis-queue
```

### Frontend `.env`

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
VITE_API_BASE_URL=http://localhost:5000
```

### How to Get Credentials

**Clerk:**
1. Go to [clerk.com](https://clerk.com) → Sign in/Create account
2. Create a new app
3. Copy Secret Key and Publishable Key from Dashboard → API Keys

**GitHub Token:**
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` and `read:user` scopes
3. Copy the token (won't be shown again)

**NeonDB:**
1. Go to [neon.tech](https://neon.tech) → Sign up
2. Create a new project
3. Copy the connection string

## 🏃 Running Locally

### Terminal 1: Backend Server

```bash
npm run -w backend dev
```

The backend will start on `http://localhost:5000`

### Terminal 2: BullMQ Worker

```bash
npm run -w backend worker
```

This processes async analysis jobs from the Redis queue.

### Terminal 3: Frontend Development Server

```bash
npm run -w frontend dev
```

The frontend will start on `http://localhost:5173`

### Verify Everything is Working

1. Open `http://localhost:5173` in your browser
2. Sign in with Clerk
3. Navigate to the dashboard
4. Try uploading a repository for analysis

## 📁 Project Structure

```
GitVision/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── api/           # Express routes
│   │   │   ├── services/      # Business logic
│   │   │   ├── workers/       # BullMQ workers
│   │   │   ├── models/        # Database models
│   │   │   ├── middleware/    # Express middleware
│   │   │   └── utils/         # Helpers
│   │   ├── .env
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/    # React components
│   │   │   ├── pages/         # Page routes
│   │   │   ├── hooks/         # Custom hooks
│   │   │   ├── services/      # API clients
│   │   │   ├── types/         # TypeScript types
│   │   │   └── utils/         # Helpers
│   │   ├── .env
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── shared/                # Shared types (optional)
├── docker-compose.yml
├── package.json               # Root workspace config
└── README.md
```

## ✨ Key Features

### 🔐 Authentication
- Secure GitHub sign-in via Clerk
- User session management
- Protected API routes

### 📊 Repository Analysis
- File tree visualization
- Dependency detection
- Commit SHA-keyed caching for efficiency
- GitHub REST API integration

### ⚡ Real-time Processing
- SSE (Server-Sent Events) for live progress updates
- BullMQ async job queue for heavy operations
- Redis for distributed job management

### 💾 Data Management
- Dashboard for saved repositories
- Analysis history tracking
- PostgreSQL persistence

### 🎨 User Interface
- Responsive React frontend
- Sidebar (visible on `/project` route)
- File content viewing pipeline
- Analysis monitor component with SSE integration

## 🏗 Architecture

### Request Flow

```
Client (React)
    ↓
Clerk Auth Middleware
    ↓
Express API Routes
    ↓
BullMQ Queue / PostgreSQL
    ↓
Worker Process
    ↓
GitHub API / Database Operations
    ↓
SSE Stream Response
    ↓
Frontend Updates (AnalysisMonitor)
```

### Key Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/analyses` | Create analysis job |
| GET | `/api/analyses/:id` | Get analysis details |
| GET | `/api/analyses` | List analyses |
| GET | `/api/analyses/:id/stream` | SSE stream for progress |
| GET | `/api/repos` | List saved repositories |
| DELETE | `/api/analyses/:id` | Delete analysis |

### Component Communication

- **AnalysisMonitor.tsx**: Listens to SSE stream via `EventSource`
- **Backend SSE endpoint**: Streams real-time job progress
- **BullMQ Worker**: Processes jobs and emits progress events

## 🛠 Development Workflow

### Adding a New Feature

1. Create a branch: `git checkout -b feature/your-feature`
2. Update backend service logic in `packages/backend/src/services/`
3. Add API routes in `packages/backend/src/api/`
4. Update frontend components in `packages/frontend/src/components/`
5. Test with local dev servers running
6. Commit and create a pull request

### Database Changes

1. Create a migration file in `packages/backend/src/migrations/`
2. Update your `.env` DATABASE_URL if needed
3. Run migrations: `npm run -w backend db:migrate`
4. Update models in `packages/backend/src/models/`

### Debugging

**Check Redis Connection:**
```bash
redis-cli ping
# Should return "PONG"
```

**Check PostgreSQL Connection:**
```bash
psql postgresql://user:password@localhost:5432/gitvision
```

**View BullMQ Queue:**
```bash
npm run -w backend queue:status
```

**Frontend Console Errors:**
- Open DevTools (F12) → Console tab
- Check Network tab for API errors

## 🐛 Troubleshooting

### SSE Not Streaming / AnalysisMonitor Not Updating

**Problem:** Real-time progress not appearing in the UI

**Solutions:**
1. Verify SSE endpoint is correctly mapped:
   ```bash
   # In backend: /api/analyses/:id/stream
   # In frontend: AnalysisMonitor.tsx should use EventSource
   ```
2. Check route path consistency (watch for `/api/analyze` vs `/api/analyses`)
3. Ensure CORS headers allow SSE connections
4. Check browser console for EventSource errors

### Redis Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solutions:**
1. Start Docker: `docker-compose up -d`
2. Verify Redis is running: `docker ps | grep redis`
3. Check Redis port: `redis-cli ping`

### PostgreSQL Connection Failed

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
1. Ensure Docker Compose is running: `docker-compose up -d`
2. Check DATABASE_URL in `.env`
3. Verify credentials match docker-compose.yml

### Clerk Authentication Not Working

**Solutions:**
1. Verify `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` in `.env`
2. Ensure keys match your Clerk application
3. Check Clerk dashboard for API key settings
4. Clear browser cookies and try again

### BullMQ Worker Not Processing Jobs

**Solutions:**
1. Ensure worker process is running: `npm run -w backend worker`
2. Check Redis connection: `redis-cli KEYS "*"`
3. View queue status: `npm run -w backend queue:status`
4. Check worker logs for errors

### GitHub API Rate Limiting

```
Error: API rate limit exceeded
```

**Solutions:**
1. Ensure `GITHUB_TOKEN` is set in `.env`
2. Authenticated requests have higher rate limits (5000/hour vs 60/hour)
3. Implement request batching for large analyses

### File Tree Not Loading

**Problem:** File tree component shows empty or errors

**Solutions:**
1. Verify GitHub token has repo access
2. Check repository is public or token has private repo access
3. Inspect API response in Network tab (DevTools)
4. Verify PostgreSQL cache is working

## 📚 Additional Resources

- [Express 5 Documentation](https://expressjs.com/)
- [React TypeScript Handbook](https://react-typescript-cheatsheet.netlify.app/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Clerk Documentation](https://clerk.com/docs)
- [GitHub API Reference](https://docs.github.com/en/rest)

## 🚀 Deployment

For production deployment, consider:

1. **Database**: Use NeonDB connection string instead of localhost
2. **Redis**: Use a managed Redis service (Redis Cloud, AWS ElastiCache)
3. **Backend**: Deploy to Vercel, Railway, or Render
4. **Frontend**: Deploy to Vercel or Netlify
5. **Environment Variables**: Set in deployment platform's dashboard
6. **CORS**: Update `FRONTEND_URL` in backend `.env`
