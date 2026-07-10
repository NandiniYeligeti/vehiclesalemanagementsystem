export interface PaginatedResult<T> {
  items: T[];
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const paginateItems = <T,>(items: T[], page: number, pageSize: number): PaginatedResult<T> => {
  const safePage = Math.max(1, Number.isFinite(page) ? page : 1);
  const safePageSize = Math.max(1, Number.isFinite(pageSize) ? pageSize : 10);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const currentPage = Math.min(safePage, totalPages);
  const startIndex = (currentPage - 1) * safePageSize;
  const endIndex = startIndex + safePageSize;

  return {
    items: items.slice(startIndex, endIndex),
    total,
    currentPage,
    totalPages,
    pageSize: safePageSize,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  };
};
