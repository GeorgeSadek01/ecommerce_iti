export interface NormalizedPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const toPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const normalized = Math.trunc(parsed);
  return normalized > 0 ? normalized : fallback;
};

const toNonNegativeInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const normalized = Math.trunc(parsed);
  return normalized >= 0 ? normalized : fallback;
};

export const normalizePagination = (
  raw: unknown,
  options: {
    fallbackPage?: number;
    fallbackLimit?: number;
    fallbackTotal?: number;
  } = {}
): NormalizedPagination => {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  const fallbackPage = toPositiveInt(options.fallbackPage ?? 1, 1);
  const fallbackLimit = toPositiveInt(options.fallbackLimit ?? 10, 10);
  const fallbackTotal = toNonNegativeInt(options.fallbackTotal ?? 0, 0);

  const page = toPositiveInt(source['page'] ?? source['currentPage'], fallbackPage);
  const limit = toPositiveInt(source['limit'] ?? source['pageSize'] ?? source['perPage'], fallbackLimit);
  const total = toNonNegativeInt(source['total'] ?? source['totalRecords'] ?? source['count'], fallbackTotal);

  const providedTotalPages = toPositiveInt(source['totalPages'] ?? source['pages'], 0);
  const totalPages = Math.max(1, providedTotalPages || Math.ceil(total / limit) || 1);

  const hasNextPage =
    typeof source['hasNextPage'] === 'boolean' ? (source['hasNextPage'] as boolean) : page < totalPages;
  const hasPrevPage = typeof source['hasPrevPage'] === 'boolean' ? (source['hasPrevPage'] as boolean) : page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
  };
};
