import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), 'data.json');
const MATCHES_DIR = path.join(process.cwd(), 'data', 'matches');

// Ensure directory exists
fs.mkdir(MATCHES_DIR, { recursive: true }).catch(console.error);

app.use(express.json());

let clients: express.Response[] = [];
let globalConfig = { shiftRight: false, showEndgame: false, rankingsPhase: 'FINALS', rankingsMatch: 'MATCH 5' };

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  
  clients.push(res);
  
  // Send initial config
  res.write(`event: config\n`);
  res.write(`data: ${JSON.stringify(globalConfig)}\n\n`);
  
  req.on('close', () => {
    clients = clients.filter(c => c !== res);
  });
});

app.get('/api/config', (req, res) => {
  res.json(globalConfig);
});

app.post('/api/config', (req, res) => {
  globalConfig = { ...globalConfig, ...req.body };
  clients.forEach(c => {
    c.write(`event: config\n`);
    c.write(`data: ${JSON.stringify(globalConfig)}\n\n`);
  });
  res.json(globalConfig);
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Failed to read data' });
  }
});

app.post('/api/leaderboard', async (req, res) => {
  try {
    const newData = req.body;
    await fs.writeFile(DATA_FILE, JSON.stringify(newData, null, 2));
    
    // Notify clients
    clients.forEach(c => c.write(`data: ${JSON.stringify(newData)}\n\n`));
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to write data' });
  }
});

app.post('/api/test-elimination', (req, res) => {
  clients.forEach(c => {
    c.write(`event: testElimination\n`);
    c.write(`data: {}\n\n`);
  });
  res.json({ success: true });
});

app.post('/api/history', async (req, res) => {
  try {
    const { matchDay, matchNumber, teams } = req.body;
    const timestamp = Date.now();
    const filename = `day-${matchDay}-num-${matchNumber}-${timestamp}.txt`;
    const filepath = path.join(MATCHES_DIR, filename);
    
    const dataToSave = {
      matchDay,
      matchNumber,
      timestamp,
      teams
    };
    
    await fs.writeFile(filepath, JSON.stringify(dataToSave, null, 2));
    res.json({ success: true, filename });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save history' });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const files = await fs.readdir(MATCHES_DIR);
    const historyFiles = files.filter(f => f.endsWith('.txt'));
    
    const history = [];
    for (const file of historyFiles) {
      const content = await fs.readFile(path.join(MATCHES_DIR, file), 'utf-8');
      try {
        const parsed = JSON.parse(content);
        history.push({
          filename: file,
          matchDay: parsed.matchDay,
          matchNumber: parsed.matchNumber,
          timestamp: parsed.timestamp
        });
      } catch(e) {
        // Skip invalid JSON
      }
    }
    
    // Sort by timestamp descending
    history.sort((a, b) => b.timestamp - a.timestamp);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read history' });
  }
});

app.get('/api/history/:filename', async (req, res) => {
  try {
    const filepath = path.join(MATCHES_DIR, req.params.filename);
    const content = await fs.readFile(filepath, 'utf-8');
    res.send(content);
  } catch (err) {
    res.status(404).json({ error: 'File not found' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
