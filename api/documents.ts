import { DEFAULT_VSB_DOCUMENTS, DEFAULT_VSB_KNOWLEDGE } from '../src/utils/collegeKnowledge.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    documents: DEFAULT_VSB_DOCUMENTS,
    totalChunks: DEFAULT_VSB_KNOWLEDGE.length,
    modelExists: true,
  });
}
