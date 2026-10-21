import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { DEFAULT_VSB_KNOWLEDGE, DocumentChunk, DocumentRecord } from './server/knowledgeBase.js';
import { extractTextFromFile, chunkText } from './server/documentProcessor.js';
import { generateCollegeResponse } from './server/geminiService.js';
import { checkSupabaseConnection, isSupabaseConfigured } from './server/supabaseClient.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'vsbadmin2025';

// Configure multer for file uploads in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// In-memory knowledge store with persistent file backup
const DATA_DIR = path.join(__dirname, 'data');
const DOCS_FILE = path.join(DATA_DIR, 'documents.json');
const CHUNKS_FILE = path.join(DATA_DIR, 'chunks.json');

let documents: DocumentRecord[] = [];
let knowledgeChunks: DocumentChunk[] = [];

function loadStoredData() {
  try {
    if (fs.existsSync(DOCS_FILE) && fs.existsSync(CHUNKS_FILE)) {
      documents = JSON.parse(fs.readFileSync(DOCS_FILE, 'utf-8'));
      knowledgeChunks = JSON.parse(fs.readFileSync(CHUNKS_FILE, 'utf-8'));
      console.log(`Loaded ${documents.length} documents and ${knowledgeChunks.length} chunks from storage.`);
    } else {
      // Seed default institutional records
      documents = [
        {
          id: 'seed-vsb-overview',
          name: 'VSB_College_Official_Handbook_2025.txt',
          mimeType: 'text/plain',
          size: 4096,
          uploadedAt: new Date().toISOString(),
          chunkCount: DEFAULT_VSB_KNOWLEDGE.length,
          summary: 'Verified campus overview: Autonomous status, NAAC A, 2002 inception, TNEA code 2622, placements, labs, buses, hostels.',
          rawTextPreview: DEFAULT_VSB_KNOWLEDGE.map((c) => c.content).join('\n\n').slice(0, 400) + '...',
        },
      ];
      knowledgeChunks = [...DEFAULT_VSB_KNOWLEDGE];
      saveStoredData();
    }
  } catch (err) {
    console.error('Error loading stored documents, using default knowledge:', err);
    documents = [
      {
        id: 'seed-vsb-overview',
        name: 'VSB_College_Official_Handbook_2025.txt',
        mimeType: 'text/plain',
        size: 4096,
        uploadedAt: new Date().toISOString(),
        chunkCount: DEFAULT_VSB_KNOWLEDGE.length,
        summary: 'Verified campus overview: Autonomous status, NAAC A, 2002 inception, TNEA code 2622.',
      },
    ];
    knowledgeChunks = [...DEFAULT_VSB_KNOWLEDGE];
  }
}

function saveStoredData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DOCS_FILE, JSON.stringify(documents, null, 2), 'utf-8');
    fs.writeFileSync(CHUNKS_FILE, JSON.stringify(knowledgeChunks, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving documents to disk:', err);
  }
}

loadStoredData();

// Retrieval helper: simple keyword-scoring and TF-IDF style semantic matching
function searchKnowledge(query: string, limit: number = 6): DocumentChunk[] {
  if (!query.trim() || knowledgeChunks.length === 0) return [];

  const terms = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (terms.length === 0) return knowledgeChunks.slice(0, limit);

  const scored = knowledgeChunks.map((chunk) => {
    const text = (chunk.content + ' ' + chunk.documentName).toLowerCase();
    let score = 0;

    for (const term of terms) {
      if (text.includes(term)) {
        score += 2;
        // Count occurrences
        const matches = text.split(term).length - 1;
        score += Math.min(matches, 5);
      }
    }

    // Boost chunks with exact phrase matches or strong college keywords
    if (query.toLowerCase().includes('tnea') && text.includes('tnea')) score += 5;
    if (query.toLowerCase().includes('placement') && text.includes('placement')) score += 5;
    if (query.toLowerCase().includes('bus') && text.includes('bus')) score += 5;
    if (query.toLowerCase().includes('hostel') && text.includes('hostel')) score += 5;
    if (query.toLowerCase().includes('fee') && (text.includes('fee') || text.includes('counselling'))) score += 4;
    if (query.toLowerCase().includes('course') && (text.includes('b.e') || text.includes('b.tech') || text.includes('program'))) score += 5;

    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Return highest scored items that have at least some relevance
  const top = scored.filter((s) => s.score > 0).slice(0, limit).map((s) => s.chunk);

  // If query didn't match any specific terms (e.g. conversational question like "Tell me everything about the college"), return general overview
  if (top.length === 0) {
    return knowledgeChunks.slice(0, 3);
  }

  return top;
}

// Authentication middleware for administrative operations
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const adminToken = req.headers['x-admin-token'] as string;

  const providedKey = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '') || adminToken || (req.query.token as string);

  if (!providedKey || providedKey !== ADMIN_SECRET) {
    res.status(401).json({ error: 'Unauthorized: Valid college administrator key required' });
    return;
  }
  next();
}

