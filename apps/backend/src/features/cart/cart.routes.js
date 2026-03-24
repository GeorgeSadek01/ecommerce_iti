import express from 'express';
import AppError from '../../core/utils/AppError.js';

const router = express.Router();

router.all('*', (_req, _res, next) => {
  next(new AppError('Cart endpoints are not implemented yet.', 501));
});

export default router;
