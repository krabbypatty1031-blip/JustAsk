# Project Context

## Purpose
JustAsk is a question and answer platform that allows users to register, login, ask questions, and answer questions. It provides a simple social Q&A experience with features like:
- User authentication (registration, login, password reset)
- Create and view questions
- Answer questions
- User profiles
- Real-time question feed

## Tech Stack
- **Frontend**: Vue 3 with Composition API and `<script setup>`, Vite for bundling, Vue Router for navigation
- **Backend**: Express.js (Node.js), EJS for server-side templates
- **Database**: MongoDB
- **Authentication**: bcryptjs for password hashing, express-session for session management
- **HTTP Client**: Axios for API requests
- **CORS**: Configured for local development and Vercel deployments
- **Session Storage**: In-memory sessions with cookie-based authentication

## Project Conventions

### Code Style
- **Frontend**: Uses Vue 3 `<script setup>` syntax in Single File Components (.vue)
- **Backend**: CommonJS modules (require/module.exports)
- **Language**: Traditional Chinese (繁體中文) for all user-facing messages and UI text
- **Database Collection Names**: Capitalized (e.g., `Users`, `Questions`)
- **Database Name**: `JustAsk_Database`
- **Response Format**: JSON responses with `success` boolean and optional `message` string
- **HTML Template**: Uses Bootstrap 5 via CDN for server-rendered EJS pages (like initial index)

### Architecture Patterns
- **Monorepo Structure**: Separate `frontend/` and `backend/` directories
- **REST API**: Resource-based routing (e.g., `/questions`, `/users`)
- **Middleware Pattern**: Authentication middleware for protected routes (`requireLogin`)
- **Database Connection**: Per-request connections (`connectToDB`) with automatic cleanup in finally blocks
- **Session Management**: Express session with secure cookies in production (SameSite: 'none' for cross-origin, 'lax' for local)
- **CORS Config**: Dynamic CORS origin checking for Vercel and localhost
- **Frontend API**: All API requests routed through `/api` proxy in development or direct URL in production

### Testing Strategy
No automated testing currently implemented.

### Git Workflow
No specific branching strategy defined.

## Domain Context
- Users authenticate with username + phone + password
- Phone numbers must be exactly 8 digits
- Questions contain title, content, author info, and array of answers
- Answers include content, author info, and timestamps
- Questions are sorted by creation date (newest first)
- Views are incremented on question detail access

## Important Constraints
- Phone number validation: Must be exactly 8 digits
- Session secret: 'justask-secret-key' (should be environment variable in production)
- MongoDB connection: Falls back to 'mongodb://localhost:27017' if MONGODB_URI not set
- Production deployments require FRONTEND_URL environment variable
- CORS only allows .vercel.app and localhost origins
- Backend API base path for axios client is `/api`

## External Dependencies
- MongoDB database (connection via MONGODB_URI environment variable)
- Vercel for potential frontend deployment
- Render for potential backend deployment (reverse proxy trust enabled)
- Bootstrap 5 (CDN) for EJS templates
