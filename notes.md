Tier 1 — You'll regret not having these

Web terminal (xterm.js + WebSocket shell) — when something breaks and you need to type a command, this saves you. Everything else is a convenience, this is a necessity.
Docker container controls — start / stop / restart buttons per container. You already show them, one step away.
Real-time log tail — click a container or service → see its last 100 lines. Otherwise you SSH just to read a log.
Disk usage breakdown — not just % used, but what's eating it (du on key dirs, docker image sizes). Disks fill silently.
Tier 2 — You'll want these within a week

apt update check — show count of upgradable packages, one button to run apt upgrade and stream output.
Service restart buttons — nginx down? click restart instead of opening a terminal.
Docker system prune — single button to reclaim space from dangling images/volumes. Huge on a server running 24/7.
Tier 3 — Nice, not urgent

Trigger Hermes jobs on demand (you already display them)
Reboot / shutdown (gated behind a confirm modal)
Push notifications when something goes down (browser push or webhook)