import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { runPython } from '../services/ml.js';
const router = Router();
router.get('/metrics', protect, async (_req, res) => res.json(await runPython(['--metrics'])));
export default router;
