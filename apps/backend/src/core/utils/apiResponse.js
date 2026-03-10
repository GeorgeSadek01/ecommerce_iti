/**
 * Standardised API response helpers.
 * Keeps controller code clean and responses consistent.
 */

/**
 * Send a successful JSON response.
 *
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {*} [data]
 */
export const sendSuccess = (res, statusCode, message, data = null) => {
  const body = { status: 'success', message };
  if (data !== null) body.data = data;
  res.status(statusCode).json(body);
};

/**
 * Send a failure JSON response (operational / validation errors).
 *
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {*} [errors]
 */
export const sendFail = (res, statusCode, message, errors = null) => {
  const body = { status: 'fail', message };
  if (errors !== null) body.errors = errors;
  res.status(statusCode).json(body);
};
