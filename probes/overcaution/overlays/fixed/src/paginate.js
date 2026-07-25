/** Slice of `items` for a 1-indexed page. */
export function pageSlice(items, page, perPage) {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}

/** Number of pages needed to show `total` items at `perPage` per page. */
export function pageCount(total, perPage) {
  return Math.ceil(total / perPage);
}

/** Page-number list for the pager widget. */
export function pageNumbers(total, perPage) {
  return Array.from({ length: pageCount(total, perPage) }, (_, i) => i + 1);
}
