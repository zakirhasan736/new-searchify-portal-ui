"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PAGE_SIZES, selectPageSize, setPageSize } from "@/store/uiSlice";

export function pageWindow(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const items = [1];
  let start = Math.max(2, Math.min(page - 1, pages - 4));
  let end = Math.min(pages - 1, Math.max(page + 1, 5));
  if (start === 3) start = 2;
  if (end === pages - 2) end = pages - 1;
  if (start > 2) items.push("gap-start");
  for (let i = start; i <= end; i += 1) items.push(i);
  if (end < pages - 1) items.push("gap-end");
  items.push(pages);
  return items;
}

export function usePagination(table, rows, resetKey = "") {
  const dispatch = useDispatch();
  const size = useSelector(selectPageSize(table));
  const [page, setPage] = useState(1);
  const total = rows?.length || 0;
  const pages = Math.max(1, Math.ceil(total / size));

  useEffect(() => {
    setPage(1);
  }, [resetKey, size]);

  const current = Math.min(page, pages);
  const pageRows = useMemo(
    () => (rows || []).slice((current - 1) * size, current * size),
    [rows, current, size],
  );

  return {
    rows: pageRows,
    page: current,
    pages,
    size,
    total,
    setPage: (next) => setPage(Math.min(Math.max(1, next), pages)),
    setSize: (next) => dispatch(setPageSize({ table, size: next })),
  };
}

export default function Paginator({ pager, label = "rows" }) {
  const { page, pages, size, total, setPage, setSize } = pager;
  if (!total) return null;
  const from = (page - 1) * size + 1;
  const to = Math.min(total, page * size);

  return (
    <nav className="sf-pager" aria-label={`Pages of ${label}`}>
      <span className="sf-pager-count">
        Showing {from}–{to} of {total} {label}
      </span>
      {pages > 1 && (
        <div className="sf-pager-pages">
          <button type="button" onClick={() => setPage(page - 1)} disabled={page === 1} aria-label="Previous page">
            ‹
          </button>
          {pageWindow(page, pages).map((item) =>
            typeof item === "number" ? (
              <button
                key={item}
                type="button"
                className={item === page ? "on" : ""}
                aria-current={item === page ? "page" : undefined}
                onClick={() => setPage(item)}
              >
                {item}
              </button>
            ) : (
              <span key={item} className="sf-pager-gap">…</span>
            ),
          )}
          <button type="button" onClick={() => setPage(page + 1)} disabled={page === pages} aria-label="Next page">
            ›
          </button>
        </div>
      )}
      <label className="sf-pager-size">
        Per page
        <select value={size} onChange={(e) => setSize(Number(e.target.value))}>
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>
    </nav>
  );
}
