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

// Seed data if empty
function seedIfEmpty() {
  const db = readDB();
  if (db.jobs.length === 0) {
    db.jobs = [
    {
        "id": "seed-1",
        "title": "Senior Software Engineer",
        "description": "Sample description for Senior Software Engineer. This is test data for the flaky test detection research study.",
        "category": "Engineering",
        "createdAt": "2026-07-21T00:21:18.606Z",
        "status": "open",
        "company": "TechCorp",
        "salary": "€40000",
        "location": "Dublin"
    },
    {
        "id": "seed-2",
        "title": "UX Designer",
        "description": "Sample description for UX Designer. This is test data for the flaky test detection research study.",
        "category": "Design",
        "createdAt": "2026-07-20T00:21:18.607Z",
        "status": "closed",
        "company": "StartupXYZ",
        "salary": "€45000",
        "location": "Remote"
    },
    {
        "id": "seed-3",
        "title": "Marketing Manager",
        "description": "Sample description for Marketing Manager. This is test data for the flaky test detection research study.",
        "category": "Marketing",
        "createdAt": "2026-07-19T00:21:18.607Z",
        "status": "filled",
        "company": "BigCo",
        "salary": "€50000",
        "location": "London"
    },
    {
        "id": "seed-4",
        "title": "Data Analyst",
        "description": "Sample description for Data Analyst. This is test data for the flaky test detection research study.",
        "category": "Sales",
        "createdAt": "2026-07-18T00:21:18.607Z",
        "status": "open",
        "company": "Agency Ltd",
        "salary": "€55000",
        "location": "Berlin"
    },
    {
        "id": "seed-5",
        "title": "Product Manager",
        "description": "Sample description for Product Manager. This is test data for the flaky test detection research study.",
        "category": "Finance",
        "createdAt": "2026-07-17T00:21:18.607Z",
        "status": "closed",
        "company": "Remote Inc",
        "salary": "€60000",
        "location": "Dublin"
    },
    {
        "id": "seed-6",
        "title": "DevOps Engineer",
        "description": "Sample description for DevOps Engineer. This is test data for the flaky test detection research study.",
        "category": "Engineering",
        "createdAt": "2026-07-16T00:21:18.607Z",
        "status": "filled",
        "company": "TechCorp",
        "salary": "€65000",
        "location": "Remote"
    },
    {
        "id": "seed-7",
        "title": "Sales Executive",
        "description": "Sample description for Sales Executive. This is test data for the flaky test detection research study.",
        "category": "Design",
        "createdAt": "2026-07-15T00:21:18.607Z",
        "status": "open",
        "company": "StartupXYZ",
        "salary": "€70000",
        "location": "London"
    },
    {
        "id": "seed-8",
        "title": "Content Writer",
        "description": "Sample description for Content Writer. This is test data for the flaky test detection research study.",
        "category": "Marketing",
        "createdAt": "2026-07-14T00:21:18.607Z",
        "status": "closed",
        "company": "BigCo",
        "salary": "€75000",
        "location": "Berlin"
    }
];
    writeDB(db);
  }
}
seedIfEmpty();

// GET all
app.get('/api/jobs', (req, res) => {
  const db = readDB();
  let items = db.jobs;
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    items = items.filter(i => i.title && i.title.toLowerCase().includes(q) || (i.name && i.name.toLowerCase().includes(q)));
  }
  if (req.query.category) {
    items = items.filter(i => i.category === req.query.category);
  }
  res.json(items);
});

// GET one
app.get('/api/jobs/:id', (req, res) => {
  const db = readDB();
  const item = db.jobs.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

// POST create
app.post('/api/jobs', (req, res) => {
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
app.get('/api/health', (req, res) => res.json({ status: 'ok', project: 'Job Board' }));

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => console.log('Job Board server running on http://localhost:3006'));
