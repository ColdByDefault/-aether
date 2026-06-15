# aether/daemon

A real-time server monitoring dashboard with AI-assisted health analysis and web terminal access.

## Features

- **System Metrics** — Live CPU, memory, disk, uptime, and load average via `/proc` and `/sys`
- **CPU Temperature** — Reads thermal zones directly from the host
- **Power Monitoring** — Tracks system power consumption
- **Process Monitor** — Top processes by CPU/memory usage
- **Service & Container Status** — Monitors running services, Docker containers, cron jobs, open ports, and TCP connections
- **Event Feed** — Recent system events from the last 24 hours
- **APT Updates** — Reports available package upgrades
- **AI Health Analysis** — Daily automated analysis via Ollama (default model: `qwen3:8b`)
- **Web Terminal** — In-browser shell access to the host via XTerm + WebSocket + `node-pty`
- **Hermes Integration** — Trigger cron jobs via the Hermes job scheduler
- **Real-time Updates** — WebSocket broadcasting to all connected clients

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (React 19, TypeScript) |
| Styling | Tailwind CSS 4, shadcn/ui |
| Terminal | XTerm 5, node-pty |
| WebSockets | ws 8 |
| AI | Ollama (local LLM) |
| Runtime | Node.js custom server (`server.mjs`) |

---

## Prerequisites

- Node.js ≥ 20 and [pnpm](https://pnpm.io/) **or** Docker
- Ollama running locally (for AI analysis) — [install guide](https://ollama.com/download)
- Pull the model: `ollama pull qwen3:8b`

---

## Setup

### 1. Clone & install

```bash
git clone https://github.com/ColdByDefault/-aether.git
cd -aether
pnpm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
NODE_ENV=production

# Server identity
SERVER_IP=192.***.*.***
SERVER_HOSTNAME=my-server

# Ports
HERMES_PORT=9119
OLLAMA_PORT=11434
NGINX_PORT=80          # optional

# AI analysis
OLLAMA_MODEL=****
ANALYZE_HOUR=8         # hour (24h) to run daily analysis
```

### 3. Run

**Development:**
```bash
pnpm dev          # Next.js dev server on :3001
pnpm dev:local    # Custom server (WebSocket support) on :3001
```

**Production:**
```bash
pnpm build
pnpm start        # Runs server.mjs on :3000
```

---

## Docker (Recommended)

The helper script wraps `docker compose` with sensible defaults:

```bash
./start.sh              # Build & start on port 3000
./start.sh -p 8080      # Use a different port
./start.sh stop         # Stop the container
./start.sh restart      # Restart
./start.sh logs         # Tail logs
./start.sh build        # Build image only
```

The container runs with `--network host` and `--privileged` so it can read `/proc` and `/sys` and spawn a shell into the host PID namespace via `nsenter`.

---

## API Routes

| Route | Description |
|---|---|
| `GET /api/metrics` | CPU, memory, disk, uptime |
| `GET /api/hardware` | CPU temperatures, swap |
| `GET /api/status` | Services, containers, ports, cron |
| `GET /api/processes` | Top processes |
| `GET /api/power` | Power metrics |
| `GET /api/events` | System event log |
| `GET /api/reports/apt-updates` | Pending APT upgrades |
| `POST /api/analyze` | Trigger / fetch AI health analysis |
| `POST /api/hermes/trigger` | Trigger a Hermes job |

WebSocket endpoints (on the same port):

| Endpoint | Description |
|---|---|
| `/ws/data` | Live metrics broadcast |
| `/ws/terminal` | PTY shell session |

---

## Project Structure

```
app/
  page.tsx              # Main dashboard
  terminal/page.tsx     # Web terminal
  api/                  # All API routes
components/             # UI components (metrics, charts, AI panel, etc.)
context/                # React context for shared system data
hooks/                  # Data-fetching hooks
lib/                    # Data bus utilities
server.mjs              # Custom Node.js server (WebSocket + PTY)
```
