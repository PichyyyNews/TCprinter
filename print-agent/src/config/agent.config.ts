import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const agentConfig = {
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:4000',
  AGENT_TOKEN: process.env.AGENT_TOKEN || 'tcp_agent_secret_token_2026',
  PRINTER_NAME: process.env.PRINTER_NAME || 'TC-Main-Printer',
  SUMATRA_PATH: process.env.SUMATRA_PATH || 'C:\\Program Files\\SumatraPDF\\SumatraPDF.exe',
  TEMP_DIR: path.resolve(process.env.TEMP_DIR || './temp_spool'),
  USE_SIMULATION: process.env.USE_SIMULATION === 'true' || process.env.USE_SIMULATION === undefined,
};
