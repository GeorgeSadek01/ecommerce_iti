import { validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';

/**
 * Express middleware that runs `validationResult()` after express-validator
 * chains and short-circuits with a 422 response when any errors are present.
 *
 * Place this middleware AFTER the validator chain and BEFORE the handler:
 *
 * @example
 *   router.post('/register', registerValidator, validateRequest, registerHandler);
 *
 * On failure, attaches `errors` to the thrown AppError so the global error
 * handler can include them in the response body.
 */
const validateRequest = (req, _res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const formatted = result.array().map((e) => ({ field: e.path, message: e.msg }));
    const err = new AppError('Validation failed.', 422);
    err.errors = formatted;
    return next(err);
  }
  next();
};

export default validateRequest;
