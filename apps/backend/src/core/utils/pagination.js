/**
 * Pagination Helper
 * Calculates skip and limit for database queries
 */

const calculatePagination = (page = 1, limit = 10) => {
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

const getPaginationMetadata = (total, page, limit) => {
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

module.exports = { calculatePagination, getPaginationMetadata };
