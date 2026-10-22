import multer from 'multer';
import { extractTextFromFile, chunkText } from '../../server/documentProcessor.js';
import { DocumentRecord } from '../../server/knowledgeBase.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-admin-token'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Verify Admin authorization
  const ADMIN_SECRET = process.env.ADMIN_SECRET || 'vsbadmin2025';
  const authHeader = req.headers.authorization;
  const adminToken = req.headers['x-admin-token'] as string;
  const providedKey =
    (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '') ||
    adminToken ||
    (req.query?.token as string);

  if (!providedKey || providedKey !== ADMIN_SECRET) {
    return res.status(401).json({
      error: 'Unauthorized: Valid college administrator key required',
    });
  }

  try {
    // Process multipart/form-data via multer
    await runMiddleware(req, res, upload.single('file'));

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file was uploaded in request.' });
    }

    const { originalname, mimetype, size, buffer } = file;
    const documentId = 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // Extract text from uploaded document (TXT, CSV, XLSX, PDF, DOCX)
    const rawText = await extractTextFromFile(buffer, originalname, mimetype);

    if (!rawText || rawText.trim().length === 0) {
      return res.status(400).json({
        error: 'Could not extract readable text from uploaded file. Please ensure file contains plain text or standard tabular data.',
      });
    }

    // Chunk text for retrieval indexing
    const newChunks = chunkText(documentId, originalname, rawText);

    if (newChunks.length === 0) {
      return res.status(400).json({
        error: 'Extracted text was too short to generate indexed sections.',
      });
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

    return res.status(200).json({
      success: true,
      message: `File "${originalname}" processed and indexed successfully (${newChunks.length} sections).`,
      document: newDoc,
      chunksIndexed: newChunks.length,
    });
  } catch (err: any) {
    console.error('Vercel serverless document upload error:', err);
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Uploaded file exceeds the maximum 25 MB limit.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    return res.status(500).json({
      error: 'Failed to process and index uploaded document',
      details: err?.message || 'Processing error',
    });
  }
}
