import fs from 'fs';
import pdfParse from 'pdf-parse';
import { logger } from '../lib/logger';

export interface PdfMetadata {
  pageCount: number;
  info?: Record<string, unknown>;
}

export async function parsePdfFile(filePath: string): Promise<PdfMetadata> {
  const dataBuffer = fs.readFileSync(filePath);

  try {
    const data = await pdfParse(dataBuffer);
    const pageCount = data.numpages || 1;
    return {
      pageCount,
      info: data.info,
    };
  } catch (err) {
    logger.warn(`pdf-parse standard engine failed on ${filePath}, attempting structural inspection fallback`);
    const content = dataBuffer.toString('latin1');
    const matches = content.match(/\/Type\s*\/Page[^s]/g);
    if (matches && matches.length > 0) {
      return {
        pageCount: matches.length,
      };
    }
    logger.error(`Failed to parse PDF file at ${filePath}:`, err);
    throw new Error('Unable to read PDF file. The file may be encrypted or corrupted.');
  }
}
