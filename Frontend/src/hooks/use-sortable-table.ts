'use client';

import { useState, useEffect, useMemo, useRef } from 'react';

export type SortDir = 'asc' | 'desc' | null;

export interface SortState {
  key: string;
  dir: SortDir;
}

export function useSortableTable<T extends Record<string, any>>(data: T[] | undefined, defaultSort?: SortState) {
  const [sort, setSort] = useState<SortState>(defaultSort || { key: '', dir: null });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const dataRef = useRef(data);

  // Reset page to 1 when data reference changes (API filter, API pagination, etc.)
  useEffect(() => {
    if (data !== dataRef.current) {
      dataRef.current = data;
      setPage(1);
    }
  }, [data]);

  const toggleSort = (key: string) => {
    setSort(prev => {
      if (prev.key === key) {
        if (prev.dir === 'asc') return { key, dir: 'desc' };
        if (prev.dir === 'desc') return { key: '', dir: null };
      }
      return { key, dir: 'asc' };
    });
  };

  const processed = useMemo(() => {
    if (!data) return { sorted: [], total: 0, totalPages: 0 };

    // Filter by search
    let filtered = data;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = data.filter(item =>
        Object.values(item).some(v =>
          String(v || '').toLowerCase().includes(q)
        )
      );
    }

    // Sort
    const sorted = [...filtered];
    if (sort.key && sort.dir) {
      sorted.sort((a, b) => {
        const va = a[sort.key];
        const vb = b[sort.key];
        if (va == null) return 1;
        if (vb == null) return -1;
        if (typeof va === 'number' && typeof vb === 'number') {
          return sort.dir === 'asc' ? va - vb : vb - va;
        }
        const sa = String(va).toLowerCase();
        const sb = String(vb).toLowerCase();
        return sort.dir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
      });
    }

    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const paged = sorted.slice(start, start + pageSize);

    return { sorted: paged, total, totalPages };
  }, [data, search, sort, page]);

  // Reset page when search changes
  const handleSearch = (q: string) => {
    setSearch(q);
    setPage(1);
  };

  const sortIcon = (key: string) => {
    if (sort.key !== key) return ' ⇅';
    return sort.dir === 'asc' ? ' ↑' : ' ↓';
  };

  return {
    ...processed,
    sort,
    search,
    page,
    pageSize,
    setPage,
    toggleSort,
    setSearch: handleSearch,
    sortIcon,
  };
}
