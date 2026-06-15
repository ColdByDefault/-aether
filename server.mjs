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
  } else {
    socket.destroy();
  }
});

httpServer.listen(port, () => {
  console.log(`> Ready on http://localhost:${port}`);
});
