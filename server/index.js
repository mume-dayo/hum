import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { UploadClient } from '../lib/upload-client.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, unlinkSync, readFileSync } from 'fs';
import multer from 'multer';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const API_KEY = 'mumei114514';
const DOMAIN = 'file.mumeidayo.online';

console.log('🚀 Starting File Manager...');
console.log('API Key:', API_KEY);
console.log('Domain:', DOMAIN);
console.log('Storage: catbox.moe (200MB limit, no auth required)');

// Create temp upload directory
const uploadDir = path.join(__dirname, '../temp');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

// Storage file for persistence
const storageFile = path.join(__dirname, '../data/files.json');
const dataDir = path.join(__dirname, '../data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Initialize upload client
const uploadClient = new UploadClient();

// Load saved files on startup
if (existsSync(storageFile)) {
  try {
    const savedFiles = JSON.parse(readFileSync(storageFile, 'utf-8'));
    savedFiles.forEach(file => {
      uploadClient.uploadedFiles.set(file.id, file);
    });
    console.log(`📂 Loaded ${savedFiles.length} files from storage`);
  } catch (err) {
    console.error('Failed to load storage:', err);
  }
}

// Save files periodically
setInterval(async () => {
  try {
    const files = uploadClient.listFiles();
    const { writeFile } = await import('fs/promises');
    await writeFile(storageFile, JSON.stringify(files, null, 2));
  } catch (err) {
    console.error('Failed to save storage:', err);
  }
}, 60000); // Every minute

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit for catbox.moe
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Key authentication middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ success: false, error: 'Invalid or missing API key' });
  }
  next();
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    storage: 'catbox.moe',
    limit: '200MB',
    auth: 'required for upload'
  });
});

// List files
app.get('/api/files', (req, res) => {
  try {
    const files = uploadClient.listFiles();
    res.json({ success: true, files });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload file (requires API key)
app.post('/api/files/upload', authenticateApiKey, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  try {
    const fileInfo = await uploadClient.uploadFile(req.file.path, req.file.originalname);

    // Clean up temp file
    try {
      unlinkSync(req.file.path);
    } catch (e) {
      console.error('Failed to clean up temp file:', e);
    }

    res.json({ success: true, file: fileInfo });
  } catch (error) {
    // Clean up temp file on error
    try {
      unlinkSync(req.file.path);
    } catch (e) {
      console.error('Failed to clean up temp file:', e);
    }

    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete file
app.delete('/api/files/:fileId', (req, res) => {
  const { fileId } = req.params;

  try {
    uploadClient.deleteFile(fileId);
    res.json({ success: true, message: 'File deleted from list' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get file info
app.get('/api/files/:fileId', (req, res) => {
  const { fileId } = req.params;

  try {
    const fileInfo = uploadClient.getFileInfo(fileId);

    if (!fileInfo) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    res.json({ success: true, file: fileInfo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Video embed page
app.get('/v/:fileId', (req, res) => {
  const { fileId } = req.params;
  const fileInfo = uploadClient.getFileInfo(fileId);

  if (!fileInfo) {
    return res.status(404).send('File not found');
  }

  const videoUrl = fileInfo.url;
  const fileName = fileInfo.name;
  const fileSize = uploadClient.formatBytes(fileInfo.size);

  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(fileName)} - File Manager</title>

  <!-- Open Graph / Discord Embed -->
  <meta property="og:type" content="video.other">
  <meta property="og:title" content="${escapeHtml(fileName)}">
  <meta property="og:description" content="サイズ: ${fileSize}">
  <meta property="og:video" content="${videoUrl}">
  <meta property="og:video:url" content="${videoUrl}">
  <meta property="og:video:secure_url" content="${videoUrl}">
  <meta property="og:video:type" content="video/mp4">
  <meta property="og:video:width" content="1280">
  <meta property="og:video:height" content="720">
  <meta property="og:site_name" content="File Manager">
  <meta name="theme-color" content="#667eea">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="player">
  <meta name="twitter:title" content="${escapeHtml(fileName)}">
  <meta name="twitter:player" content="${videoUrl}">
  <meta name="twitter:player:width" content="1280">
  <meta name="twitter:player:height" content="720">

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #0a0a0a;
      color: white;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      width: 100%;
    }

    h1 {
      text-align: center;
      margin-bottom: 20px;
      font-size: 1.5rem;
    }

    .video-wrapper {
      position: relative;
      width: 100%;
      background: #000;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    }

    video {
      width: 100%;
      height: auto;
      display: block;
    }

    .info {
      text-align: center;
      margin-top: 20px;
      color: #999;
    }

    .btn {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 24px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      transition: background 0.3s;
    }

    .btn:hover {
      background: #5568d3;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎬 ${escapeHtml(fileName)}</h1>
    <div class="video-wrapper">
      <video controls preload="metadata">
        <source src="${videoUrl}" type="video/mp4">
        お使いのブラウザは動画タグをサポートしていません。
      </video>
    </div>
    <div class="info">
      <p>サイズ: ${fileSize}</p>
      <a href="/" class="btn">🏠 ホームに戻る</a>
    </div>
  </div>
</body>
</html>
  `.trim();

  res.send(html);
});

// Helper function to escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Start server (for local development only)
if (process.env.NODE_ENV !== 'production') {
  const PORT = 1134;
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🔑 API Key: ${API_KEY}`);
    console.log(`🌐 Domain: ${DOMAIN}`);
  });
}

// Export for Netlify
export default app;