// ================= API ROUTES =================

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    institution: 'VSB Engineering College, Karur',
    documentCount: documents.length,
    chunkCount: knowledgeChunks.length,
    supabaseConfigured: isSupabaseConfigured(),
    timestamp: new Date().toISOString(),
  });
});

// Admin Login
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { secretKey } = req.body;
  if (!secretKey) {
    return res.status(400).json({ error: 'Admin secret key is required' });
  }

  if (secretKey === ADMIN_SECRET) {
    return res.json({
      success: true,
      token: ADMIN_SECRET,
      role: 'administrator',
      message: 'Access granted to VSB College Knowledge Management',
    });
  }

  return res.status(401).json({ error: 'Invalid administrator secret key' });
});

// Chat endpoint (uses server-side Gemini + RAG over college knowledge base)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { query, history = [] } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Retrieve knowledge base chunks
    const relevantChunks = searchKnowledge(query, 5);

    // Call Gemini API through secure server-side integration
    const result = await generateCollegeResponse(query, history, relevantChunks);

    return res.json({
      answer: result.answer,
      penguinState: result.penguinState,
      sources: result.sources,
      retrievedChunksCount: relevantChunks.length,
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    return res.status(500).json({
      error: 'Failed to process chat query',
      details: err?.message || 'Server error',
    });
  }
});

// Get documents list
app.get('/api/documents', (req: Request, res: Response) => {
  res.json({
    documents,
    totalChunks: knowledgeChunks.length,
    modelExists: fs.existsSync(path.join(__dirname, 'public', 'Meshy_AI_VSB_Tech_Penguin_1012173021_texture.glb')),
  });
});

// Upload document (Admin only)
app.post('/api/documents/upload', requireAdmin, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, mimetype, size, buffer } = req.file;
    const documentId = 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // Extract text from file
    const rawText = await extractTextFromFile(buffer, originalname, mimetype);

    if (!rawText || rawText.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract readable text from uploaded file.' });
    }

    // Chunk text
    const newChunks = chunkText(documentId, originalname, rawText);

    if (newChunks.length === 0) {
      return res.status(400).json({ error: 'Extracted text was too short to index.' });
    }

    const newDoc: DocumentRecord = {
      id: documentId,
      name: originalname,
      mimeType: mimetype,
      size,
      uploadedAt: new Date().toISOString(),
      chunkCount: newChunks.length,
      rawTextPreview: rawText.slice(0, 300) + (rawText.length > 300 ? '...' : ''),
      summary: `Indexed ${newChunks.length} sections (${Math.round(size / 1024)} KB).`,
    };

    // Store in knowledge base
    documents.unshift(newDoc);
    knowledgeChunks.push(...newChunks);
    saveStoredData();

    return res.status(201).json({
      success: true,
      message: `File "${originalname}" processed and indexed successfully into college knowledge base.`,
      document: newDoc,
      chunksIndexed: newChunks.length,
    });
  } catch (err: any) {
    console.error('File upload error:', err);
    return res.status(500).json({
      error: 'Failed to process document',
      details: err?.message || 'Processing error',
    });
  }
});

// Delete document (Admin only)
app.delete('/api/documents/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const docIndex = documents.findIndex((d) => d.id === id);

  if (docIndex === -1) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const deletedDoc = documents.splice(docIndex, 1)[0];
  knowledgeChunks = knowledgeChunks.filter((c) => c.documentId !== id);
  saveStoredData();

  return res.json({
    success: true,
    message: `Document "${deletedDoc.name}" removed from knowledge base.`,
    remainingDocuments: documents.length,
    remainingChunks: knowledgeChunks.length,
  });
});

