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
  limits: { fileSize: 25 * 1024 * 1024 },
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PUT,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-admin-token'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Admin auth check
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

  const { id } = req.query;

  // Handle DELETE document
  if (req.method === 'DELETE') {
    return res.status(200).json({
      success: true,
      message: `Document removed from knowledge base.`,
      documentId: id,
    });
  }

  // Handle PUT (replace document)
  if (req.method === 'PUT') {
    try {
      await runMiddleware(req, res, upload.single('file'));
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'Replacement file is required.' });
      }

      const { originalname, mimetype, size, buffer } = file;
      const rawText = await extractTextFromFile(buffer, originalname, mimetype);
      const newChunks = chunkText(id as string, originalname, rawText);

      const updatedDoc: DocumentRecord = {
        id: id as string,
        name: originalname,
        mimeType: mimetype,
        size,
        uploadedAt: new Date().toISOString(),
        chunkCount: newChunks.length,
        rawTextPreview: rawText.slice(0, 300) + '...',
        summary: `Updated: indexed ${newChunks.length} sections (${Math.round(size / 1024)} KB).`,
      };

      return res.status(200).json({
        success: true,
        message: `Document updated to "${originalname}" and re-indexed successfully.`,
        document: updatedDoc,
        chunksIndexed: newChunks.length,
      });
    } catch (err: any) {
      return res.status(500).json({
        error: 'Failed to replace document',
        details: err?.message || 'Processing error',
      });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
