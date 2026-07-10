import { describe, expect, it } from 'vitest';
import { paginateItems } from './pagination';

describe('paginateItems', () => {
  it('returns the requested slice and metadata for page 1 with 10 per page', () => {
    const items = Array.from({ length: 25 }, (_, index) => index + 1);

    const result = paginateItems(items, 1, 10);

    expect(result.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
    expect(result.hasNextPage).toBe(true);
    expect(result.hasPreviousPage).toBe(false);
  });

  it('returns the last page slice when page exceeds bounds', () => {
    const items = Array.from({ length: 12 }, (_, index) => index + 1);

    const result = paginateItems(items, 5, 10);

    expect(result.items).toEqual([11, 12]);
    expect(result.currentPage).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPreviousPage).toBe(true);
  });
});
