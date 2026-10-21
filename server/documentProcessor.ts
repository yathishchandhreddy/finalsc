import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { DocumentChunk } from './knowledgeBase.js';

export async function extractTextFromFile(
  buffer: Buffer,
  originalFilename: string,
  mimetype: string
): Promise<string> {
  const ext = originalFilename.split('.').pop()?.toLowerCase() || '';

  if (ext === 'txt' || ext === 'csv' || mimetype.includes('text/plain') || mimetype.includes('text/csv')) {
    if (ext === 'csv') {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      return XLSX.utils.sheet_to_csv(worksheet);
    }
    return buffer.toString('utf-8');
  }

  if (ext === 'xlsx' || ext === 'xls' || mimetype.includes('spreadsheet') || mimetype.includes('excel')) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const textPieces: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      if (csv.trim()) {
        textPieces.push(`--- Sheet: ${sheetName} ---\n${csv}`);
      }
    }
    return textPieces.join('\n\n');
  }

  if (ext === 'docx' || mimetype.includes('wordprocessingml')) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (ext === 'pdf' || mimetype.includes('pdf')) {
    try {
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      await parser.destroy();
      return textResult.text || '';
    } catch (pdfErr) {
      console.warn('PDF parsing error, attempting string fallback:', pdfErr);
      return buffer.toString('utf-8');
    }
  }

  // Fallback as UTF-8 string
  return buffer.toString('utf-8');
}

export function chunkText(
  documentId: string,
  documentName: string,
  text: string,
  maxChunkSize: number = 800,
  overlap: number = 150
): DocumentChunk[] {
  const clean = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!clean) return [];

  const chunks: DocumentChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < clean.length) {
    let endIndex = startIndex + maxChunkSize;
    if (endIndex >= clean.length) {
      endIndex = clean.length;
    } else {
      // Find natural boundary (newline or period)
      const lastNewline = clean.lastIndexOf('\n', endIndex);
      const lastPeriod = clean.lastIndexOf('. ', endIndex);
      const boundary = Math.max(lastNewline, lastPeriod);
      if (boundary > startIndex + 200) {
        endIndex = boundary + 1;
      }
    }

    const chunkContent = clean.slice(startIndex, endIndex).trim();
    if (chunkContent.length > 20) {
      chunks.push({
        documentId,
        documentName,
        content: chunkContent,
        index: chunkIndex++
      });
    }

    if (endIndex >= clean.length) break;
    startIndex = Math.max(startIndex + 100, endIndex - overlap);
  }

  return chunks;
}
