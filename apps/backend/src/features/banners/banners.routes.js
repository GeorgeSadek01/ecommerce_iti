import { Router } from 'express';
import { getBannersHandler } from './controllers/banner.controller.js';

const router = Router();

router.get('/', getBannersHandler);

export default router;
