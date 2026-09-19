# Multi-Window Media Sequencer

<!-- <img width="1842" height="853" alt="image" src="https://github.com/user-attachments/assets/c39e24eb-e549-408f-96fb-7a5881a6995a" /> -->
<img width="1817" height="847" alt="image" src="https://github.com/user-attachments/assets/b405cca8-3ea1-493e-94cc-80f90917dea7" />

A full stack media playback dashboard where multiple display windows run independent playlists and can temporarily show synchronized media.

## Live URLs

- Frontend: https://frontend-eta-three-53.vercel.app
- Backend: https://multi-window-media-sequencer-7lf2.onrender.com
- Repository: https://github.com/jollyhub8278/multi-window-media-sequencer

## Features

- Independent continuous playback for each window
- Image, video and explicit blank media support
- Five-hour playback cycle
- Persistent playlists using MongoDB
- Dynamically add media to any window
- Real-time synchronized playback using WebSockets
- Playlist resumes after sync without losing configuration

## Tech Stack

- Frontend: React, TypeScript, Vite
- Backend: Go, Gin
- Database: MongoDB Atlas
- Real-time: WebSockets
- Deployment: Vercel and Render

## Sync Behaviour

When sync is triggered, the Go backend stores the sync event with common start and end timestamps and broadcasts it through WebSockets. Every connected client displays the selected media at the scheduled time. After the duration ends, each window resumes its independent playlist.

Blank playback occurs only when a blank item is explicitly present in a playlist. The unused portion of the five-hour cycle is never treated as blank.

## Local Setup

### Backend

```bash
cd backend
go mod download
go run ./cmd/server
```

Create `backend/.env`:

```env
PORT=8080
DATABASE_NAME=media_sequencer
MONGODB_URI=your_mongodb_connection_string
FRONTEND_URL=http://localhost:5173
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
```

## Main API Routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Backend health |
| GET | `/api/media` | Get media library |
| GET | `/api/windows` | Get display windows |
| POST | `/api/windows/:windowId/playlist-items` | Add playlist item |
| POST | `/api/sync` | Start synchronized playback |
| GET | `/api/sync/active` | Get active sync |
| WS | `/ws` | Real-time sync events |

## Deployment

- Backend is deployed on Render with `backend` as the root directory.
- Frontend is deployed on Vercel with `frontend` as the root directory.
- Production URLs are configured using environment variables.
