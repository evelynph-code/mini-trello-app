# Mini Trello App

A small full-stack Trello-style board starter with a React/Vite frontend and an Express backend.

## Structure

- `frontend/src/components` - reusable React UI pieces for layout, boards, columns, and cards.
- `frontend/src/pages` - page-level data loading and workflow orchestration.
- `frontend/src/services` - frontend API client functions.
- `frontend/src/utils` - shared frontend helpers.
- `backend/src/config` - backend environment configuration.
- `backend/src/controllers` - HTTP request handlers.
- `backend/src/data` - seed data for the in-memory demo board.
- `backend/src/middleware` - Express error and not-found middleware.
- `backend/src/routes` - API route definitions.
- `backend/src/services` - backend business logic.

## Run Locally

Install dependencies from the frontend and backend folders if needed:

```bash
npm --prefix frontend install
npm --prefix backend install
```

Start the API:

```bash
npm run dev:backend
```

Start the frontend in another terminal:

```bash
npm run dev
```

The frontend expects the API at `http://localhost:4000/api`. Override that with:

```bash
VITE_API_BASE_URL=http://localhost:4000/api npm run dev
```

## GitHub OAuth

Create a GitHub OAuth App when you are ready to test login locally.

Use this callback URL in the GitHub OAuth App settings:

```text
http://localhost:4000/api/auth/github/callback
```

Then create `backend/.env` from `backend/.env.example` and set:

```bash
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
API_BASE_URL=http://localhost:4000
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_OAUTH_CALLBACK_URL=http://localhost:4000/api/auth/github/callback
```

Restart the backend after changing OAuth environment variables.

## API

- `GET /api/health` - health check.
- `GET /api/auth/me` - fetch the signed-in GitHub user from the session.
- `GET /api/auth/github` - start GitHub OAuth login.
- `GET /api/auth/github/callback` - handle GitHub OAuth callback.
- `POST /api/auth/logout` - clear the local session.
- `GET /api/board` - fetch the demo board.
- `POST /api/board/columns/:columnId/cards` - add a card to a column.
- `PATCH /api/board/cards/:cardId/move` - move a card to another column.
- `POST /api/board/reset` - reset the in-memory board.
# mini-trello-app
