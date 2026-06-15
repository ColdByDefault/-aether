import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import pty from 'node-pty';
import { EventEmitter } from 'events';

// ── In-process data bus ──────────────────────────────────────────────────────
// Route modules call push() via lib/data-bus.ts → globalThis.__dataBus.
// Must be assigned before any route module loads (routes load lazily on first request).
{
  const emitter = new EventEmitter();
  emitter.setMaxListeners(50);
  const store = new Map();
  globalThis.__dataBus = {
    push(type, data) { store.set(type, data); emitter.emit(type, data); },
    on(type, fn)     { emitter.on(type, fn); },
    snapshot()       { return Object.fromEntries(store); },
  };
}

// ── Silence Next.js per-request logs for /api/* routes ──────────────────────
{
  const _write = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk, enc, cb) => {
    const cb_ = typeof enc === 'function' ? enc : cb;
    if (/ (GET|POST|PUT|DELETE|PATCH) \/api\/.+ \d{3} in /.test(chunk.toString())) {
      cb_?.();
      return true;
    }
    return _write(chunk, enc, cb);
  };
}

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT ?? '3000', 10);

const app = next({ dev, hostname: '0.0.0.0', port });
const handle = app.getRequestHandler();

await app.prepare();

const httpServer = createServer(async (req, res) => {
  const parsedUrl = parse(req.url, true);
  await handle(req, res, parsedUrl);
});

const wss = new WebSocketServer({ noServer: true });

// ── /ws/data — broadcast system metrics to all dashboard clients ──────────────
const datawss = new WebSocketServer({ noServer: true });
const dataClients = new Set();

datawss.on('connection', (ws) => {
  dataClients.add(ws);
  sendInitialData(ws);
  ws.on('close', () => dataClients.delete(ws));
  ws.on('error', () => dataClients.delete(ws));
});

function broadcast(type, data) {
  const msg = JSON.stringify({ type, data });
  for (const ws of dataClients) {
    if (ws.readyState === 1) ws.send(msg);
  }
}

// Subscribe: route modules push to globalThis.__dataBus after each background refresh
const bus = globalThis.__dataBus;
for (const type of ['metrics', 'power', 'processes', 'status', 'events']) {
  bus.on(type, (data) => broadcast(type, data));
}

// hardware/route.ts is root-owned and cannot call push(); poll it via HTTP instead.
// Logs from this endpoint are suppressed by the stdout filter above.
async function pollHardware(target) {
  try {
    const res = await fetch(`http://localhost:${port}/api/hardware`);
    if (!res.ok) return;
    const data = await res.json();
    if (target) {
      if (target.readyState === 1) target.send(JSON.stringify({ type: 'hardware', data }));
    } else {
      broadcast('hardware', data);
    }
  } catch {}
}

async function sendInitialData(ws) {
  // Send whatever the bus already has (populated by route module refreshes)
  for (const [type, data] of Object.entries(bus.snapshot())) {
    if (ws.readyState === 1) ws.send(JSON.stringify({ type, data }));
  }
  // hardware is not on the bus — always fetch it directly
  await pollHardware(ws);
}

wss.on('connection', (ws) => {
  // nsenter into the host's PID 1 namespaces to get a real host shell.
  // Falls back to the container shell if nsenter isn't available or fails.
  let shell;
  try {
    shell = pty.spawn('nsenter', ['-t', '1', '-m', '-u', '-i', '-n', '-p', '--', '/bin/bash', '-l'], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: '/root',
      env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' },
    });
  } catch {
    shell = pty.spawn('/bin/sh', [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      env: { ...process.env, TERM: 'xterm-256color' },
    });
  }

  shell.onData((data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'output', data }));
    }
  });

  shell.onExit(() => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'exit' }));
      ws.close();
    }
  });

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'input') shell.write(msg.data);
      if (msg.type === 'resize') shell.resize(Math.max(1, msg.cols), Math.max(1, msg.rows));
    } catch {}
  });

  ws.on('close', () => {
    try { shell.kill(); } catch {}
  });
});

const nextUpgradeHandler = app.getUpgradeHandler();

httpServer.on('upgrade', (req, socket, head) => {
  const { pathname } = parse(req.url);
  if (pathname === '/ws/terminal') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else if (pathname === '/ws/data') {
    datawss.handleUpgrade(req, socket, head, (ws) => {
      datawss.emit('connection', ws, req);
    });
  } else {
    nextUpgradeHandler(req, socket, head);
  }
});

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`> Ready on http://localhost:${port}`);

  // Warm up route modules so their background refresh intervals start immediately.
  // Logs from these initial requests are suppressed by the stdout filter above.
  for (const path of ['/api/metrics', '/api/power', '/api/processes', '/api/status', '/api/events']) {
    fetch(`http://localhost:${port}${path}`).catch(() => {});
  }

  // Only hardware needs a periodic poll (all other types push via the data bus)
  setInterval(() => pollHardware(), 15_000);
});
