import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import pty from 'node-pty';

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT ?? '3000', 10);

const app = next({ dev });
const handle = app.getRequestHandler();

await app.prepare();

const httpServer = createServer(async (req, res) => {
  const parsedUrl = parse(req.url, true);
  await handle(req, res, parsedUrl);
});

const wss = new WebSocketServer({ noServer: true });

// ── /ws/data — broadcast system metrics to all dashboard clients ──
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

async function pollEndpoint(path, type, target) {
  try {
    const res = await fetch(`http://localhost:${port}${path}`);
    if (!res.ok) return;
    const data = await res.json();
    if (target) {
      if (target.readyState === 1) target.send(JSON.stringify({ type, data }));
    } else {
      broadcast(type, data);
    }
  } catch {}
}

async function sendInitialData(ws) {
  await Promise.all([
    pollEndpoint('/api/metrics',   'metrics',   ws),
    pollEndpoint('/api/hardware',  'hardware',  ws),
    pollEndpoint('/api/power',     'power',     ws),
    pollEndpoint('/api/processes', 'processes', ws),
    pollEndpoint('/api/status',    'status',    ws),
    pollEndpoint('/api/events',    'events',    ws),
  ]);
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
    socket.destroy();
  }
});

httpServer.listen(port, () => {
  console.log(`> Ready on http://localhost:${port}`);

  setInterval(() => pollEndpoint('/api/metrics',   'metrics'),   15_000);
  setInterval(() => pollEndpoint('/api/hardware',  'hardware'),  15_000);
  setInterval(() => pollEndpoint('/api/power',     'power'),     15_000);
  setInterval(() => pollEndpoint('/api/processes', 'processes'), 15_000);
  setInterval(() => pollEndpoint('/api/status',    'status'),    30_000);
  setInterval(() => pollEndpoint('/api/events',    'events'),    30_000);
});
