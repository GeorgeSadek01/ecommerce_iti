import { PAGINATION } from "../config/constants.js";

/**
 * Extract and normalise pagination params from `req.query`.
 *
 * @param {object} query - Express `req.query`
 * @returns {{ page: number, limit: number, skip: number }}
 *
 * @example
 *   const { page, limit, skip } = getPaginationParams(req.query);
 *   const docs = await Product.find(filter).skip(skip).limit(limit);
 */
export const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT),
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build the pagination metadata object to include in API responses.
 *
 * @param {{ page: number, limit: number, total: number }} params
 * @returns {{ page: number, limit: number, total: number, totalPages: number, hasNextPage: boolean, hasPrevPage: boolean }}
 *
 * @example
 *   const total = await Product.countDocuments(filter);
 *   res.json({ data: docs, pagination: buildPaginationMeta({ page, limit, total }) });
 */
export const buildPaginationMeta = ({ page, limit, total }) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};


/**
 * Pagination Helper
 * Calculates skip and limit for database queries
 */
// ─── Pagination Helper ───────────────────────────────────────────────────────
export const calculatePagination = (page = 1, limit = 10) => {
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  // Validate page and limit
  if (isNaN(pageNum) || pageNum < 1) {
    return { page: 1, limit: limitNum, skip: 0 };
  }
  if (isNaN(limitNum) || limitNum < 1) {
    return { page: pageNum, limit: 10, skip: (pageNum - 1) * 10 };
  }

  const skip = (pageNum - 1) * limitNum;
  return { page: pageNum, limit: limitNum, skip };
};
// ─── Pagination Metadata Helper ─────────────────────────────────────────────
export const getPaginationMetadata = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    currentPage: page,
    pageSize: limit,
    totalRecords: total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
