import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from dist folder
app.use(express.static(join(__dirname, 'frontend/dist')));

// Serve all routes to index.html (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AISLA Server running on port ${PORT}`);
});
