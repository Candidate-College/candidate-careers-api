// @ts-nocheck
/**
 * Unit tests for pagination utility.
 */

const { paginate } = require('@/utilities/pagination');

describe('paginate()', () => {
  it('returns paginated result with totals', async () => {
    const dataRows = Array.from({ length: 30 }, (_, i) => ({ id: i + 1 }));

    // Fake query builder mimicking minimal knex/objection interface used by paginate
    const qb = {
      _data: dataRows,
      clone() {
        // simple clone returning new shallow object sharing data
        return { ...this };
      },
      clearSelect() {
        return this;
      },
      count() {
        return this;
      },
      first() {
        return Promise.resolve({ total: this._data.length });
      },
      limit(size) {
        this._limit = size;
        return this;
      },
      offset() {
        const rows = this._data.slice(0, this._limit ?? this._data.length);
        return Promise.resolve(rows);
      },
    };

    const result = await paginate(qb, { page: 1, pageSize: 10 });

    expect(result.data).toHaveLength(10);
    expect(result.total).toBe(30);
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(1);
  });
});
