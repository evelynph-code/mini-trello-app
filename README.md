# Mini Trello App

A full-stack Trello-style board app with a React/Vite frontend and an Express/Firebase backend. Users can sign in, create boards, invite board members, manage access, create cards, track tasks, leave comments, and receive notifications.

## Project Structure

```text
trello-app/
├── frontend/                 # React + Vite client
│   ├── src/
│   │   ├── assets/           # Static frontend assets
│   │   ├── components/       # Reusable React components
│   │   │   ├── Boards/       # Board switcher and board access UI
│   │   │   ├── Cards/        # Board card, list, and card dialogs
│   │   │   ├── Layout/       # App shell/navigation
│   │   │   ├── Tasks/        # Task board, comments, activity panels
│   │   │   └── Users/        # User settings UI
│   │   ├── pages/            # Page-level screens
│   │   ├── services/         # API and realtime client helpers
│   │   ├── styles/           # Feature CSS files
│   │   └── utils/            # Shared frontend helpers
│   └── package.json
├── backend/                  # Express API
│   ├── src/
│   │   ├── config/           # Env and Firebase setup
│   │   ├── controllers/      # HTTP request handlers
│   │   ├── middleware/       # Auth, verified-email, errors, not-found
│   │   ├── realtime/         # Socket.IO board events
│   │   ├── repositories/     # Firestore data access
│   │   ├── routes/           # API route definitions
│   │   └── services/         # Business logic
│   ├── .env.example
│   └── package.json
├── package.json              # Root scripts for frontend/backend commands
└── README.md
```

## Requirements

- Node.js and npm
- Firebase service account JSON for Firestore access
- GitHub OAuth app for GitHub login
- SMTP credentials if you want email verification messages to send through a real mailbox

## Setup

Install dependencies:

```bash
npm --prefix frontend install
npm --prefix backend install
```

Create a backend environment file:

```bash
cp backend/.env.example backend/.env
```

Set the required values in `backend/.env`:

```bash
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
API_BASE_URL=http://localhost:4000
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_OAUTH_CALLBACK_URL=http://localhost:4000/api/auth/github/callback
FIREBASE_SERVICE_ACCOUNT_PATH=./ServiceAccountKey.json
APP_NAME=Mini Trello
APP_EMAIL_FROM="Mini Trello <no-reply@example.com>"
SMTP_HOST=
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
```

Place your Firebase service account file at the path configured by `FIREBASE_SERVICE_ACCOUNT_PATH`. With the default value above, that file should be `backend/ServiceAccountKey.json`.

## GitHub OAuth

Create a GitHub OAuth App and use this callback URL:

```text
http://localhost:4000/api/auth/github/callback
```

Copy the OAuth app client ID and client secret into `backend/.env`, then restart the backend.

## Running Locally

Start the backend API:

```bash
npm run dev:backend
```

Start the frontend in another terminal:

```bash
npm run dev
```

The frontend runs on Vite, usually at:

```text
http://localhost:5173
```

The backend API runs at:

```text
http://localhost:4000/api
```

If you need to point the frontend at a different API URL:

```bash
VITE_API_BASE_URL=http://localhost:4000/api npm run dev
```

## Useful Commands

From the project root:

```bash
npm run dev           # Start the frontend dev server
npm run dev:backend   # Start the backend dev server
npm run build         # Build the frontend
npm run lint          # Lint the frontend
npm run preview       # Preview the frontend production build
```

From individual folders:

```bash
npm --prefix frontend run dev
npm --prefix frontend run build
npm --prefix frontend run lint
npm --prefix backend run dev
npm --prefix backend start
```

## API Overview

- `GET /api/health` - backend health check.
- `GET /api/auth/me` - fetch the current signed-in user.
- `GET /api/auth/github` - start GitHub OAuth login.
- `GET /api/auth/github/callback` - handle GitHub OAuth callback.
- `POST /api/auth/logout` - sign out.
- `POST /api/auth/register` - create a local account.
- `POST /api/auth/login` - log in with a local account.
- `POST /api/auth/verify-email` - verify a local account email code.
- `POST /api/auth/verification-email` - resend a verification code.
- `PATCH /api/auth/me` - update the signed-in user profile.
- `DELETE /api/auth/me` - delete the signed-in account.
- `GET /api/boards` - list boards the current user can access.
- `POST /api/boards` - create a board.
- `GET /api/boards/:id` - fetch a board.
- `PUT /api/boards/:id` - update a board.
- `DELETE /api/boards/:id` - delete a board.
- `POST /api/boards/:id/invitations` - invite a user to a board.
- `DELETE /api/boards/:id/members/:memberId` - remove a member from a board.
- `GET /api/invitations` - list pending board invitations.
- `PATCH /api/invitations/:id` - accept or decline an invitation.
- `GET /api/cards` - list assigned cards across boards.
- `GET /api/boards/:boardId/cards` - list cards in a board.
- `POST /api/boards/:boardId/cards` - create a board card.
- `GET /api/boards/:boardId/cards/:id` - fetch a board card.
- `PUT /api/boards/:boardId/cards/:id` - update a board card.
- `DELETE /api/boards/:boardId/cards/:id` - delete a board card.
- `GET /api/boards/:boardId/cards/:cardId/tasks` - list tasks in a card.
- `POST /api/boards/:boardId/cards/:cardId/tasks` - create a task.
- `GET /api/boards/:boardId/cards/:cardId/tasks/:taskId` - fetch a task.
- `PUT /api/boards/:boardId/cards/:cardId/tasks/:taskId` - update a task.
- `DELETE /api/boards/:boardId/cards/:cardId/tasks/:taskId` - delete a task.
- `GET /api/boards/:boardId/cards/:cardId/details` - fetch card details, comments, and activity.
- `POST /api/boards/:boardId/cards/:cardId/details/comments` - add a card comment.
- `GET /api/notifications` - list notifications.
- `PATCH /api/notifications/:id/read` - mark a notification as read.
- `GET /api/users` - search users.
- `GET /api/users/:id` - fetch a user.
- `PATCH /api/users/:id` - update a user.

## Notes

- The backend uses cookie-based sessions, so the frontend sends requests with credentials enabled.
- Board access is enforced in backend services. Owners can invite and remove members; members can access boards they belong to.
- Realtime board updates are handled with Socket.IO.
