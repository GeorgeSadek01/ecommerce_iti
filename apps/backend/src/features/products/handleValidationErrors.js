import { validationResult } from 'express-validator';

// ─── Validation Error Handler Middleware ─────────────────────────────────────
export const
handleValidationErrors = (req, res, next) => {
       const errors = validationResult(req);
         if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        } next();
};