import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { agentConfig } from '../config/agent.config';

export class FileDownloaderService {
  private tempDir: string;

  constructor() {
    this.tempDir = agentConfig.TEMP_DIR;
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async downloadJobPdf(jobId: string, token: string): Promise<string> {
    const destinationPath = path.join(this.tempDir, `print_job_${jobId}.pdf`);
    const downloadUrl = `${agentConfig.BACKEND_URL}/api/v1/agent/jobs/${jobId}/download`;

    console.log(`[Downloader] Fetching PDF for job ${jobId} from ${downloadUrl}...`);

    const response = await axios({
      method: 'GET',
      url: downloadUrl,
      headers: {
        'X-Agent-Token': token || agentConfig.AGENT_TOKEN,
      },
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(destinationPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`[Downloader] Downloaded file saved to: ${destinationPath}`);
        resolve(destinationPath);
      });
      writer.on('error', reject);
    });
  }

  cleanupFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[Downloader] Local cache file removed: ${filePath}`);
      }
    } catch (err) {
      console.error(`[Downloader] Error removing cache file ${filePath}:`, err);
    }
  }
}
