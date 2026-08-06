const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3006;
const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ============================================================
// FLAKINESS INJECTION LAYER
// Controls which endpoints behave unreliably and how often
// Used for: MSc Dissertation - AI-Assisted Flaky Test Detection
// ============================================================
const FLAKY_CONFIG = {
  enabled: true,
  slowEndpoints: ['/api/jobs', '/api/jobs/:id'],  // GET endpoints that randomly slow down
  errorEndpoints: ['/api/jobs'],                       // POST endpoint that randomly errors
  slowProbability: 0.35,    // 35% chance of slow response
  errorProbability: 0.25,   // 25% chance of server error on POST
  slowDelayMs: {
    min: 3000,
    max: 8000
  }
};

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shouldBeFlaky(probability) {
  return FLAKY_CONFIG.enabled && Math.random() < probability;
}

// Flakiness middleware for GET /api/jobs
function flakyGetMiddleware(req, res, next) {
  if (shouldBeFlaky(FLAKY_CONFIG.slowProbability)) {
    const delay = randomDelay(FLAKY_CONFIG.slowDelayMs.min, FLAKY_CONFIG.slowDelayMs.max);
    console.log(`[FLAKY] Injecting ${delay}ms delay on GET /api/jobs`);
    setTimeout(next, delay);
  } else {
    next();
  }
}

// ============================================================

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { jobs: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function seedIfEmpty() {
  const db = readDB();
  if (db.jobs.length === 0) {
    db.jobs = [
    {
        "id": "seed-1",
        "title": "Senior Software Engineer",
        "description": "Sample description for research study item 1.",
        "category": "Engineering",
        "createdAt": "2024-01-01T10:00:00.000Z",
        "company": "Company 1",
        "location": "Dublin",
        "salary": "\u20ac40000"
    },
    {
        "id": "seed-2",
        "title": "UX Designer",
        "description": "Sample description for research study item 2.",
        "category": "Design",
        "createdAt": "2024-02-02T10:00:00.000Z",
        "company": "Company 2",
        "location": "Dublin",
        "salary": "\u20ac45000"
    },
    {
        "id": "seed-3",
        "title": "Marketing Manager",
        "description": "Sample description for research study item 3.",
        "category": "Marketing",
        "createdAt": "2024-03-03T10:00:00.000Z",
        "company": "Company 3",
        "location": "Dublin",
        "salary": "\u20ac50000"
    },
    {
        "id": "seed-4",
        "title": "Data Analyst",
        "description": "Sample description for research study item 4.",
        "category": "Sales",
        "createdAt": "2024-04-04T10:00:00.000Z",
        "company": "Company 4",
        "location": "Dublin",
        "salary": "\u20ac55000"
    },
    {
        "id": "seed-5",
        "title": "Product Manager",
        "description": "Sample description for research study item 5.",
        "category": "Engineering",
        "createdAt": "2024-05-05T10:00:00.000Z",
        "company": "Company 5",
        "location": "Dublin",
        "salary": "\u20ac60000"
    },
    {
        "id": "seed-6",
        "title": "DevOps Engineer",
        "description": "Sample description for research study item 6.",
        "category": "Design",
        "createdAt": "2024-06-06T10:00:00.000Z",
        "company": "Company 6",
        "location": "Dublin",
        "salary": "\u20ac65000"
    },
    {
        "id": "seed-7",
        "title": "Sales Executive",
        "description": "Sample description for research study item 7.",
        "category": "Marketing",
        "createdAt": "2024-07-07T10:00:00.000Z",
        "company": "Company 7",
        "location": "Dublin",
        "salary": "\u20ac70000"
    },
    {
        "id": "seed-8",
        "title": "Content Writer",
        "description": "Sample description for research study item 8.",
        "category": "Sales",
        "createdAt": "2024-08-08T10:00:00.000Z",
        "company": "Company 8",
        "location": "Dublin",
        "salary": "\u20ac75000"
    }
];
    writeDB(db);
  }
}
seedIfEmpty();

// GET all - with flakiness injection
app.get('/api/jobs', flakyGetMiddleware, (req, res) => {
  const db = readDB();
  let items = db.jobs;
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    items = items.filter(i => (i.title && i.title.toLowerCase().includes(q)) || (i.name && i.name.toLowerCase().includes(q)));
  }
  if (req.query.category) {
    items = items.filter(i => i.category === req.query.category);
  }
  res.json(items);
});

// GET one - with flakiness injection
app.get('/api/jobs/:id', (req, res) => {
  if (shouldBeFlaky(FLAKY_CONFIG.slowProbability * 0.5)) {
    const delay = randomDelay(2000, 5000);
    console.log(`[FLAKY] Injecting ${delay}ms delay on GET /api/jobs/${req.params.id}`);
    setTimeout(() => {
      const db = readDB();
      const item = db.jobs.find(i => i.id === req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json(item);
    }, delay);
  } else {
    const db = readDB();
    const item = db.jobs.find(i => i.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  }
});

// POST create - with flakiness injection (random 500 errors)
app.post('/api/jobs', (req, res) => {
  if (shouldBeFlaky(FLAKY_CONFIG.errorProbability)) {
    console.log(`[FLAKY] Injecting 500 error on POST /api/jobs`);
    return res.status(500).json({ error: 'Internal server error - flaky injection' });
  }
  const db = readDB();
  const item = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
  db.jobs.push(item);
  writeDB(db);
  res.status(201).json(item);
});

// PUT update
app.put('/api/jobs/:id', (req, res) => {
  const db = readDB();
  const idx = db.jobs.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.jobs[idx] = { ...db.jobs[idx], ...req.body, updatedAt: new Date().toISOString() };
  writeDB(db);
  res.json(db.jobs[idx]);
});

// DELETE
app.delete('/api/jobs/:id', (req, res) => {
  const db = readDB();
  const idx = db.jobs.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.jobs.splice(idx, 1);
  writeDB(db);
  res.json({ message: 'Deleted successfully' });
});

// Reset endpoint for testing
app.post('/api/reset', (req, res) => {
  const initial = { jobs: [] };
  writeDB(initial);
  seedIfEmpty();
  res.json({ message: 'Database reset' });
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', project: 'Job Board', flakyEnabled: FLAKY_CONFIG.enabled }));

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => console.log('Job Board server running on http://localhost:3006 [FLAKY MODE: ' + FLAKY_CONFIG.enabled + ']'));
