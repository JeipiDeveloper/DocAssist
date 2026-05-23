const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();

const API_KEY = process.env.API_KEY || '';

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'editais.json');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const safe = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, safe);
  }
});

const upload = multer({ storage });

const app = express();

app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.json());
app.use(cors());

// GET list of editais (public)
app.get('/api/editais', (req, res) => {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8') || '[]';
    const arr = JSON.parse(raw);
    return res.json(arr);
  } catch (err) {
    console.error(err);
    return res.status(500).json([]);
  }
});

// POST upload edital (requires x-api-key header)
app.post('/api/editais', upload.single('file'), (req, res) => {
  try {
    const key = req.headers['x-api-key'] || req.body.api_key || '';
    if (!API_KEY || key !== API_KEY) return res.status(401).json({ error: 'Unauthorized' });

    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    const title = req.body.title || req.body.titulo || file.originalname;

    const item = {
      id: Date.now(),
      title,
      summary: '',
      originalName: file.originalname,
      storedName: file.filename,
      path: '/uploads/' + file.filename,
      uploadedAt: new Date().toISOString()
    };

    const raw = fs.readFileSync(DATA_FILE, 'utf8') || '[]';
    const arr = JSON.parse(raw);
    arr.unshift(item);
    fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), 'utf8');

    return res.status(201).json(item);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
