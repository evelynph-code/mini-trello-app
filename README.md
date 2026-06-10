# Mini Trello App

A full-stack Trello-style board app with a React/Vite frontend and an Express/Firebase backend. Users can sign in, create boards, invite board members, manage access, create cards, track tasks, leave comments, and receive notifications.

## Live Features

- GitHub OAuth login and local email/password accounts.
- Email verification gate for local accounts before users can access boards.
- Multi-board workspace with board creation, renaming, deletion, default boards, and board switching.
- Board membership management with owner-only invite, remove-member, leave-board, and shared-board flows.
- Card/list workflow with list creation, renaming, deletion, drag ordering, and card CRUD.
- Task management inside cards with assignees, reviewers, priorities, statuses, deadlines, and completion tracking.
- Card discussion area with comments and activity history.
- In-app notifications for invitations, task assignments, review requests, comments, due-soon tasks, and board activity.
- Realtime board, task, comment, and activity refreshes through Socket.IO rooms.
- Profile/settings page for display name, role, public handle, email verification status, sign out, and account deletion.
- Account deletion cleanup for owned tasks, owned boards, nested cards, comments, activities, sessions, and user profile data.

## Tech Stack

### Frontend

- **React 19** - component-based UI for the board, cards, tasks, settings, notifications, and authentication screens.
- **Vite 8** - fast local development server and production bundling for the React client.
- **React Router 7** - browser routing for the dashboard, settings page, verification gate, and fallback navigation.
- **React DnD + HTML5 backend** - drag-and-drop card and list ordering with browser-native pointer behavior.
- **Socket.IO Client** - realtime board/task/card-detail updates from the backend.
- **Lucide React** - consistent icon set for navigation, buttons, status indicators, settings, and notifications.
- **Plain CSS modules by feature folder** - lightweight styling split across board, landing, settings, task, activity, and dialog files without adding a UI framework.

### Backend

- **Node.js + Express 5** - HTTP API for authentication, boards, cards, tasks, comments, users, invitations, and notifications.
- **Firebase Admin SDK** - trusted server-side access to Firestore using a service account.
- **Cloud Firestore** - document database for users, sessions, boards, cards, tasks, comments, activities, invitations, OAuth state, and notifications.
- **Socket.IO** - realtime event rooms for board-level changes and card/task detail updates.
- **Nodemailer** - SMTP-based local-account verification emails.
- **dotenv** - local environment configuration for API origins, OAuth, Firebase, cookie, and email settings.
- **CORS middleware** - credentialed cross-origin requests between the Vercel frontend and Render backend.

## External Services and APIs

- **GitHub OAuth** - handles "Continue with GitHub" sign-in. The backend calls GitHub's OAuth token endpoint and user API to create/update GitHub-backed users.
- **Firebase / Firestore** - stores application data and supports collection-group cleanup queries for account deletion.
- **SMTP email provider** - sends 6-digit email verification codes for local accounts through Nodemailer.
- **Render** - hosts the Express and Socket.IO backend.
- **Vercel** - hosts the React/Vite frontend.

## Why These Choices

- **React + Vite** keeps the client fast to develop while staying simple enough for a project-management UI with many small interactive surfaces.
- **Express** is a direct fit for a REST-style API and keeps controller, service, repository, and middleware layers easy to reason about.
- **Firestore** works well for nested board data, realtime-friendly documents, server-side batch cleanup, and simple user/session storage without operating a separate database server.
- **Socket.IO** provides reliable realtime updates with rooms, which maps cleanly to board rooms and card/task rooms.
- **Cookie-based sessions** keep authentication state server-owned and allow both GitHub OAuth users and local users to share the same authorization flow.
- **React DnD** avoids hand-rolling drag-and-drop behavior for cards and lists.
- **Nodemailer** gives a simple provider-agnostic email layer, so SMTP credentials can be swapped without changing the verification flow.
- **Vercel + Render** split static frontend hosting from the long-running backend needed for API routes, cookies, and Socket.IO.

## Project Structure

```text
trello-app/
├── frontend/                 # React + Vite client
│   ├── src/
│   │   ├── assets/           # Static frontend assets
│   │   ├── components/       # Reusable React components
│   │   │   ├── Boards/       # Board switcher and board access UI
│   │   │   ├── Cards/        # Card/list UI components and dialogs
│   │   │   ├── Layout/       # App shell/navigation
│   │   │   ├── Tasks/        # Task board, comments, activity panels
│   │   │   └── Users/        # User settings UI
│   │   ├── hooks/            # React state managers for cards, lists, and task summaries
│   │   ├── pages/            # Page-level screens
│   │   ├── services/         # API and realtime client helpers
│   │   ├── styles/           # Feature CSS files
│   │   │   └── board/        # Split board styles: manager, workspace, tasks, dialogs
│   │   └── utils/            # Pure frontend helpers for board/card/task data
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

### Frontend Organization

- `frontend/src/pages/` contains route-level screens such as the board page, landing page, and settings page.
- `frontend/src/components/Boards/` owns board selection, creation, access, rename, delete, and leave-board UI.
- `frontend/src/components/Cards/` owns presentational card/list pieces such as `CardManager`, `BoardCard`, `ListColumn`, and card dialogs.
- `frontend/src/components/Tasks/` owns task boards, task comments, activity history, reviewer flow UI, and related panels.
- `frontend/src/hooks/useCardManager.js` coordinates card loading, card CRUD, drag ordering, realtime updates, and notification click-through focus.
- `frontend/src/hooks/useListManager.js` handles list create, rename, delete, and reorder behavior.
- `frontend/src/hooks/useCardTaskSummaries.js` handles task summary counts and due-date badge data for cards.
- `frontend/src/services/` wraps backend API calls and Socket.IO setup.
- `frontend/src/utils/` contains pure helpers such as card normalization, board helpers, and task summary formatting.
- `frontend/src/styles/board.css` imports the smaller board style modules in `frontend/src/styles/board/`.

### Backend Organization

- `backend/src/routes/` maps API endpoints to controllers.
- `backend/src/controllers/` validates request input and sends HTTP responses.
- `backend/src/services/` contains business rules such as board access, default-board behavior, invitations, notifications, tasks, and card activity.
- `backend/src/repositories/` contains Firestore reads/writes.
- `backend/src/realtime/socket.js` manages Socket.IO board rooms and board-change broadcasts.
- `backend/src/middleware/` contains auth, verified-email, not-found, and error handling middleware.

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

## Deploying to Render and Vercel

Deploy the backend as a Render Web Service from the `backend` directory:

```bash
npm install
npm start
```

Render should provide `PORT` automatically. Set these backend environment variables in Render:

```text
NODE_ENV=production
CLIENT_ORIGIN=https://your-vercel-app.vercel.app
API_BASE_URL=https://your-render-service.onrender.com
COOKIE_SAMESITE=None
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_OAUTH_CALLBACK_URL=https://your-render-service.onrender.com/api/auth/github/callback
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
APP_NAME=Mini Trello
APP_EMAIL_FROM="Mini Trello <no-reply@example.com>"
SMTP_HOST=your_smtp_host
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

If you use multiple Vercel domains or preview deployments, set `CLIENT_ORIGINS` to a comma-separated list of allowed frontend origins.

Deploy the frontend as a Vercel project from the `frontend` directory:

```text
Build Command: npm run build
Output Directory: dist
```

Set this frontend environment variable in Vercel:

```text
VITE_API_BASE_URL=https://your-render-service.onrender.com/api
```

For GitHub OAuth, add this callback URL in the GitHub OAuth app:

```text
https://your-render-service.onrender.com/api/auth/github/callback
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