// Replace document (Admin only)
app.put('/api/documents/:id', requireAdmin, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const docIndex = documents.findIndex((d) => d.id === id);

    if (docIndex === -1) {
      return res.status(404).json({ error: 'Document not found to replace' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'New replacement file is required' });
    }

    const { originalname, mimetype, size, buffer } = req.file;
    const rawText = await extractTextFromFile(buffer, originalname, mimetype);

    if (!rawText || rawText.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract readable text from replacement file.' });
    }

    const newChunks = chunkText(id, originalname, rawText);

    // Remove old chunks
    knowledgeChunks = knowledgeChunks.filter((c) => c.documentId !== id);
    knowledgeChunks.push(...newChunks);

    // Update doc record
    documents[docIndex] = {
      id,
      name: originalname,
      mimeType: mimetype,
      size,
      uploadedAt: new Date().toISOString(),
      chunkCount: newChunks.length,
      rawTextPreview: rawText.slice(0, 300) + '...',
      summary: `Updated: indexed ${newChunks.length} sections (${Math.round(size / 1024)} KB).`,
    };

    saveStoredData();

    return res.json({
      success: true,
      message: `Document updated to "${originalname}" and re-indexed successfully.`,
      document: documents[docIndex],
      chunksIndexed: newChunks.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to replace document', details: err?.message });
  }
});

// Disk storage for large 3D model files (up to 150MB) without memory exhaustion
const modelDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    cb(null, publicDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'Meshy_AI_VSB_Tech_Penguin_1012173021_texture.glb');
  },
});

const uploadModel = multer({
  storage: modelDiskStorage,
  limits: { fileSize: 150 * 1024 * 1024 }, // 150 MB max
  fileFilter: (req, file, cb) => {
    const isGlb = file.originalname.toLowerCase().endsWith('.glb') ||
                  file.mimetype.includes('gltf-binary') ||
                  file.mimetype.includes('model/');
    if (isGlb) {
      cb(null, true);
    } else {
      cb(new Error('Only 3D binary GLB (.glb) files are accepted.'));
    }
  },
});

// Upload custom penguin model (Admin only)
app.post('/api/admin/model', requireAdmin, (req: Request, res: Response) => {
  uploadModel.single('model')(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'GLB model exceeds the 150 MB size limit.' });
      }
      return res.status(400).json({ error: err.message || 'GLB upload failed' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No model file provided' });
    }

    try {
      // Also update dist/ if it exists so production builds immediately reflect the new model
      const distDir = path.join(__dirname, 'dist');
      if (fs.existsSync(distDir)) {
        const distTarget = path.join(distDir, 'Meshy_AI_VSB_Tech_Penguin_1012173021_texture.glb');
        fs.copyFileSync(req.file.path, distTarget);
      }

      return res.json({
        success: true,
        message: 'GLB model updated successfully as Meshy_AI_VSB_Tech_Penguin_1012173021_texture.glb',
        filename: req.file.originalname,
        size: req.file.size,
      });
    } catch (saveErr: any) {
      console.error('Error syncing model file:', saveErr);
      return res.status(500).json({ error: 'Failed to finalize uploaded model file', details: saveErr?.message });
    }
  });
});

// Upload custom college logo (Admin only)
app.post('/api/admin/logo', requireAdmin, upload.single('logo'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No logo file provided' });
    }

    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const isSvg = req.file.originalname.endsWith('.svg') || req.file.mimetype.includes('svg');
    const targetFile = isSvg ? 'vsb_logo.svg' : 'vsb_logo.png';
    const targetPath = path.join(publicDir, targetFile);
    fs.writeFileSync(targetPath, req.file.buffer);

    return res.json({
      success: true,
      message: `Logo updated successfully as ${targetFile}`,
      file: targetFile,
      size: req.file.size,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to upload logo', details: err?.message });
  }
});

// Supabase status check
app.get('/api/admin/supabase-status', async (req: Request, res: Response) => {
  const result = await checkSupabaseConnection();
  res.json({
    configured: isSupabaseConfigured(),
    url: process.env.SUPABASE_URL ? 'Configured (' + process.env.SUPABASE_URL.slice(0, 18) + '...)' : 'Not set',
    ...result,
  });
});

// Test retrieval query (Admin / Debug)
app.post('/api/admin/test-kb', (req: Request, res: Response) => {
  const { query } = req.body;
  const chunks = searchKnowledge(query || '', 10);
  res.json({ query, matchCount: chunks.length, matches: chunks });
});

// Global error handler for API routes to always return valid JSON (prevent HTML error responses)
app.use('/api', (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Uploaded file exceeds the maximum size limit.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  console.error('API Error:', err);
  return res.status(err.status || 500).json({ error: err?.message || 'Internal server error' });
});

// ================= VITE DEV OR STATIC PRODUCTION =================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  // Serve static public folder (includes Meshy_AI_VSB_Tech_Penguin_1012173021_texture.glb)
  app.use(express.static(path.join(__dirname, 'public')));

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VSB AI Chatbot server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
});
