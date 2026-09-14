import { Router } from 'express';
import { handleGetQuote, handleCreateJob, handleGetJobStatus } from '../controllers/job.controller';
import { pdfUpload } from '../middlewares/upload.middleware';

const router = Router();

router.post('/quote', pdfUpload.single('file'), handleGetQuote);
router.post('/create', handleCreateJob);
router.get('/:id/status', handleGetJobStatus);

export default router;
