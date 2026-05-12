import { useMemo, useState } from 'react';

const normalize = (value) => String(value ?? '').toLowerCase().trim();

export function useV2DataTable(items = [], {
  pageSize = 20,
  searchKeys = [],
  initialFilters = {},
  filterFns = {},
  sortFn,
} = {}) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);

  const filteredItems = useMemo(() => {
    const query = normalize(search);
    return items
      .filter((item) => {
        if (!query) return true;
        if (!searchKeys.length) return normalize(JSON.stringify(item)).includes(query);
        return searchKeys.some((key) => normalize(typeof key === 'function' ? key(item) : item?.[key]).includes(query));
      })
      .filter((item) => Object.entries(filters).every(([key, value]) => {
        if (!value || value === 'all') return true;
        const fn = filterFns[key];
        return typeof fn === 'function' ? fn(item, value) : normalize(item?.[key]) === normalize(value);
      }))
      .sort(sortFn || (() => 0));
  }, [items, search, searchKeys, filters, filterFns, sortFn]);

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredItems.slice((safePage - 1) * pageSize, safePage * pageSize);

  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const setSearchValue = (value) => {
    setSearch(value);
    setPage(1);
  };

  const reset = () => {
    setSearch('');
    setFilters(initialFilters);
    setPage(1);
  };

  return {
    search,
    setSearch: setSearchValue,
    filters,
    setFilter,
    page: safePage,
    setPage,
    pageSize,
    totalItems,
    totalPages,
    filteredItems,
    pageItems,
    reset,
  };
}

export default useV2DataTable;
