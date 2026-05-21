# AuraSplit

AuraSplit is a full-stack expense-sharing application with a React + Vite frontend and an Express + MongoDB backend. It helps users track expenses, manage friends, create groups, and settle balances.

## Project structure

- `backend/` - Node.js API server
- `frontend/` - React client application
- `package.json` - root scripts for installing dependencies and running both apps together

## Features

- User authentication and authorization
- Expense creation and tracking
- Friend management
- Group creation and management
- Settlement support for expense splitting

## Getting started

### Prerequisites

- Node.js 18+ (or compatible)
- npm
- MongoDB database

### Install dependencies

From the project root:

```bash
npm run install-all
```

This installs dependencies for both `backend` and `frontend`.

## Backend setup

### Environment variables

Create a `.env` file inside `backend/` with at least:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

### Start backend

From the project root:

```bash
npm run dev --prefix backend
```

Or from the backend folder directly:

```bash
cd backend
npm run dev
```

The backend runs on `http://localhost:5000` by default.

## Frontend setup

### Start frontend

From the project root:

```bash
npm run dev --prefix frontend
```

Or from the frontend folder directly:

```bash
cd frontend
npm run dev
```

The frontend uses Vite and will typically run on `http://localhost:5173`.

## Run both apps together

From the root directory:

```bash
npm run dev
```

This runs both the backend and frontend concurrently.

## API base URL

The frontend is configured to call the backend API at:

- `http://localhost:5000/api`

If you change the backend port, update `frontend/src/utils/api.js` accordingly.

## Build frontend for production

```bash
cd frontend
npm run build
```

## Notes

- The backend uses MongoDB via `MONGO_URI`.
- The frontend stores JWT tokens in local storage and appends them to API requests.
- If you need a sample `.env`, create one in `backend/` with the required values.

## Contact

For issues or further improvements, review the `backend/routes` and `frontend/src` implementations.
