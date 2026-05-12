import { useMemo, useState, useEffect } from 'react';

export function usePagination(items = [], { pageSize = 25, initialPage = 1 } = {}) {
  const [page, setPage] = useState(initialPage);
  const safePageSize = Math.max(1, Number(pageSize) || 25);
  const totalItems = Array.isArray(items) ? items.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));

  useEffect(() => {
    setPage((current) => Math.min(Math.max(1, current), totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * safePageSize;
    return (Array.isArray(items) ? items : []).slice(start, start + safePageSize);
  }, [items, page, safePageSize]);

  return {
    page,
    setPage,
    pageSize: safePageSize,
    totalItems,
    totalPages,
    pageItems,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    nextPage: () => setPage((current) => Math.min(totalPages, current + 1)),
    prevPage: () => setPage((current) => Math.max(1, current - 1)),
    resetPage: () => setPage(1),
  };
}

export default usePagination;
