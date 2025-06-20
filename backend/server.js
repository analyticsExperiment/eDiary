const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return { entries: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function generateId(data) {
  return data.entries.length ? Math.max(...data.entries.map(e => e.id)) + 1 : 1;
}

function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const data = readData();
  if (req.method === 'GET' && url.pathname === '/api/entries') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data.entries));
  } else if (req.method === 'POST' && url.pathname === '/api/entries') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const entry = JSON.parse(body);
        entry.id = generateId(data);
        entry.date = entry.date || new Date().toISOString();
        data.entries.push(entry);
        writeData(data);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(entry));
      } catch (err) {
        res.writeHead(400);
        res.end('Invalid JSON');
      }
    });
  } else if (req.method === 'GET' && url.pathname.startsWith('/api/entries/')) {
    const id = parseInt(url.pathname.split('/').pop());
    const entry = data.entries.find(e => e.id === id);
    if (entry) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(entry));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  } else if (req.method === 'DELETE' && url.pathname.startsWith('/api/entries/')) {
    const id = parseInt(url.pathname.split('/').pop());
    const index = data.entries.findIndex(e => e.id === id);
    if (index !== -1) {
      data.entries.splice(index, 1);
      writeData(data);
      res.writeHead(204);
      res.end();
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  } else if (req.method === 'GET' && url.pathname === '/api/analytics') {
    const moods = {};
    data.entries.forEach(e => {
      const day = e.date.split('T')[0];
      moods[day] = moods[day] || [];
      moods[day].push(e.mood || 0);
    });
    const dailyAverages = Object.entries(moods).map(([day, arr]) => ({
      day,
      mood: arr.reduce((a, b) => a + b, 0) / arr.length
    }));
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(dailyAverages));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
}

const server = http.createServer(handleRequest);
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port', PORT));
